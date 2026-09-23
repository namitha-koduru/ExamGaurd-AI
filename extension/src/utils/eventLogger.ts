/**
 * SmartExam AI Chrome Extension - Event Logger Utility
 * Collects, aggregates, and flushes interaction events without capturing private text
 */

export interface TelemetryEvent {
  id: string;
  eventType: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export class ExtensionEventLogger {
  private buffer: TelemetryEvent[] = [];
  private sessionId: string | null = null;
  private maxBufferSize: number = 25;
  private flushIntervalMs: number = 3000;
  private timer: any = null;
  private onFlushCallback?: (events: TelemetryEvent[]) => Promise<void>;

  constructor(onFlush?: (events: TelemetryEvent[]) => Promise<void>) {
    this.onFlushCallback = onFlush;
    this.startPeriodicFlush();
  }

  public setSession(sessionId: string) {
    this.sessionId = sessionId;
  }

  public log(eventType: string, metadata: Record<string, any> = {}) {
    const event: TelemetryEvent = {
      id: `ext-ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType,
      timestamp: Date.now(),
      metadata,
    };

    this.buffer.push(event);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  public async flush() {
    if (this.buffer.length === 0 || !this.sessionId) return;
    const batch = [...this.buffer];
    this.buffer = [];

    if (this.onFlushCallback) {
      try {
        await this.onFlushCallback(batch);
      } catch (err) {
        // re-queue up to 50 items on transmission failure
        this.buffer = [...batch.slice(-25), ...this.buffer];
      }
    }
  }

  private startPeriodicFlush() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  public destroy() {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }
}
