/**
 * SmartExam AI Chrome Extension - Telemetry Transmission API
 */

import { TelemetryEvent } from './eventLogger';

export async function transmitBehavioralEvents(
  backendUrl: string,
  sessionId: string,
  events: TelemetryEvent[]
): Promise<boolean> {
  try {
    const res = await fetch(`${backendUrl}/api/behavior/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        events,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SmartExam Extension] Failed to transmit behavioral events:', err);
    return false;
  }
}
