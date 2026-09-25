/**
 * ExamGuard AI - Student Examination Interface
 * Institutional Examination Platform & Behavioral Intelligence
 * Detect Behavior, Not the Person
 */

import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question, ExamSession, BehaviorEvent } from '../../types';
import { api } from '../../services/api';
import { CodeWorkspace } from '../../components/coding/CodeWorkspace';
import { DescriptiveWorkspace } from '../../components/descriptive/DescriptiveWorkspace';
import { LogoIcon } from '../../components/common/Logo';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Maximize2,
  Minimize2,
  Code,
  FileText,
  ListFilter,
  Monitor,
  MonitorX,
  ClipboardX,
} from 'lucide-react';

interface ExamInterfaceProps {
  exam: Exam;
  session: ExamSession;
  questions: Question[];
  onSubmitSuccess: (session: ExamSession) => void;
  onTelemetryTrigger?: (eventType: string, metadata?: Record<string, any>) => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  exam,
  session,
  questions,
  onSubmitSuccess,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>(session.answers || {});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(exam.durationMinutes * 60);
  const [lastAutosaveTime, setLastAutosaveTime] = useState<string>('Just now');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [telemetryNotice, setTelemetryNotice] = useState<{ message: string; type: 'warn' | 'info' } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTerminating, setIsTerminating] = useState<boolean>(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);

  // Tab switch tracking: 2 allowed with warnings, terminates on 3rd
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabWarningModal, setTabWarningModal] = useState<{ count: number; max: number; remaining: number } | null>(null);
  const [isMultiScreenDetected, setIsMultiScreenDetected] = useState<boolean>(false);

  // Synchronized refs to avoid stale closures in window event listeners
  const answersRef = useRef<Record<string, any>>(session.answers || {});
  const hasTerminatedRef = useRef<boolean>(false);
  const isArmedRef = useRef<boolean>(false);
  const tabSwitchCountRef = useRef<number>(0);
  const lastTabSwitchTrigger = useRef<number>(0);

  // Telemetry buffer ref & metrics
  const telemetryBuffer = useRef<Partial<BehaviorEvent>[]>([]);
  const lastFocusLoss = useRef<number>(0);
  const keyTimestamps = useRef<number[]>([]);
  const lastKeyTime = useRef<number>(0);
  const interKeyIntervals = useRef<number[]>([]);
  const longPauseCount = useRef<number>(0);
  const mouseMoves = useRef<number>(0);
  const mousePauses = useRef<number>(0);
  const lastMouseMoveTime = useRef<number>(Date.now());
  const mousePauseDurations = useRef<number[]>([]);
  const scrollEvents = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const scrollDirectionChanges = useRef<number>(0);
  const lastInteractionTime = useRef<number>(Date.now());
  const idleReportedForPeriod = useRef<boolean>(false);
  const qStartTime = useRef<number>(Date.now());
  const answerChangeCounts = useRef<Record<string, number>>({});

  // Keep answers ref current
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Fullscreen initialization & arm tab switch detection after brief settling delay
  useEffect(() => {
    const checkFullscreen = () => {
      const active = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(active);
    };
    checkFullscreen();

    // Request fullscreen upon entering exam interface
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          // If browser restricts without click gesture, the Fullscreen Enforcement Modal will prompt
        });
      }
    }

    // Arm tab switch detection after 1.2s to prevent initial render / focus transitions from false-firing
    const armTimer = setTimeout(() => {
      isArmedRef.current = true;
    }, 1200);

    return () => clearTimeout(armTimer);
  }, []);

  // Multi-screen / external monitor detection
  const checkMultiScreen = () => {
    if (typeof window === 'undefined') return;
    const isExtended = Boolean(
      (window.screen as any)?.isExtended === true ||
      (window.screenX < -20 || window.screenX > (window.screen.width + 20)) ||
      (window.screenY < -20 || window.screenY > (window.screen.height + 20))
    );
    setIsMultiScreenDetected(isExtended);
    if (isExtended) {
      recordEvent('SECONDARY_SCREEN_DETECTED', {
        screenX: window.screenX,
        screenY: window.screenY,
      });
    }
  };

  useEffect(() => {
    checkMultiScreen();
    const screenInterval = setInterval(checkMultiScreen, 2000);
    window.addEventListener('resize', checkMultiScreen);
    return () => {
      clearInterval(screenInterval);
      window.removeEventListener('resize', checkMultiScreen);
    };
  }, []);

  // Tab switch detected: 2 switches allowed with warnings, terminates on 3rd
  const handleTabSwitchDetected = (reason: string) => {
    if (!isArmedRef.current || hasTerminatedRef.current || isSubmitting) return;
    const now = Date.now();
    // Debounce rapid duplicate blur & visibilitychange events within 1200ms
    if (now - lastTabSwitchTrigger.current < 1200) return;
    lastTabSwitchTrigger.current = now;

    const newCount = tabSwitchCountRef.current + 1;
    tabSwitchCountRef.current = newCount;
    setTabSwitchCount(newCount);

    recordEvent('TAB_SWITCH_DETECTED', {
      switchCount: newCount,
      maxAllowed: 2,
      reason,
      questionIndex: currentQIndex,
    });

    if (newCount > 2) {
      // Exceeded allowed 2 tab switches -> Terminate immediately
      triggerTabSwitchTermination('TAB_SWITCH_LIMIT_EXCEEDED');
    } else {
      // 1st or 2nd switch: show prominent warning modal
      setTabWarningModal({
        count: newCount,
        max: 2,
        remaining: 2 - newCount,
      });
    }
  };

  // Termination on exceeding tab switch limit
  const triggerTabSwitchTermination = async (reason: string = 'TAB_SWITCH_LIMIT_EXCEEDED') => {
    if (hasTerminatedRef.current || isSubmitting) return;
    hasTerminatedRef.current = true;
    setIsTerminating(true);
    setTerminationReason(reason);
    setTabWarningModal(null);

    recordEvent('EXAM_TERMINATED', {
      reason,
      switchCount: tabSwitchCountRef.current,
      maxAllowed: 2,
      terminated: true,
      timestamp: Date.now(),
      questionIndex: currentQIndex,
    });

    try {
      await flushTelemetry();
      const currentAns = answersRef.current;
      const res = await api.submitExam(session.id, currentAns, reason);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setTimeout(() => {
        onSubmitSuccess(res.session);
      }, 1800);
    } catch (err) {
      console.error('Failed to submit terminated exam:', err);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setTimeout(() => {
        onSubmitSuccess({
          ...session,
          status: 'SUBMITTED',
          terminatedReason: reason,
          answers: answersRef.current,
        });
      }, 1800);
    }
  };

  // 1. Authoritative Timer synchronized with session start time
  useEffect(() => {
    const startMs = new Date(session.startedAt).getTime();
    const totalSec = exam.durationMinutes * 60;

    const interval = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const remaining = Math.max(0, totalSec - elapsed);
      setTimeLeftSec(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleFinalSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, exam]);

  // 2. Behavioral Telemetry Collection
  const recordEvent = (eventType: string, metadata: Record<string, any> = {}) => {
    lastInteractionTime.current = Date.now();
    idleReportedForPeriod.current = false;

    const event: Partial<BehaviorEvent> = {
      eventType: eventType as any,
      timestamp: Date.now(),
      metadata,
    };
    telemetryBuffer.current.push(event);

    if (
      telemetryBuffer.current.length >= 8 ||
      eventType === 'FOCUS_LOST' ||
      eventType === 'TAB_FOCUS_LOST' ||
      eventType === 'PASTE' ||
      eventType === 'PASTE_ATTEMPT' ||
      eventType === 'LARGE_CODE_INSERTION'
    ) {
      flushTelemetry();
    }
  };

  const flushTelemetry = async () => {
    if (telemetryBuffer.current.length === 0) return;
    const batch = [...telemetryBuffer.current];
    telemetryBuffer.current = [];
    try {
      await api.sendBehaviorEvents(session.id, batch);
    } catch {
      // Re-queue on network hiccup to prevent data loss
      telemetryBuffer.current = [...batch, ...telemetryBuffer.current];
    }
  };

  // Periodic flush & autosave every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      flushTelemetry();
      saveCurrentAnswers(answers);
    }, 12000);
    return () => clearInterval(interval);
  }, [answers, session.id]);

  // Idle behavior detector (inactivity >= 15 seconds)
  useEffect(() => {
    const idleCheck = setInterval(() => {
      const inactiveDuration = Date.now() - lastInteractionTime.current;
      if (inactiveDuration >= 15000 && !idleReportedForPeriod.current) {
        idleReportedForPeriod.current = true;
        recordEvent('IDLE_PERIOD', {
          durationMs: inactiveDuration,
          idleDurationSec: Math.round(inactiveDuration / 1000),
        });
      }
    }, 5000);
    return () => clearInterval(idleCheck);
  }, []);

  // Initial question viewed event
  useEffect(() => {
    if (questions[currentQIndex]) {
      recordEvent('QUESTION_VIEWED', {
        questionId: questions[currentQIndex]?.id,
        questionIndex: currentQIndex,
        questionType: questions[currentQIndex]?.questionType,
      });
    }
  }, []);

  const handleCopy = (e?: React.ClipboardEvent | ClipboardEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    recordEvent('COPY_BLOCKED', {
      questionIndex: currentQIndex,
      questionId: questions[currentQIndex]?.id,
    });
    setTelemetryNotice({
      message: 'Notice: Copying content is strictly prohibited by exam integrity policy.',
      type: 'warn',
    });
    setTimeout(() => setTelemetryNotice(null), 3500);
  };

  const handleCut = (e?: React.ClipboardEvent | ClipboardEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    recordEvent('CUT_BLOCKED', {
      questionIndex: currentQIndex,
      questionId: questions[currentQIndex]?.id,
    });
    setTelemetryNotice({
      message: 'Notice: Cutting content is strictly prohibited by exam integrity policy.',
      type: 'warn',
    });
    setTimeout(() => setTelemetryNotice(null), 3500);
  };

  const handlePaste = (e?: React.ClipboardEvent | ClipboardEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    recordEvent('PASTE_BLOCKED', {
      questionIndex: currentQIndex,
      questionType: questions[currentQIndex]?.questionType,
    });
    setTelemetryNotice({
      message: 'Notice: Pasting content is strictly prohibited by exam integrity policy.',
      type: 'warn',
    });
    setTimeout(() => setTelemetryNotice(null), 3500);
  };

  // Privacy-Preserving Window Focus, Blur, Clipboard & Typing Listeners
  useEffect(() => {
    const handleBlur = () => {
      lastFocusLoss.current = Date.now();
      recordEvent('FOCUS_LOST', {
        reason: 'window_blur',
        durationBeforeReturn: null,
        questionIndex: currentQIndex,
        questionId: questions[currentQIndex]?.id,
      });
      // Window blur indicates candidate switched away from active exam window
      handleTabSwitchDetected('WINDOW_BLUR');
    };

    const handleFocus = () => {
      const lostDurationMs = lastFocusLoss.current > 0 ? Date.now() - lastFocusLoss.current : 0;
      recordEvent('FOCUS_RETURNED', { lostDurationMs, durationMs: lostDurationMs });
      lastFocusLoss.current = 0;
    };

    const handleVisibility = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        lastFocusLoss.current = Date.now();
        recordEvent('FOCUS_LOST', { reason: 'document_hidden', durationBeforeReturn: null });
        // Tab switch detected (page hidden)
        handleTabSwitchDetected('DOCUMENT_HIDDEN');
      } else {
        const lostDurationMs = lastFocusLoss.current > 0 ? Date.now() - lastFocusLoss.current : 0;
        recordEvent('FOCUS_RETURNED', { lostDurationMs, durationMs: lostDurationMs, reason: 'document_visible' });
        lastFocusLoss.current = 0;
      }
    };

    // Typing behavior & clipboard shortcut blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      // Strictly prevent Ctrl+C, Ctrl+V, Ctrl+X, Cmd+C, Cmd+V, Cmd+X
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.code === 'KeyC' || e.code === 'KeyV' || e.code === 'KeyX')
      ) {
        e.preventDefault();
        e.stopPropagation();
        const action = e.key === 'c' || e.code === 'KeyC' ? 'Copying' : e.key === 'x' || e.code === 'KeyX' ? 'Cutting' : 'Pasting';
        recordEvent(
          e.key === 'c' || e.code === 'KeyC' ? 'COPY_BLOCKED' : e.key === 'x' || e.code === 'KeyX' ? 'CUT_BLOCKED' : 'PASTE_BLOCKED',
          { shortcut: e.code, questionIndex: currentQIndex }
        );
        setTelemetryNotice({
          message: `${action} is strictly prohibited by examination integrity policy.`,
          type: 'warn',
        });
        setTimeout(() => setTelemetryNotice(null), 3500);
        return;
      }
      const now = Date.now();
      lastInteractionTime.current = now;
      idleReportedForPeriod.current = false;

      if (lastKeyTime.current > 0) {
        const interval = now - lastKeyTime.current;
        if (interval > 2000) {
          longPauseCount.current++;
        } else if (interval > 20 && interval < 2000) {
          interKeyIntervals.current.push(interval);
          if (interKeyIntervals.current.length > 20) interKeyIntervals.current.shift();
        }
      }
      lastKeyTime.current = now;

      keyTimestamps.current.push(now);
      if (keyTimestamps.current.length > 15) keyTimestamps.current.shift();

      if (keyTimestamps.current.length >= 10) {
        const delta = (now - keyTimestamps.current[0]) / 1000;
        const wpm = delta > 0 ? Math.round(((keyTimestamps.current.length / 5) / delta) * 60) : 40;
        const avgInterval = interKeyIntervals.current.length > 0
          ? Math.round(interKeyIntervals.current.reduce((a, b) => a + b, 0) / interKeyIntervals.current.length)
          : 140;
        const variance = interKeyIntervals.current.length > 1
          ? Math.round(interKeyIntervals.current.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / interKeyIntervals.current.length)
          : 45;

        recordEvent('TYPING_BEHAVIOR', {
          typingSpeedWpm: Math.min(140, wpm),
          speedWpm: Math.min(140, wpm),
          averageInterKeyIntervalMs: avgInterval,
          interKeyVariance: variance,
          keyIntervalVariance: variance,
          longPauseCount: longPauseCount.current,
        });
      }
    };

    // Mouse behavior (Aggregated dynamics, NEVER store raw coordinates)
    const handleMouseMove = () => {
      const now = Date.now();
      lastInteractionTime.current = now;
      idleReportedForPeriod.current = false;

      const pauseDuration = now - lastMouseMoveTime.current;
      if (pauseDuration >= 1000) {
        mousePauses.current++;
        mousePauseDurations.current.push(pauseDuration);
        if (mousePauseDurations.current.length > 15) mousePauseDurations.current.shift();
      }
      lastMouseMoveTime.current = now;

      mouseMoves.current++;
      if (mouseMoves.current >= 45) {
        const avgPause = mousePauseDurations.current.length > 0
          ? Math.round(mousePauseDurations.current.reduce((a, b) => a + b, 0) / mousePauseDurations.current.length)
          : 600;

        recordEvent('MOUSE_BEHAVIOR', {
          mouseMovementCount: mouseMoves.current,
          mousePauseCount: mousePauses.current,
          averageMousePauseMs: avgPause,
          mouseIntensity: 55,
        });
        mouseMoves.current = 0;
      }
    };

    // Scrolling behavior (Aggregated dynamics)
    const handleScroll = () => {
      const now = Date.now();
      lastInteractionTime.current = now;
      idleReportedForPeriod.current = false;

      scrollEvents.current++;
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (lastScrollY.current !== 0) {
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        if (direction) scrollDirectionChanges.current++;
      }
      lastScrollY.current = currentScrollY;

      if (scrollEvents.current >= 20) {
        recordEvent('SCROLL_BEHAVIOR', {
          scrollEventCount: scrollEvents.current,
          scrollDirectionChanges: scrollDirectionChanges.current,
        });
        scrollEvents.current = 0;
        scrollDirectionChanges.current = 0;
      }
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(inFullscreen);
      if (inFullscreen) {
        recordEvent('FULLSCREEN_ENTERED');
      } else {
        recordEvent('FULLSCREEN_EXITED');
        setTelemetryNotice({
          message: 'Notice: Fullscreen exited. Fullscreen mode is required to continue.',
          type: 'warn',
        });
        setTimeout(() => setTelemetryNotice(null), 4000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [currentQIndex, questions]);

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
      setIsFullscreen(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      enterFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const saveCurrentAnswers = async (currentAns: Record<string, any>) => {
    try {
      const answeredCount = Object.keys(currentAns).length;
      const progress = Math.round((answeredCount / Math.max(1, questions.length)) * 100);
      await api.autosaveAnswers(session.id, currentAns, progress);
      setLastAutosaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Autosave warning:', err);
    }
  };

  // MCQ Selection handler
  const handleSelectOption = (optIndex: number) => {
    const q = questions[currentQIndex];
    if (!q) return;

    const updated = { ...answers, [q.id]: optIndex };
    setAnswers(updated);
    saveCurrentAnswers(updated);

    recordEvent('ANSWER_SUBMITTED', {
      questionIndex: currentQIndex,
      selectedOption: optIndex,
      timeSpentSec: Math.round((Date.now() - qStartTime.current) / 1000),
    });
  };

  // Coding answer change handler
  const handleCodingAnswerChange = (val: any) => {
    const q = questions[currentQIndex];
    if (!q) return;
    const updated = { ...answers, [q.id]: val };
    setAnswers(updated);

    const count = (answerChangeCounts.current[q.id] || 0) + 1;
    answerChangeCounts.current[q.id] = count;
    recordEvent('ANSWER_CHANGED', {
      questionId: q.id,
      questionIndex: currentQIndex,
      changeCount: count,
      questionType: 'CODING',
    });
  };

  // Descriptive answer change handler
  const handleDescriptiveAnswerChange = (val: string) => {
    const q = questions[currentQIndex];
    if (!q) return;
    const updated = { ...answers, [q.id]: val };
    setAnswers(updated);

    const count = (answerChangeCounts.current[q.id] || 0) + 1;
    answerChangeCounts.current[q.id] = count;
    recordEvent('ANSWER_CHANGED', {
      questionId: q.id,
      questionIndex: currentQIndex,
      changeCount: count,
      questionType: 'DESCRIPTIVE',
    });
  };

  const handleNavigateQuestion = (index: number) => {
    if (index === currentQIndex || index < 0 || index >= questions.length) return;

    const timeSpent = Math.round((Date.now() - qStartTime.current) / 1000);
    const targetQ = questions[index];

    recordEvent('QUESTION_NAVIGATED', {
      fromIndex: currentQIndex,
      toIndex: index,
      questionIndex: index,
      questionId: targetQ?.id,
      questionType: targetQ?.questionType,
      timeSpentSec: timeSpent,
      rapidNavigation: timeSpent < 3,
    });

    qStartTime.current = Date.now();
    setCurrentQIndex(index);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await flushTelemetry();
    try {
      const res = await api.submitExam(session.id, answers);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      onSubmitSuccess(res.session);
    } catch (err) {
      console.error('Final submit failed:', err);
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQIndex];
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => {
    const ans = answers[k];
    if (ans === undefined || ans === null || ans === '') return false;
    if (typeof ans === 'object' && !ans.code) return false;
    return true;
  }).length;

  const isUrgent = timeLeftSec < 300; // < 5 mins

  if (isSubmitting) {
    return (
      <LoadingScreen
        mode="fullscreen"
        title="Finalizing Examination & Cryptographic Attestation"
        subtitle="Compiling behavioral telemetry, sealing answers, and recording institutional evaluation..."
        phases={[
          'Flushing telemetry event buffer to immutable audit stream...',
          'Running keystroke & cadence anomaly analysis...',
          'Attesting submission timestamp against server authority...',
          'Submission recorded • Generating examination report',
        ]}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col select-none"
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
    >
      {/* Top Authoritative Exam Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center pr-2 border-r border-slate-200 dark:border-slate-800">
            <LogoIcon size={24} />
          </div>
          <div className="w-7 h-7 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentQIndex + 1}
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
              {exam.title}
            </div>
            <div className="text-[11px] text-slate-500 hidden md:block">
              Autosaved at {lastAutosaveTime} · Non-invasive behavioral telemetry active
            </div>
          </div>
        </div>

        {/* Controls: Badges, Fullscreen, Timer & Finish */}
        <div className="flex items-center gap-2">
          {/* Tab Switch Status Badge (2 Allowed) */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border ${
              tabSwitchCount === 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : tabSwitchCount === 1
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
            }`}
            title="Maximum 2 tab switches permitted before automatic examination termination"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>
              {tabSwitchCount === 0
                ? 'Tab Switches: 0/2 allowed'
                : tabSwitchCount === 1
                ? 'Tab Switches: 1/2 used (1 left)'
                : 'Tab Switches: 2/2 used (FINAL WARNING)'}
            </span>
          </div>

          {/* Copy/Paste Prohibited Badge */}
          <div
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            title="Clipboard copy and paste are strictly disabled"
          >
            <ClipboardX className="w-3 h-3 text-rose-500" />
            <span>No Copy/Paste</span>
          </div>

          {/* Single Screen Enforced Badge */}
          <div
            className={`hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${
              isMultiScreenDetected
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Single screen enforced (secondary displays prohibited)"
          >
            <Monitor className="w-3 h-3 text-blue-500" />
            <span>{isMultiScreenDetected ? 'Extra Screen Detected!' : 'Single Screen'}</span>
          </div>

          {/* Fullscreen Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${
              isFullscreen
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>{isFullscreen ? 'Fullscreen' : 'Fullscreen Required'}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-semibold ${
              isUrgent
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSec)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="py-1.5 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish</span>
          </button>
        </div>
      </header>

      {/* Real-time Telemetry Notice Banner */}
      {telemetryNotice && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{telemetryNotice.message}</span>
        </div>
      )}

      {/* Main Exam Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Area */}
        <main className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-6">
          {currentQ ? (
            <>
              {/* Question Header & Type Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      currentQ.questionType === 'CODING'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : currentQ.questionType === 'DESCRIPTIVE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {currentQ.questionType === 'CODING'
                      ? 'Coding Challenge'
                      : currentQ.questionType === 'DESCRIPTIVE'
                      ? 'Descriptive Analysis'
                      : 'Multiple Choice'}
                  </span>
                </div>
                <span className="font-mono text-slate-500">{currentQ.marks} Marks</span>
              </div>

              {/* Question Workspace Switching */}
              {currentQ.questionType === 'CODING' ? (
                <CodeWorkspace
                  question={currentQ}
                  sessionId={session.id}
                  savedAnswer={answers[currentQ.id]}
                  onAnswerChange={handleCodingAnswerChange}
                  onTelemetryEvent={recordEvent}
                />
              ) : currentQ.questionType === 'DESCRIPTIVE' ? (
                <DescriptiveWorkspace
                  question={currentQ}
                  savedAnswer={answers[currentQ.id]}
                  onAnswerChange={handleDescriptiveAnswerChange}
                  onTelemetryEvent={recordEvent}
                />
              ) : (
                /* Multiple Choice Question */
                <div className="space-y-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed select-none">
                    {currentQ.questionText}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {currentQ.options?.map((optionText, optIdx) => {
                      const isSelected = answers[currentQ.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs transition-colors flex items-start gap-3 ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-mono ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-bold'
                                : 'border-slate-300 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug pt-0.5">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleNavigateQuestion(currentQIndex - 1)}
                  disabled={currentQIndex === 0}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                <div className="text-xs text-slate-400">
                  {answers[currentQ.id] !== undefined ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                    </span>
                  ) : (
                    <span>Not answered yet</span>
                  )}
                </div>

                <button
                  onClick={() => handleNavigateQuestion(currentQIndex + 1)}
                  disabled={currentQIndex === questions.length - 1}
                  className="px-3.5 py-1.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">No questions loaded.</div>
          )}
        </main>

        {/* Right: Question Navigation Palette & Telemetry Status */}
        <aside aria-label="Question Navigation Palette" className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Question Palette</span>
              <span className="text-slate-500 font-mono">
                {answeredCount}/{questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = answers[q.id] !== undefined;

                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigateQuestion(idx)}
                    className={`h-11 rounded text-xs font-mono font-medium transition-colors flex flex-col items-center justify-center border relative ${
                      isCurrent
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : isAnswered
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="text-[9px] uppercase tracking-tighter opacity-80">
                      {q.questionType === 'CODING' ? 'CODE' : q.questionType === 'DESCRIPTIVE' ? 'DESC' : 'MCQ'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-slate-300 dark:border-slate-700" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-900 dark:bg-white" />
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Privacy & Behavioral Guarantee Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Non-Invasive Integrity Monitoring</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              ExamGuard AI evaluates interaction dynamics (window focus, typing cadence, clipboard events) rather than invasive webcam surveillance.
            </p>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Confirm Final Examination Submission
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
              {answeredCount < questions.length && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Warning: You have {questions.length - answeredCount} unanswered question(s).
                </span>
              )}
              Once submitted, your responses and behavioral telemetry will be finalized for human examiner review.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Return to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-1.5"
              >
                {isSubmitting ? 'Finalizing...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Fullscreen Enforcement Modal */}
      {!isFullscreen && !isTerminating && !isSubmitting && !tabWarningModal && !isMultiScreenDetected && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Maximize2 className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Fullscreen Access Required
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              This examination requires dedicated full-screen access to protect assessment integrity.
              Please enter full-screen mode to begin or continue answering.
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-left text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Institutional Integrity Rules</span>
              </div>
              <ul className="text-[11px] list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400">
                <li>Up to <strong>2 tab switches allowed</strong> with warnings (ends on 3rd)</li>
                <li><strong>Copy/Paste is not allowed</strong> in code and text workspaces</li>
                <li><strong>Another screen is not allowed</strong> (single monitor only)</li>
              </ul>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Enter Fullscreen Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal (Warnings 1 & 2 of 2) */}
      {tabWarningModal && !isTerminating && !isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border-2 ${
                tabWarningModal.count === 1
                  ? 'bg-amber-100 text-amber-600 border-amber-400 dark:bg-amber-950/70'
                  : 'bg-rose-100 text-rose-600 border-rose-500 dark:bg-rose-950/70 animate-pulse'
              }`}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  tabWarningModal.count === 1
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {tabWarningModal.count === 1 ? 'Warning 1 of 2' : 'Warning 2 of 2 · Final Warning'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {tabWarningModal.count === 1 ? 'Tab Switch Detected' : 'Final Tab Switch Warning'}
              </h2>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tabWarningModal.count === 1 ? (
                <>
                  You switched away from the active examination window. You have used <strong>1 of 2 allowed tab switches</strong>.
                </>
              ) : (
                <>
                  You switched away from the examination window again. You have used <strong>2 of 2 allowed tab switches</strong>.
                </>
              )}
            </p>

            <div
              className={`p-3 rounded-xl text-left text-xs border ${
                tabWarningModal.count === 1
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{tabWarningModal.count === 1 ? '1 Warning Remaining' : 'Zero Warnings Remaining'}</span>
              </div>
              <p className="text-[11px] mt-1 leading-normal">
                {tabWarningModal.count === 1
                  ? 'Switching tabs a 3rd time will immediately terminate and submit your examination.'
                  : 'Any subsequent tab switch or window minimization will terminate and submit your examination immediately.'}
              </p>
            </div>

            <button
              onClick={() => {
                setTabWarningModal(null);
                enterFullscreen();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>I Understand, Return to Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* Multiple Screens / Another Screen Detected Modal */}
      {isMultiScreenDetected && !isTerminating && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <MonitorX className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Another Screen / External Monitor Detected
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              Examination integrity rules strictly forbid multiple screens or external monitors.
              The exam interface has been paused until only a single monitor is active.
            </p>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-left text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Action Required: Disconnect External Displays</span>
              </div>
              <p className="text-[11px] leading-tight">
                Please unplug secondary monitors, close extended desktops, or set your display settings to &ldquo;Single Screen Only&rdquo; to resume your exam.
              </p>
            </div>

            <button
              onClick={() => {
                checkMultiScreen();
                enterFullscreen();
              }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span>Verify Single Screen Disconnection</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Switch Limit Exceeded Termination Overlay */}
      {isTerminating && (
        <div className="fixed inset-0 z-50 bg-rose-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-xl font-black text-rose-600 dark:text-rose-400">
              Examination Ended: Tab Switch Limit Exceeded
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You exceeded the maximum limit of <strong>2 allowed tab switches</strong> (3rd switch detected).
              As per institutional integrity rules, your examination has been <strong>automatically terminated and submitted</strong>.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 font-mono text-center">
              Sealing current answers and transmitting final submission...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
