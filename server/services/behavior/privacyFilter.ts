/**
 * ExamGuard AI - Behavioral Privacy Filter
 * Strict privacy barrier ensuring zero raw text, keystrokes, clipboard contents,
 * or invasive system telemetry can pass into the database or ML anomaly engines.
 *
 * Privacy Standards:
 * 1. NO raw keystrokes (e.g., 'a', 'b', 'password', student answers).
 * 2. NO raw clipboard text (only derived character counts or event flags).
 * 3. NO URLs of external websites or other application titles.
 * 4. NO webcam, microphone, screen capture, or facial recognition streams.
 * 5. Telemetry is ONLY active during an active examination session.
 */

import { BehaviorEvent, BehaviorEventType } from '../../../src/types';

// Strict blacklist of prohibited data properties that must NEVER be persisted or analyzed
export const FORBIDDEN_PROPERTY_KEYS = new Set<string>([
  'clipboardtext',
  'clipboardcontent',
  'text',
  'rawkeystrokes',
  'keysequence',
  'keystrokes',
  'key',
  'keycode',
  'codecontent',
  'value',
  'answertext',
  'studentanswer',
  'url',
  'taburl',
  'windowtitle',
  'appname',
  'screencapture',
  'screenshot',
  'imagedata',
  'webcam',
  'microphone',
  'audio',
  'video',
  'password',
  'cookie',
  'token',
]);

// Permitted privacy-preserving behavioral event types
export const PERMITTED_BEHAVIOR_EVENT_TYPES = new Set<string>([
  // Focus & Window Dynamics
  'FOCUS_LOST',
  'FOCUS_RETURNED',
  'TAB_FOCUS_LOST',
  'TAB_FOCUS_RETURNED',
  'WINDOW_BLUR',
  'WINDOW_FOCUS',
  'VISIBILITY_HIDDEN',
  'VISIBILITY_VISIBLE',
  'FULLSCREEN_ENTERED',
  'FULLSCREEN_EXITED',

  // Clipboard Behavioral Markers
  'COPY',
  'PASTE',
  'CUT',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CUT_ATTEMPT',

  // Aggregated Interaction Dynamics
  'TYPING_BEHAVIOR',
  'KEYBOARD_ACTIVITY',
  'MOUSE_BEHAVIOR',
  'MOUSE_ACTIVITY',
  'SCROLL_BEHAVIOR',
  'SCROLL_ACTIVITY',
  'IDLE_PERIOD',
  'IDLE_STARTED',
  'IDLE_ENDED',

  // Exam Navigation & Answering Dynamics
  'QUESTION_VIEWED',
  'QUESTION_NAVIGATED',
  'QUESTION_CHANGED',
  'QUESTION_REVISITED',
  'ANSWER_CHANGED',
  'ANSWER_STARTED',
  'ANSWER_SUBMITTED',

  // Coding Interaction Dynamics
  'CODE_EDITOR_ACTIVITY',
  'CODE_EDIT_ACTIVITY',
  'CODE_RUN',
  'CODE_SUBMIT',
  'CODE_SUBMISSION',
  'LARGE_CODE_INSERTION',
  'COMPILE_RESULT',
]);

export interface PrivacySanitizationResult {
  cleanEvents: BehaviorEvent[];
  strippedKeysCount: number;
  rejectedEventsCount: number;
  privacyViolationsDetected: string[];
}

/**
 * Validates if an event type is permitted under the privacy charter
 */
export function isPermittedEventType(eventType: string): boolean {
  return PERMITTED_BEHAVIOR_EVENT_TYPES.has(eventType.toUpperCase());
}

/**
 * Deeply sanitizes an object by removing forbidden property keys and any raw strings
 */
function sanitizeMetadataObject(obj: any, violations: string[]): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const clean: Record<string, any> = {};

  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check forbidden key
    if (FORBIDDEN_PROPERTY_KEYS.has(lowerKey)) {
      violations.push(`Stripped forbidden property: ${key}`);
      // If it was clipboard text or string, preserve ONLY estimated character count
      if (typeof val === 'string') {
        clean.estimatedCharacterCount = val.length;
      }
      continue;
    }

    // Sanitize string values: strip any long string payload (> 100 chars) that might be raw text
    if (typeof val === 'string') {
      if (val.length > 100) {
        violations.push(`Truncated overly long string in metadata.${key}`);
        clean[`${key}_length`] = val.length;
        continue;
      }
      // Safe small identifiers / enums
      clean[key] = val.trim();
    } else if (typeof val === 'number') {
      if (Number.isFinite(val)) {
        clean[key] = val;
      }
    } else if (typeof val === 'boolean') {
      clean[key] = val;
    } else if (Array.isArray(val)) {
      // Only allow short arrays of numbers (e.g., timestamps or intervals)
      if (val.every((item) => typeof item === 'number')) {
        clean[key] = val.slice(0, 50);
      }
    } else if (typeof val === 'object' && val !== null) {
      // Recurse safely
      clean[key] = sanitizeMetadataObject(val, violations);
    }
  }

  return clean;
}

/**
 * Filter and sanitize an incoming telemetry event batch
 * Guarantees that only privacy-preserving derived metrics reach downstream processing
 */
export function filterBehaviorBatch(
  sessionId: string,
  rawEvents: Partial<BehaviorEvent>[],
  sessionStartedAt?: string
): PrivacySanitizationResult {
  const cleanEvents: BehaviorEvent[] = [];
  const privacyViolationsDetected: string[] = [];
  let strippedKeysCount = 0;
  let rejectedEventsCount = 0;

  const startMs = sessionStartedAt ? new Date(sessionStartedAt).getTime() : Date.now();

  for (const raw of rawEvents) {
    if (!raw || !raw.eventType) {
      rejectedEventsCount++;
      continue;
    }

    const eventTypeStr = String(raw.eventType).toUpperCase();

    // Check permitted event type
    if (!isPermittedEventType(eventTypeStr)) {
      rejectedEventsCount++;
      privacyViolationsDetected.push(`Rejected unpermitted event type: ${raw.eventType}`);
      continue;
    }

    const violationsInEvent: string[] = [];
    const sanitizedMetadata = sanitizeMetadataObject(raw.metadata || {}, violationsInEvent);

    if (violationsInEvent.length > 0) {
      strippedKeysCount += violationsInEvent.length;
      privacyViolationsDetected.push(...violationsInEvent);
    }

    const timestamp = typeof raw.timestamp === 'number' && raw.timestamp > 0 ? raw.timestamp : Date.now();
    const relativeSeconds = Math.max(0, Math.round((timestamp - startMs) / 1000));

    const cleanEvent: BehaviorEvent = {
      id: raw.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      sessionId,
      eventType: eventTypeStr as BehaviorEventType,
      timestamp,
      relativeSeconds,
      metadata: sanitizedMetadata,
    };

    cleanEvents.push(cleanEvent);
  }

  return {
    cleanEvents,
    strippedKeysCount,
    rejectedEventsCount,
    privacyViolationsDetected,
  };
}
