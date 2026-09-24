/**
 * ExamGuard AI - Behavioral Telemetry Ingestion Routes
 */

import { Router } from 'express';
import { processBehaviorBatch } from '../services/riskService';

const router = Router();

// POST /api/behavior/events - Ingest batch of behavior events
router.post('/events', async (req, res) => {
  try {
    const { sessionId, events } = req.body;

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'sessionId and a non-empty events array are required' });
    }

    const result = await processBehaviorBatch(sessionId, events);
    if (!result) {
      return res.status(404).json({ error: 'Session not found for telemetry processing' });
    }

    res.json({
      success: true,
      processedEvents: events.length,
      privacyFiltered: true,
      strippedKeysCount: result.strippedKeysCount,
      currentRiskScore: result.session.riskScore,
      currentRiskLevel: result.session.riskLevel,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Telemetry ingestion failed' });
  }
});

export default router;
