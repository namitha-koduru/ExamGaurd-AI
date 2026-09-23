/**
 * SmartExam AI - Content Script (exam-monitor.ts)
 * Privacy-preserving behavioral interaction sensor for examination session
 */

import { ExtensionEventLogger } from '../utils/eventLogger';
import { transmitBehavioralEvents } from '../utils/api';

// Notify the web application that the SmartExam Extension is active
(window as any).__SMARTEXAM_EXTENSION_ACTIVE__ = true;
window.postMessage({ type: 'SMARTEXAM_EXTENSION_READY', version: '1.2.0' }, '*');

let activeSessionId: string | null = null;
let lastFocusLostTime: number = 0;
let keyTimestamps: number[] = [];
let lastMouseSampleTime: number = 0;
let mouseMoveCount: number = 0;
let idleTimer: any = null;
let isIdle: boolean = false;

const backendBaseUrl = window.location.origin;

const logger = new ExtensionEventLogger(async (events) => {
  if (!activeSessionId) return;
  await transmitBehavioralEvents(backendBaseUrl, activeSessionId, events);
});

// Listen for session handshake from the React exam app
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === 'SMARTEXAM_ATTACH_SESSION') {
    activeSessionId = event.data.sessionId;
    if (activeSessionId) {
      logger.setSession(activeSessionId);
      logger.log('EXTENSION_ATTACHED', { timestamp: Date.now() });
      console.log(`[SmartExam Extension] Attached telemetry sensor to session: ${activeSessionId}`);
    }
  }

  if (event.data.type === 'SMARTEXAM_DETACH_SESSION') {
    logger.flush();
    activeSessionId = null;
    console.log('[SmartExam Extension] Detached telemetry sensor');
  }
});

// 1. Tab Focus & Window Blur Tracking
window.addEventListener('blur', () => {
  if (!activeSessionId) return;
  lastFocusLostTime = Date.now();
  logger.log('TAB_FOCUS_LOST', { timestamp: lastFocusLostTime });
});

window.addEventListener('focus', () => {
  if (!activeSessionId) return;
  const returnTime = Date.now();
  const durationMs = lastFocusLostTime > 0 ? returnTime - lastFocusLostTime : 0;
  logger.log('TAB_FOCUS_RETURNED', { durationMs, timestamp: returnTime });
  lastFocusLostTime = 0;
});

document.addEventListener('visibilitychange', () => {
  if (!activeSessionId) return;
  if (document.hidden) {
    lastFocusLostTime = Date.now();
    logger.log('TAB_FOCUS_LOST', { reason: 'visibility_hidden' });
  } else {
    const returnTime = Date.now();
    const durationMs = lastFocusLostTime > 0 ? returnTime - lastFocusLostTime : 0;
    logger.log('TAB_FOCUS_RETURNED', { durationMs, reason: 'visibility_visible' });
    lastFocusLostTime = 0;
  }
});

// 2. Clipboard Interception (Metadata only, NO raw text stored!)
document.addEventListener('copy', (e) => {
  if (!activeSessionId) return;
  const selection = window.getSelection()?.toString() || '';
  logger.log('COPY_ATTEMPT', {
    charCount: selection.length,
    context: (e.target as HTMLElement)?.tagName?.toLowerCase() || 'document',
  });
});

document.addEventListener('paste', (e) => {
  if (!activeSessionId) return;
  const clipboardData = e.clipboardData?.getData('text') || '';
  logger.log('PASTE_ATTEMPT', {
    charCount: clipboardData.length,
    context: (e.target as HTMLElement)?.tagName?.toLowerCase() || 'document',
  });
});

// 3. Privacy-Preserving Typing Dynamics (Intervals & Speed, never key values)
document.addEventListener('keydown', (e) => {
  if (!activeSessionId) return;
  resetIdleTimer();

  const now = Date.now();
  keyTimestamps.push(now);

  if (keyTimestamps.length > 20) {
    keyTimestamps.shift();
  }

  // Calculate interval variance and estimate WPM every 10 strokes
  if (keyTimestamps.length >= 10) {
    const intervals: number[] = [];
    for (let i = 1; i < keyTimestamps.length; i++) {
      intervals.push(keyTimestamps[i] - keyTimestamps[i - 1]);
    }
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / intervals.length;

    // Approximate WPM = (strokes per min) / 5
    const durationSec = (now - keyTimestamps[0]) / 1000;
    const wpm = durationSec > 0 ? Math.round(((keyTimestamps.length / 5) / durationSec) * 60) : 40;

    logger.log('KEYBOARD_ACTIVITY', {
      speedWpm: Math.min(120, Math.max(10, wpm)),
      keyIntervalVariance: Math.round(variance),
    });
  }
});

// 4. Mouse Dynamics (Rate sampled, no continuous coordinate logging)
document.addEventListener('mousemove', () => {
  if (!activeSessionId) return;
  resetIdleTimer();
  mouseMoveCount++;

  const now = Date.now();
  if (now - lastMouseSampleTime > 1500) {
    const intensity = Math.min(100, Math.round(mouseMoveCount * 4));
    logger.log('MOUSE_ACTIVITY', { mouseIntensity: intensity });
    mouseMoveCount = 0;
    lastMouseSampleTime = now;
  }
});

// 5. Idle Period Detection
function resetIdleTimer() {
  if (isIdle && activeSessionId) {
    isIdle = false;
    logger.log('IDLE_ENDED', { timestamp: Date.now() });
  }

  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (activeSessionId) {
      isIdle = true;
      logger.log('IDLE_STARTED', { idleDurationSec: 15 });
    }
  }, 15000); // 15 seconds without input = idle
}
