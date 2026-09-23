/**
 * ExamGuard AI - Coding Execution & Submission API Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { executeCode } from '../services/codingService';
import { requireAuth, AuthRequest } from '../auth/authService';
import { CodingSubmission, TestCase } from '../../src/types';
import { realtimeHub } from '../realtime/sse';

const router = Router();

// POST /api/coding/run - Run code against test cases in isolated sandbox
router.post('/run', async (req: AuthRequest, res) => {
  try {
    const { code, language = 'javascript', questionId, sessionId } = req.body;
    if (!questionId || code === undefined) {
      return res.status(400).json({ error: 'questionId and code are required' });
    }

    const question = await db.questions().findOne({ id: questionId });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases: TestCase[] = question.testCases || [
      {
        id: 'tc-default',
        input: '',
        expectedOutput: '',
        hidden: false,
      },
    ];

    const isExaminer = req.user?.role === 'EXAMINER' || req.user?.role === 'ADMIN';
    const executionResult = await executeCode({
      code,
      language,
      testCases,
      timeLimitMs: question.timeLimitMs || 3000,
      isExaminer,
    });

    // Record non-invasive telemetry event if sessionId is provided
    if (sessionId) {
      const session = await db.sessions().findOne({ id: sessionId });
      if (session) {
        await db.behavior_events().insertOne({
          id: `evt-run-${Date.now()}`,
          sessionId,
          eventType: 'CODE_RUN',
          timestamp: Date.now(),
          relativeSeconds: Math.round(Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000)),
          metadata: {
            questionId,
            language,
            codeLength: code.length,
            passedTests: executionResult.passedTests,
            totalTests: executionResult.totalTests,
            compileStatus: executionResult.status,
          },
        });
      }
    }

    res.json(executionResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Execution failed' });
  }
});

// POST /api/coding/submit - Submit final code for a question
router.post('/submit', async (req, res) => {
  try {
    const { code, language = 'javascript', questionId, sessionId } = req.body;
    if (!questionId || !sessionId || code === undefined) {
      return res.status(400).json({ error: 'questionId, sessionId, and code are required' });
    }

    const [question, session] = await Promise.all([
      db.questions().findOne({ id: questionId }),
      db.sessions().findOne({ id: sessionId }),
    ]);

    if (!question || !session) {
      return res.status(404).json({ error: 'Question or Session not found' });
    }

    const testCases: TestCase[] = question.testCases || [];
    const executionResult = await executeCode({
      code,
      language,
      testCases,
      timeLimitMs: question.timeLimitMs || 3000,
      isExaminer: false,
    });

    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const submission: CodingSubmission = {
      id: submissionId,
      sessionId,
      questionId,
      language,
      code,
      passedTests: executionResult.passedTests,
      totalTests: executionResult.totalTests,
      status: executionResult.status,
      executionTimeMs: executionResult.executionTimeMs,
      compilerOutput: executionResult.compilerOutput,
      runtimeOutput: executionResult.runtimeOutput,
      testResults: executionResult.testResults,
      submittedAt: new Date().toISOString(),
    };

    await db.coding_submissions().insertOne(submission);

    // Update session answers map
    const updatedAnswers = {
      ...session.answers,
      [questionId]: {
        code,
        language,
        passedTests: executionResult.passedTests,
        totalTests: executionResult.totalTests,
        status: executionResult.status,
      },
    };

    await db.sessions().updateOne(
      { id: sessionId },
      { $set: { answers: updatedAnswers } }
    );

    // Log CODE_SUBMIT telemetry event
    await db.behavior_events().insertOne({
      id: `evt-submit-${Date.now()}`,
      sessionId,
      eventType: 'CODE_SUBMIT',
      timestamp: Date.now(),
      relativeSeconds: Math.round(Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000)),
      metadata: {
        questionId,
        language,
        codeLength: code.length,
        passedTests: executionResult.passedTests,
        totalTests: executionResult.totalTests,
        status: executionResult.status,
      },
    });

    // Notify examiners via SSE
    realtimeHub.broadcast('CODE_SUBMITTED', {
      sessionId,
      studentName: session.studentName,
      questionId,
      status: executionResult.status,
      passedTests: executionResult.passedTests,
      totalTests: executionResult.totalTests,
    });

    res.status(201).json({
      submission,
      executionResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Code submission failed' });
  }
});

export default router;
