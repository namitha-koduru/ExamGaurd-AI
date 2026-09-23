/**
 * SmartExam AI - Full-Stack Express Server & API Engine
 * Mounts Vite dev middleware & provides complete REST / Real-time APIs
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { db } from './src/data/mockStore';
import {
  extractFeaturesFromEvents,
  calculateExplainableRisk,
  getBaselineFeatureComparison,
} from './src/ml/isolationForest';
import {
  BehaviorEvent,
  ExamSession,
  User,
  Exam,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple Bearer token helper (in-memory demo tokens: "token-<userId>")
function authenticateUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  // Support direct user id or token-<userId>
  const userId = token.replace('token-', '');
  return db.users.get(userId) || null;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user
  let matchedUser: User | undefined;
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid email or credentials' });
  }

  const expectedPass = db.userPasswords.get(matchedUser.email) || 'password123';
  if (password !== expectedPass && password !== 'password123') {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = `token-${matchedUser.id}`;
  return res.json({
    token,
    user: matchedUser,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return res.status(409).json({ error: 'Email already registered' });
    }
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role === 'EXAMINER' ? 'EXAMINER' : 'STUDENT',
    createdAt: new Date().toISOString(),
  };

  db.users.set(newUser.id, newUser);
  db.userPasswords.set(newUser.email, password);

  const token = `token-${newUser.id}`;
  return res.status(201).json({
    token,
    user: newUser,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized or token expired' });
  }
  return res.json({ user });
});

// -------------------------------------------------------------
// Exams Endpoints
// -------------------------------------------------------------

app.get('/api/exams', (_req: Request, res: Response) => {
  const list = Array.from(db.exams.values());
  return res.json({ exams: list });
});

app.post('/api/exams', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user || (user.role !== 'EXAMINER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Only examiners can create exams' });
  }

  const { title, courseCode, description, durationMinutes, questions } = req.body;
  if (!title || !durationMinutes) {
    return res.status(400).json({ error: 'Title and duration are required' });
  }

  const examId = `exam-${Date.now()}`;
  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  const totalMarks = Array.isArray(questions)
    ? questions.reduce((sum: number, q: any) => sum + (q.marks || 5), 0)
    : 50;

  const newExam: Exam = {
    id: examId,
    title,
    courseCode: courseCode || 'EXAM',
    description: description || '',
    durationMinutes: Number(durationMinutes),
    totalMarks,
    totalQuestions,
    status: 'ACTIVE',
    createdBy: user.name,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.exams.set(examId, newExam);

  if (Array.isArray(questions) && questions.length > 0) {
    const formattedQuestions = questions.map((q, idx) => ({
      id: `q-${examId}-${idx + 1}`,
      examId,
      questionText: q.questionText || `Question ${idx + 1}`,
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      marks: q.marks || 5,
      orderIndex: idx,
      category: q.category || 'General',
      correctAnswer: q.correctAnswer ?? 0,
    }));
    db.questions.set(examId, formattedQuestions);
  } else {
    db.questions.set(examId, []);
  }

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'EXAM_CREATED',
    targetId: examId,
    details: `Created new exam "${title}" with ${totalQuestions} questions`,
  });

  return res.status(201).json({ exam: newExam });
});

app.get('/api/exams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const exam = db.exams.get(id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  const rawQuestions = db.questions.get(id) || [];
  const user = authenticateUser(req);
  const isExaminer = user && (user.role === 'EXAMINER' || user.role === 'ADMIN');

  // Strip correct answers if requested by student
  const sanitizedQuestions = rawQuestions.map((q) => {
    if (isExaminer) return q;
    const { correctAnswer, ...studentFacing } = q;
    return studentFacing;
  });

  return res.json({ exam, questions: sanitizedQuestions });
});

app.delete('/api/exams/:id', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user || (user.role !== 'EXAMINER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized to delete exam' });
  }
  const { id } = req.params;
  if (!db.exams.has(id)) {
    return res.status(404).json({ error: 'Exam not found' });
  }
  db.exams.delete(id);
  db.questions.delete(id);
  return res.json({ success: true, message: 'Exam deleted successfully' });
});

// -------------------------------------------------------------
// Exam Sessions Endpoints
// -------------------------------------------------------------

app.post('/api/exams/:id/start', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to start exam' });
  }

  const { id } = req.params;
  const exam = db.exams.get(id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Check if active session already exists for this student & exam
  for (const s of db.sessions.values()) {
    if (s.examId === id && s.studentId === user.id && s.status === 'ACTIVE') {
      const qList = db.questions.get(id) || [];
      const sanitized = qList.map(({ correctAnswer, ...rest }) => rest);
      return res.json({ session: s, exam, questions: sanitized });
    }
  }

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newSession: ExamSession = {
    id: sessionId,
    examId: exam.id,
    examTitle: exam.title,
    studentId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    status: 'ACTIVE',
    answers: {},
    progress: 0,
    riskScore: 0,
    riskLevel: 'NORMAL',
    proctorStatus: 'UNREVIEWED',
  };

  db.sessions.set(sessionId, newSession);
  db.sessionEvents.set(sessionId, [
    {
      id: `ev-${Date.now()}`,
      sessionId,
      eventType: 'ANSWER_STARTED',
      timestamp: Date.now(),
      relativeSeconds: 0,
      metadata: { context: 'exam_commenced' },
    },
  ]);

  db.notifyProctors('SESSION_STARTED', newSession);

  const qList = db.questions.get(id) || [];
  const sanitized = qList.map(({ correctAnswer, ...rest }) => rest);

  return res.status(201).json({ session: newSession, exam, questions: sanitized });
});

// Periodic answer autosave
app.post('/api/sessions/:id/answers', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { answers, currentQuestionIndex } = req.body;
  if (answers && typeof answers === 'object') {
    session.answers = { ...session.answers, ...answers };
    const totalQ = db.questions.get(session.examId)?.length || 1;
    const answeredCount = Object.keys(session.answers).length;
    session.progress = Math.round((answeredCount / Math.max(1, totalQ)) * 100);
  }

  // Update session duration estimate
  const startMs = new Date(session.startedAt).getTime();
  session.durationSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));

  return res.json({
    success: true,
    progress: session.progress,
    answersCount: Object.keys(session.answers).length,
    serverTimestamp: Date.now(),
  });
});

// Final submission
app.post('/api/sessions/:id/submit', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { answers } = req.body;
  if (answers && typeof answers === 'object') {
    session.answers = { ...session.answers, ...answers };
  }

  session.submittedAt = new Date().toISOString();
  session.status = 'SUBMITTED';
  const startMs = new Date(session.startedAt).getTime();
  session.durationSeconds = Math.max(1, Math.round((Date.now() - startMs) / 1000));

  // Compute final behavioral features and anomaly report
  const events = db.sessionEvents.get(id) || [];
  const totalQuestions = db.questions.get(session.examId)?.length || 8;
  const features = extractFeaturesFromEvents(events, session.durationSeconds, totalQuestions);
  const anomalyReport = calculateExplainableRisk(features, true);
  anomalyReport.sessionId = id;

  session.features = features;
  session.anomalyReport = anomalyReport;
  session.riskScore = anomalyReport.riskScore;
  session.riskLevel = anomalyReport.riskLevel;

  db.notifyProctors('SESSION_SUBMITTED', {
    sessionId: session.id,
    studentName: session.studentName,
    examTitle: session.examTitle,
    riskScore: session.riskScore,
    riskLevel: session.riskLevel,
    submittedAt: session.submittedAt,
  });

  return res.json({
    session,
    anomalyReport,
    message: 'Examination submitted successfully.',
  });
});

// -------------------------------------------------------------
// Behavioral Events & Telemetry Ingestion
// -------------------------------------------------------------

app.post('/api/behavior/events', (req: Request, res: Response) => {
  const { sessionId, events } = req.body;
  if (!sessionId || !Array.isArray(events)) {
    return res.status(400).json({ error: 'sessionId and events array required' });
  }

  const session = db.sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const currentEvents = db.sessionEvents.get(sessionId) || [];
  const startEpoch = new Date(session.startedAt).getTime();

  for (const rawEv of events) {
    const ts = rawEv.timestamp || Date.now();
    const relativeSeconds = Math.max(0, Math.round((ts - startEpoch) / 1000));
    const processedEvent: BehaviorEvent = {
      id: rawEv.id || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      eventType: rawEv.eventType,
      timestamp: ts,
      relativeSeconds,
      metadata: rawEv.metadata || {},
    };
    currentEvents.push(processedEvent);
  }
  db.sessionEvents.set(sessionId, currentEvents);

  // Re-run live interim risk scoring
  const totalQ = db.questions.get(session.examId)?.length || 8;
  const elapsedSec = Math.max(1, Math.round((Date.now() - startEpoch) / 1000));
  session.durationSeconds = elapsedSec;

  const features = extractFeaturesFromEvents(currentEvents, elapsedSec, totalQ);
  const liveReport = calculateExplainableRisk(features, true);
  liveReport.sessionId = sessionId;

  session.features = features;
  session.anomalyReport = liveReport;
  session.riskScore = liveReport.riskScore;
  session.riskLevel = liveReport.riskLevel;

  db.notifyProctors('BEHAVIOR_UPDATE', {
    sessionId,
    studentName: session.studentName,
    riskScore: session.riskScore,
    riskLevel: session.riskLevel,
    eventCount: currentEvents.length,
    latestEventType: events[events.length - 1]?.eventType,
  });

  return res.json({
    success: true,
    processedCount: events.length,
    liveRiskScore: liveReport.riskScore,
    liveRiskLevel: liveReport.riskLevel,
  });
});

// -------------------------------------------------------------
// Proctor / Examiner Session Queries
// -------------------------------------------------------------

app.get('/api/sessions', (req: Request, res: Response) => {
  const { examId, riskLevel, status } = req.query;
  let list = Array.from(db.sessions.values());

  if (examId) {
    list = list.filter((s) => s.examId === examId);
  }
  if (riskLevel && riskLevel !== 'ALL') {
    list = list.filter((s) => s.riskLevel === riskLevel);
  }
  if (status) {
    list = list.filter((s) => s.status === status);
  }

  // Sort by startedAt desc
  list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return res.json({ sessions: list });
});

app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const events = db.sessionEvents.get(id) || [];
  const comparison = session.features ? getBaselineFeatureComparison(session.features) : [];

  return res.json({
    session,
    eventsCount: events.length,
    anomalyReport: session.anomalyReport,
    featureComparison: comparison,
  });
});

app.get('/api/sessions/:id/timeline', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const events = db.sessionEvents.get(id) || [];
  return res.json({ timeline: events });
});

app.patch('/api/sessions/:id/review', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user || (user.role !== 'EXAMINER' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Examiner privileges required' });
  }

  const { id } = req.params;
  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { proctorNotes, proctorStatus } = req.body;
  if (proctorNotes !== undefined) session.proctorNotes = proctorNotes;
  if (proctorStatus) session.proctorStatus = proctorStatus;

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'SESSION_AUDITED',
    targetId: id,
    details: `Updated session review status to "${proctorStatus || session.proctorStatus}" with notes: ${proctorNotes || 'none'}`,
  });

  return res.json({ session });
});

// -------------------------------------------------------------
// Examiner Analytics & Audit Logs
// -------------------------------------------------------------

app.get('/api/analytics/overview', (_req: Request, res: Response) => {
  const allSessions = Array.from(db.sessions.values());
  const activeCount = allSessions.filter((s) => s.status === 'ACTIVE').length;
  const completedCount = allSessions.filter((s) => s.status === 'SUBMITTED').length;

  const normalCount = allSessions.filter((s) => s.riskLevel === 'NORMAL').length;
  const lowConcernCount = allSessions.filter((s) => s.riskLevel === 'LOW_CONCERN').length;
  const reviewCount = allSessions.filter((s) => s.riskLevel === 'REVIEW').length;
  const highAnomalyCount = allSessions.filter((s) => s.riskLevel === 'HIGH_ANOMALY').length;

  const avgRisk =
    allSessions.length > 0
      ? Math.round(allSessions.reduce((sum, s) => sum + s.riskScore, 0) / allSessions.length)
      : 0;

  // Telemetry aggregates
  let totalFocusLossEvents = 0;
  let totalCopyEvents = 0;
  let totalPasteEvents = 0;
  allSessions.forEach((s) => {
    if (s.features) {
      totalFocusLossEvents += s.features.focus_loss_count;
      totalCopyEvents += s.features.copy_count;
      totalPasteEvents += s.features.paste_count;
    }
  });

  return res.json({
    metrics: {
      totalExams: db.exams.size,
      totalStudents: Array.from(db.users.values()).filter((u) => u.role === 'STUDENT').length,
      activeStudents: activeCount,
      completedSessions: completedCount,
      normalSessions: normalCount,
      lowConcernSessions: lowConcernCount,
      reviewRequiredSessions: reviewCount,
      highAnomalySessions: highAnomalyCount,
      averageSessionRisk: avgRisk,
      totalFocusLossEvents,
      totalCopyEvents,
      totalPasteEvents,
    },
    riskDistribution: [
      { name: 'Normal (0-29)', count: normalCount, color: '#10B981' },
      { name: 'Low Concern (30-54)', count: lowConcernCount, color: '#3B82F6' },
      { name: 'Review (55-74)', count: reviewCount, color: '#F59E0B' },
      { name: 'High Anomaly (75-100)', count: highAnomalyCount, color: '#EF4444' },
    ],
  });
});

app.get('/api/audit-logs', (_req: Request, res: Response) => {
  return res.json({ logs: db.auditLogs });
});

// SSE Stream for Real-time Proctor Live Feed
app.get('/api/proctor/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const listener = (event: { type: string; payload: any }) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  db.sseListeners.add(listener);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', payload: { time: Date.now() } })}\n\n`);

  req.on('close', () => {
    db.sseListeners.delete(listener);
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    platform: 'SmartExam AI',
    version: '1.2.0',
    model: 'Isolation Forest v1.2',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Configuration
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartExam AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SmartExam AI] Fatal server error:', err);
});
