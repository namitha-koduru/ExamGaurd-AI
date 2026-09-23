/**
 * ExamGuard AI - Server-Sent Events (SSE) Real-Time Hub
 * Streams live biometric telemetry & risk signals to connected Examiner dashboards
 */

import { Response } from 'express';

type SSEListener = (event: { type: string; payload: any }) => void;

class RealtimeSSEHub {
  private listeners: Set<SSEListener> = new Set();

  public subscribe(res: Response): () => void {
    const listener: SSEListener = (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        this.listeners.delete(listener);
      }
    };

    this.listeners.add(listener);

    // Initial greeting
    res.write(
      `data: ${JSON.stringify({
        type: 'CONNECTED',
        payload: { time: Date.now(), activeListeners: this.listeners.size },
      })}\n\n`
    );

    // Return cleanup callback
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(type: string, payload: any) {
    const event = { type, payload, timestamp: Date.now() };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  public getListenerCount(): number {
    return this.listeners.size;
  }
}

export const realtimeHub = new RealtimeSSEHub();
