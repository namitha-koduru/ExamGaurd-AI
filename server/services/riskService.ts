/**
 * ExamGuard AI - Server Behavioral Risk Service
 * Ingests telemetry batches, updates features, calculates Isolation Forest risk, and pushes SSE events
 */

import { db } from '../db/mongo';
import { extractFeaturesFromEvents, calculateExplainableRisk } from '../../src/ml/isolationForest';
import { BehaviorEvent, ExamSession, AnomalyReport, BehavioralFeatures } from '../../src/types';
import { realtimeHub } from '../realtime/sse';
import { filterBehaviorBatch } from './behavior/privacyFilter';

export async function processBehaviorBatch(
  sessionId: string,
  events: Partial<BehaviorEvent>[]
): Promise<{ session: ExamSession; anomalyReport: AnomalyReport; features: BehavioralFeatures; strippedKeysCount: number } | null> {
  const session = await db.sessions().findOne({ id: sessionId });
  if (!session) {
    return null;
  }

  // 1. Filter and sanitize telemetry through privacy boundary
  const { cleanEvents, strippedKeysCount, rejectedEventsCount, privacyViolationsDetected } = filterBehaviorBatch(
    sessionId,
    events,
    session.startedAt
  );

  if (cleanEvents.length > 0) {
    await db.behavior_events().insertMany(cleanEvents);
  }

  // 2. Fetch all events for this session to compute updated features
  const allEventsRes = await db.behavior_events().find({ sessionId });
  const allEvents: BehaviorEvent[] = (await allEventsRes.toArray()).sort(
    (a: BehaviorEvent, b: BehaviorEvent) => a.timestamp - b.timestamp
  );

  const durationSec = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000));
  const exam = await db.exams().findOne({ id: session.examId });
  const totalQuestions = exam?.totalQuestions || 5;

  // 3. Extract behavioral biometrics features
  const features = extractFeaturesFromEvents(allEvents, durationSec, totalQuestions);

  // 4. Compute Isolation Forest ML and explainable risk score
  const anomalyReport = calculateExplainableRisk(features, true);
  anomalyReport.sessionId = sessionId;

  // 5. Update session record
  const updatedSessionData = {
    features,
    riskScore: anomalyReport.riskScore,
    riskLevel: anomalyReport.riskLevel,
    anomalyReport,
    durationSeconds: durationSec,
  };

  await db.sessions().updateOne({ id: sessionId }, { $set: updatedSessionData });

  const updatedSession: ExamSession = {
    ...session,
    ...updatedSessionData,
  };

  // 6. Broadcast live risk and event updates via SSE to examiners
  const latestEvent = cleanEvents[cleanEvents.length - 1];
  realtimeHub.broadcast('BEHAVIOR_UPDATE', {
    sessionId,
    studentName: session.studentName,
    examTitle: session.examTitle,
    eventCount: cleanEvents.length,
    latestEventType: latestEvent?.eventType,
    metadata: latestEvent?.metadata,
    timestamp: Date.now(),
  });

  realtimeHub.broadcast('RISK_UPDATE', {
    sessionId,
    studentName: session.studentName,
    examTitle: session.examTitle,
    riskScore: updatedSession.riskScore,
    riskLevel: updatedSession.riskLevel,
    latestAnomalyCount: anomalyReport.contributingFactors.length,
    recommendation: anomalyReport.recommendation,
    timestamp: Date.now(),
  });

  return {
    session: updatedSession,
    anomalyReport,
    features,
    strippedKeysCount,
  };
}
