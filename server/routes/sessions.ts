/**
 * ExamGuard AI - Session & Proctoring Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { requireAuth, AuthRequest } from '../auth/authService';
import { realtimeHub } from '../realtime/sse';
import {
  extractFeaturesFromEvents,
  calculateExplainableRisk,
  getBaselineFeatureComparison,
} from '../../src/ml/isolationForest';
import { ExamSession, BehaviorEvent } from '../../src/types';

const router = Router();

// POST /api/exams/:id/start - Start a new student examination session
router.post('/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const examId = req.params.id;
    const exam = await db.exams().findOne({ id: examId });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const student = req.user!;
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const handshakeToken = `eg-tok-${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date().toISOString();

    const newSession: ExamSession = {
      id: sessionId,
      examId,
      examTitle: exam.title,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      startedAt: now,
      durationSeconds: 0,
      status: 'ACTIVE',
      answers: {},
      progress: 0,
      riskScore: 0,
      riskLevel: 'NORMAL',
      proctorStatus: 'UNREVIEWED',
      handshakeToken,
    };

    await db.sessions().insertOne(newSession);

    // Initial audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      timestamp: now,
      actorId: student.id,
      actorName: student.name,
      actorRole: student.role,
      action: 'SESSION_STARTED',
      targetId: sessionId,
      details: `Student started examination '${exam.title}'. Handshake token generated.`,
    });

    // Notify examiners via SSE
    realtimeHub.broadcast('SESSION_STARTED', {
      sessionId,
      examId,
      studentName: student.name,
      examTitle: exam.title,
      startedAt: now,
    });

    res.status(201).json({ session: newSession, handshakeToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start exam session' });
  }
});

// PUT /api/sessions/:id/answers - Autosave answers (MCQ, Coding, Descriptive)
router.put('/:id/answers', async (req, res) => {
  try {
    const { answers = {}, progress } = req.body;
    const session = await db.sessions().findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is already finalized' });
    }

    const updatedAnswers = { ...session.answers, ...answers };
    const exam = await db.exams().findOne({ id: session.examId });
    const totalQ = exam?.totalQuestions || Object.keys(updatedAnswers).length || 1;
    const answeredCount = Object.keys(updatedAnswers).length;
    const computedProgress = progress !== undefined ? progress : Math.round((answeredCount / totalQ) * 100);

    await db.sessions().updateOne(
      { id: req.params.id },
      { $set: { answers: updatedAnswers, progress: Math.min(100, computedProgress) } }
    );

    res.json({ message: 'Answers autosaved successfully', progress: computedProgress });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save answers' });
  }
});

// POST /api/sessions/:id/submit - Finalize and submit exam session
router.post('/:id/submit', async (req, res) => {
  try {
    const session = await db.sessions().findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { answers } = req.body;
    const finalAnswers = answers ? { ...session.answers, ...answers } : session.answers;
    const submittedAt = new Date().toISOString();
    const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000));

    // Calculate final behavioral telemetry features
    const allEventsRes = await db.behavior_events().find({ sessionId: req.params.id });
    const allEvents: BehaviorEvent[] = await allEventsRes.toArray();
    const exam = await db.exams().findOne({ id: session.examId });
    const totalQ = exam?.totalQuestions || 5;

    const features = extractFeaturesFromEvents(allEvents, durationSeconds, totalQ);
    const anomalyReport = calculateExplainableRisk(features, true);
    anomalyReport.sessionId = req.params.id;

    const finalSessionData = {
      answers: finalAnswers,
      progress: 100,
      submittedAt,
      durationSeconds,
      status: 'SUBMITTED' as const,
      features,
      riskScore: anomalyReport.riskScore,
      riskLevel: anomalyReport.riskLevel,
      anomalyReport,
    };

    await db.sessions().updateOne({ id: req.params.id }, { $set: finalSessionData });

    const updatedSession: ExamSession = {
      ...session,
      ...finalSessionData,
    };

    // Audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      timestamp: submittedAt,
      actorId: session.studentId,
      actorName: session.studentName,
      actorRole: 'STUDENT',
      action: 'SESSION_SUBMITTED',
      targetId: req.params.id,
      details: `Session finalized with Risk Index: ${anomalyReport.riskScore} (${anomalyReport.riskLevel}).`,
    });

    // Notify examiners via SSE
    realtimeHub.broadcast('SESSION_SUBMITTED', {
      sessionId: req.params.id,
      studentName: session.studentName,
      examTitle: session.examTitle,
      riskScore: anomalyReport.riskScore,
      riskLevel: anomalyReport.riskLevel,
      submittedAt,
    });

    res.json({ session: updatedSession, anomalyReport });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit exam session' });
  }
});

// GET /api/sessions - List sessions for examiner dashboard
router.get('/', async (req, res) => {
  try {
    const { riskLevel, status, examId, search } = req.query;
    const query: any = {};

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (examId) {
      query.examId = examId;
    }
    if (search) {
      query.studentName = { $regex: String(search), $options: 'i' };
    }

    const sessRes = await db.sessions().find(query);
    const sessions: ExamSession[] = await sessRes.toArray();
    sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list sessions' });
  }
});

// GET /api/sessions/:id - Get session forensics detail
router.get('/:id', async (req, res) => {
  try {
    const session = await db.sessions().findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    let anomalyReport = session.anomalyReport;
    let featureComparison: any[] = [];

    if (session.features) {
      featureComparison = getBaselineFeatureComparison(session.features);
    }

    if (!anomalyReport && session.features) {
      anomalyReport = calculateExplainableRisk(session.features, true);
      anomalyReport.sessionId = session.id;
    }

    res.json({
      session,
      anomalyReport,
      featureComparison,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch session detail' });
  }
});

// GET /api/sessions/:id/timeline - Get raw behavior events
router.get('/:id/timeline', async (req, res) => {
  try {
    const eventsRes = await db.behavior_events().find({ sessionId: req.params.id });
    const events: BehaviorEvent[] = (await eventsRes.toArray()).sort(
      (a: BehaviorEvent, b: BehaviorEvent) => a.timestamp - b.timestamp
    );
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch event timeline' });
  }
});

// PUT /api/sessions/:id/review - Update proctor evaluation
router.put('/:id/review', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { proctorStatus, proctorNotes } = req.body;
    const session = await db.sessions().findOne({ id: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updates: any = {};
    if (proctorStatus) updates.proctorStatus = proctorStatus;
    if (proctorNotes !== undefined) updates.proctorNotes = proctorNotes;

    await db.sessions().updateOne({ id: req.params.id }, { $set: updates });

    // Audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'PROCTOR_EVALUATION',
      targetId: req.params.id,
      details: `Status set to ${proctorStatus || session.proctorStatus}. Note: ${proctorNotes || ''}`,
    });

    realtimeHub.broadcast('SESSION_REVIEWED', {
      sessionId: req.params.id,
      proctorStatus,
      reviewer: req.user!.name,
    });

    res.json({ message: 'Proctor evaluation saved successfully', session: { ...session, ...updates } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update review' });
  }
});

export default router;
