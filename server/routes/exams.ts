/**
 * ExamGuard AI - Exam Management Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { requireAuth, requireRole, AuthRequest } from '../auth/authService';
import { Exam, Question } from '../../src/types';

const router = Router();

// GET /api/exams - List all available exams
router.get('/', async (req, res) => {
  try {
    const examsRes = await db.exams().find();
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

// POST /api/exams - Create a new exam with questions (Examiner only)
router.post('/', requireAuth, requireRole(['EXAMINER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const {
      title,
      courseCode,
      description,
      durationMinutes,
      totalMarks,
      questions = [],
      settings = {},
    } = req.body;

    if (!title || !courseCode || !durationMinutes) {
      return res.status(400).json({ error: 'Missing required exam fields (title, courseCode, durationMinutes)' });
    }

    const examId = `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

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
        correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
        explanation: q.explanation || '',
        problemStatement: q.problemStatement,
        constraints: q.constraints,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        examples: q.examples || [],
        allowedLanguages: q.allowedLanguages || ['python', 'javascript', 'typescript', 'c', 'cpp', 'java'],
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
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      description: description || '',
      durationMinutes: Number(durationMinutes),
      totalMarks: calculatedTotalMarks,
      totalQuestions: preparedQuestions.length,
      status: 'ACTIVE',
      createdBy: req.user?.name || 'Examiner',
      startTime: now,
      endTime: new Date(Date.now() + 86400000 * 14).toISOString(),
      createdAt: now,
      settings: {
        extensionRequired: !!settings.extensionRequired,
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
      timestamp: now,
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'EXAM_CREATED',
      targetId: examId,
      details: `Created exam '${newExam.title}' with ${preparedQuestions.length} questions.`,
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
