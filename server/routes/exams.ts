/**
 * ExamGuard AI - Exam Management Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { requireAuth, requireRole, AuthRequest } from '../auth/authService';
import { Exam, Question, ExamSession } from '../../src/types';
import { generateExamCode, codesMatch } from '../../src/utils/codeGenerator';
import { realtimeHub } from '../realtime/sse';

const router = Router();

// GET /api/exams - List available exams (scoped to institution if requested or user authenticated)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const institutionId = (req.query.institutionId as string) || req.user?.institutionId;
    let query: any = {};
    if (institutionId) {
      query.institutionId = institutionId;
    }
    const examsRes = await db.exams().find(query);
    const exams: Exam[] = await examsRes.toArray();
    res.json(exams);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get specific exam with questions
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const exam = await db.exams().findOne({ id: req.params.id });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const qRes = await db.questions().find({ examId: req.params.id });
    let questions: Question[] = (await qRes.toArray()).sort((a: Question, b: Question) => a.orderIndex - b.orderIndex);

    // Sanitize integrity-critical fields if request is not an authenticated examiner
    const isExaminer = req.user?.role === 'EXAMINER' || req.user?.role === 'ADMIN';
    if (!isExaminer) {
      questions = questions.map((q) => {
        const sanitized = { ...q };
        delete sanitized.correctAnswer;
        if (sanitized.testCases) {
          sanitized.testCases = sanitized.testCases.map((tc) => ({
            ...tc,
            expectedOutput: tc.hidden ? '[Hidden Test Case]' : tc.expectedOutput,
            input: tc.hidden ? '[Hidden Test Case]' : tc.input,
          }));
        }
        return sanitized;
      });
    }

    res.json({ exam, questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch exam details' });
  }
});

// POST /api/exams/:id/validate-code - Validate teacher-provided access code & verify eligibility
router.post('/:id/validate-code', requireAuth, async (req: AuthRequest, res) => {
  try {
    const code = req.body.code || req.body.accessCode;
    const examId = req.params.id;
    const user = req.user!;

    const exam = await db.exams().findOne({ id: examId });
    if (!exam) {
      return res.status(404).json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'Exam does not exist.',
      });
    }

    // 1. Validate Code
    if (!code || !codesMatch(code, exam.accessCode || '')) {
      return res.status(400).json({
        valid: false,
        status: 'INVALID_CODE',
        message: 'Invalid Exam Code. Please verify the access key provided by your teacher.',
      });
    }

    // 1b. Check Institutional Isolation
    if (user.institutionId && exam.institutionId && user.institutionId !== exam.institutionId) {
      return res.status(403).json({
        valid: false,
        status: 'INSTITUTION_MISMATCH',
        message: `This examination is restricted to students of ${exam.institutionName || 'the issuing institution'}. Your account is affiliated with ${user.institutionName || 'another institution'}.`,
      });
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    // 2. Check Deadline & Window
    if (now < startTime) {
      return res.status(403).json({
        valid: false,
        status: 'NOT_STARTED',
        message: `This exam is scheduled to open on ${startTime.toLocaleString()}. Please wait until start time.`,
        startTime: exam.startTime,
      });
    }

    if (now > endTime) {
      return res.status(403).json({
        valid: false,
        status: 'EXPIRED',
        message: `The deadline for this exam expired on ${endTime.toLocaleString()}. Late attempts are rejected.`,
        endTime: exam.endTime,
      });
    }

    // 3. Check Already Attempted (Single attempt policy)
    const submittedCursor = await db.sessions().find({ examId, status: 'SUBMITTED' });
    const submittedSessions: ExamSession[] = await submittedCursor.toArray();
    const existingSession = submittedSessions.find(
      (s: ExamSession) => s.studentId === user.id || (user.email && s.studentEmail?.toLowerCase() === user.email.toLowerCase())
    );

    if (existingSession) {
      return res.status(403).json({
        valid: false,
        status: 'ALREADY_ATTEMPTED',
        message: 'You have already attempted this exam. Per institutional policy, each student can take the exam only once within the deadline.',
        existingSessionId: existingSession.id,
        score: existingSession.score,
        maxScore: existingSession.maxScore,
        submittedAt: existingSession.submittedAt,
      });
    }

    return res.json({
      valid: true,
      status: 'VALID',
      message: 'Exam code validated successfully. You may begin the exam.',
      exam: {
        id: exam.id,
        title: exam.title,
        courseCode: exam.courseCode,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.totalQuestions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || 'Validation error' });
  }
});

// POST /api/exams/:id/start - Authoritative start of exam session with code check
router.post('/:id/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const examId = req.params.id;
    const { accessCode } = req.body;
    const student = req.user!;

    const exam = await db.exams().findOne({ id: examId });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Validate access code if provided
    if (exam.accessCode && accessCode) {
      if (!codesMatch(accessCode, exam.accessCode)) {
        return res.status(400).json({ error: 'Invalid exam access code' });
      }
    }

    // Check deadline
    const now = new Date();
    if (exam.startTime && now < new Date(exam.startTime)) {
      return res.status(403).json({ error: 'Exam has not started yet' });
    }
    if (exam.endTime && now > new Date(exam.endTime)) {
      return res.status(403).json({ error: 'Exam deadline has expired' });
    }

    // Check single attempt
    const allExamSessionsCursor = await db.sessions().find({ examId });
    const allExamSessions: ExamSession[] = await allExamSessionsCursor.toArray();

    const existingSession = allExamSessions.find(
      (s: ExamSession) =>
        s.status === 'SUBMITTED' &&
        (s.studentId === student.id || (student.email && s.studentEmail?.toLowerCase() === student.email.toLowerCase()))
    );

    if (existingSession) {
      return res.status(403).json({
        error: 'You have already attempted this exam. Each student can take the exam only once within the deadline.',
        sessionId: existingSession.id,
      });
    }

    // Check if there is already an active (unsubmitted) session for this student
    const activeSession = allExamSessions.find(
      (s: ExamSession) =>
        s.status === 'ACTIVE' &&
        (s.studentId === student.id || (student.email && s.studentEmail?.toLowerCase() === student.email.toLowerCase()))
    );

    if (activeSession) {
      return res.json({ session: activeSession, handshakeToken: (activeSession as any).handshakeToken });
    }

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const handshakeToken = `eg-tok-${Math.random().toString(36).substring(2, 10)}`;
    const startedAt = now.toISOString();

    const newSession: ExamSession = {
      id: sessionId,
      examId,
      institutionId: exam.institutionId || student.institutionId || 'inst-vignan',
      institutionName: exam.institutionName || student.institutionName || 'Vignan University',
      examTitle: exam.title,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      startedAt,
      durationSeconds: 0,
      status: 'ACTIVE',
      answers: {},
      progress: 0,
      riskScore: 0,
      riskLevel: 'NORMAL',
      proctorStatus: 'UNREVIEWED',
      handshakeToken,
      accessCodeUsed: accessCode || exam.accessCode,
    };

    await db.sessions().insertOne(newSession);

    // Initial audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      institutionId: newSession.institutionId,
      timestamp: startedAt,
      actorId: student.id,
      actorName: student.name,
      actorRole: student.role,
      action: 'SESSION_STARTED',
      targetId: sessionId,
      details: `Student started examination '${exam.title}'. Code verified.`,
    });

    // Notify examiners via SSE
    realtimeHub.broadcast('SESSION_STARTED', {
      sessionId,
      examId,
      studentName: student.name,
      examTitle: exam.title,
      startedAt,
    });

    res.status(201).json({ session: newSession, handshakeToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to start exam session' });
  }
});

// POST /api/exams - Create a new exam with questions (Examiner only)
router.post('/', requireAuth, requireRole(['EXAMINER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      courseCode,
      description,
      durationMinutes,
      startTime,
      endTime,
      accessCode,
      totalMarks,
      questions = [],
      settings = {},
    } = req.body;

    if (!title || !courseCode || !durationMinutes) {
      return res.status(400).json({ error: 'Missing required exam fields (title, courseCode, durationMinutes)' });
    }

    const examId = `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const finalAccessCode = (accessCode && accessCode.trim().length >= 4) ? accessCode.trim().toUpperCase() : generateExamCode();

    const finalStartTime = startTime ? new Date(startTime).toISOString() : now;
    const finalEndTime = endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString();

    let mcqCount = 0;
    let codingCount = 0;
    let descriptiveCount = 0;

    const preparedQuestions: Question[] = questions.map((q: any, idx: number) => {
      const qType = q.questionType || 'MULTIPLE_CHOICE';
      if (qType === 'MULTIPLE_CHOICE') mcqCount++;
      else if (qType === 'CODING') codingCount++;
      else if (qType === 'DESCRIPTIVE') descriptiveCount++;

      return {
        id: q.id || `q-${examId}-${idx + 1}`,
        examId,
        title: q.title || `Question ${idx + 1}`,
        questionText: q.questionText || '',
        questionType: qType,
        marks: q.marks || 10,
        orderIndex: idx,
        category: q.category || 'General',
        options: q.options || [],
        correctAnswer: q.correctAnswer !== undefined ? Number(q.correctAnswer) : 0,
        explanation: q.explanation || '',
        problemStatement: q.problemStatement,
        constraints: q.constraints,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        examples: q.examples || [],
        allowedLanguages: q.allowedLanguages || ['javascript', 'python', 'typescript'],
        starterCode: q.starterCode || {},
        timeLimitMs: q.timeLimitMs || 3000,
        memoryLimitMb: q.memoryLimitMb || 256,
        testCases: q.testCases || [],
        rubric: q.rubric,
        minWords: q.minWords,
        maxWords: q.maxWords,
      };
    });

    const calculatedTotalMarks =
      totalMarks || preparedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0) || 50;

    const newExam: Exam = {
      id: examId,
      institutionId: req.user?.institutionId || 'inst-vignan',
      institutionName: req.user?.institutionName || 'Vignan University',
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      description: description || '',
      durationMinutes: Number(durationMinutes),
      totalMarks: calculatedTotalMarks,
      totalQuestions: preparedQuestions.length,
      status: 'ACTIVE',
      createdBy: req.user?.name || 'Examiner',
      accessCode: finalAccessCode,
      isPublished: true,
      startTime: finalStartTime,
      endTime: finalEndTime,
      createdAt: now,
      settings: {
        fullscreenRequired: settings.fullscreenRequired !== false,
        clipboardMonitoring: settings.clipboardMonitoring !== false,
        typingDynamics: settings.typingDynamics !== false,
        mouseDynamics: settings.mouseDynamics !== false,
        allowQuestionNavigation: settings.allowQuestionNavigation !== false,
      },
      questionDistribution: {
        mcq: mcqCount,
        coding: codingCount,
        descriptive: descriptiveCount,
      },
    };

    await db.exams().insertOne(newExam);
    if (preparedQuestions.length > 0) {
      await db.questions().insertMany(preparedQuestions);
    }

    // Audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      institutionId: newExam.institutionId,
      timestamp: now,
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'EXAM_CREATED_AND_PUBLISHED',
      targetId: examId,
      details: `Created and published exam '${newExam.title}'. Generated Key: ${finalAccessCode}. Start: ${finalStartTime}, Deadline: ${finalEndTime}.`,
    });

    res.status(201).json({ exam: newExam, questions: preparedQuestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create exam' });
  }
});

// DELETE /api/exams/:id - Delete an exam (Examiner only)
router.delete('/:id', requireAuth, requireRole(['EXAMINER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const exam = await db.exams().findOne({ id: req.params.id });
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await db.exams().deleteOne({ id: req.params.id });
    await db.questions().deleteMany({ examId: req.params.id });

    // Audit log
    await db.audit_logs().insertOne({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'EXAM_DELETED',
      targetId: req.params.id,
      details: `Deleted exam '${exam.title}'.`,
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete exam' });
  }
});

export default router;
