/**
 * ExamGuard AI - Analytics, Audit, SSE Stream & System Health Routes
 */

import { Router } from 'express';
import { db, checkDbHealth } from '../db/mongo';
import { realtimeHub } from '../realtime/sse';
import { requireAuth, requireRole } from '../auth/authService';
import { ExamSession, AuditLog } from '../../src/types';

const router = Router();

// GET /api/analytics/overview - Proctor Analytics Dashboard
router.get('/analytics/overview', async (req, res) => {
  try {
    const sessionsRes = await db.sessions().find();
    const sessions: ExamSession[] = await sessionsRes.toArray();

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'SUBMITTED').length;
    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE').length;

    let normalCount = 0;
    let lowConcernCount = 0;
    let reviewCount = 0;
    let highAnomalyCount = 0;

    let totalRiskScore = 0;
    const patternCounts: Record<string, number> = {};
    const focusLossRanges: Record<string, number> = {
      '0s': 0,
      '1-10s': 0,
      '11-30s': 0,
      '31-60s': 0,
      '>60s': 0,
    };

    for (const s of sessions) {
      if (s.riskLevel === 'NORMAL') normalCount++;
      else if (s.riskLevel === 'LOW_CONCERN') lowConcernCount++;
      else if (s.riskLevel === 'REVIEW') reviewCount++;
      else if (s.riskLevel === 'HIGH_ANOMALY') highAnomalyCount++;

      totalRiskScore += s.riskScore || 0;

      const focusLoss = s.features?.focus_loss_duration || 0;
      if (focusLoss === 0) focusLossRanges['0s']++;
      else if (focusLoss <= 10) focusLossRanges['1-10s']++;
      else if (focusLoss <= 30) focusLossRanges['11-30s']++;
      else if (focusLoss <= 60) focusLossRanges['31-60s']++;
      else focusLossRanges['>60s']++;

      if (s.anomalyReport?.detectedPatterns) {
        for (const pattern of s.anomalyReport.detectedPatterns) {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        }
      }
    }

    const averageRiskScore = totalSessions > 0 ? Math.round(totalRiskScore / totalSessions) : 0;
    const topAnomalyPatterns = Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      metrics: {
        totalSessions,
        completedSessions,
        activeSessions,
        averageRiskScore,
        normalCount,
        reviewCount,
        highAnomalyCount,
      },
      riskDistribution: {
        normal: normalCount,
        lowConcern: lowConcernCount,
        review: reviewCount,
        highAnomaly: highAnomalyCount,
        NORMAL: normalCount,
        LOW_CONCERN: lowConcernCount,
        REVIEW: reviewCount,
        HIGH_ANOMALY: highAnomalyCount,
      },
      focusLossRanges,
      topAnomalyPatterns,
      modelVersion: 'behavioral-iforest-v2',
      featureSchemaVersion: 'behavior-v2',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate analytics overview' });
  }
});

// GET /api/audit-logs - Examiner Audit Trail
router.get('/audit-logs', async (req, res) => {
  try {
    const logsRes = await db.audit_logs().find();
    const logs: AuditLog[] = await logsRes.toArray();
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

// GET /api/proctor/stream - Live Server-Sent Events (SSE) stream for examiners
router.get('/proctor/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const unsubscribe = realtimeHub.subscribe(res);

  // Send periodic keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      unsubscribe();
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// GET /api/health - Basic server health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'ExamGuard AI Backend',
    modelVersion: 'behavioral-iforest-v2',
  });
});

// GET /api/health/db - Detailed database and telemetry engine health
router.get('/health/db', async (req, res) => {
  try {
    const dbHealth = await checkDbHealth();
    res.json({
      ...dbHealth,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      activeSSEListeners: realtimeHub.getListenerCount(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

export default router;
