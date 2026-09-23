import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question, ExamSession, BehaviorEvent } from '../../types';
import { api } from '../../services/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Shield,
  EyeOff,
  Copy,
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
  const [answers, setAnswers] = useState<Record<string, number>>(session.answers || {});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(exam.durationMinutes * 60);
  const [lastAutosaveTime, setLastAutosaveTime] = useState<string>('Just now');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [telemetryNotice, setTelemetryNotice] = useState<{ message: string; type: 'warn' | 'info' } | null>(null);

  // Telemetry buffer ref
  const telemetryBuffer = useRef<Partial<BehaviorEvent>[]>([]);
  const lastFocusLoss = useRef<number>(0);
  const keyTimestamps = useRef<number[]>([]);
  const mouseMoves = useRef<number>(0);
  const qStartTime = useRef<number>(Date.now());

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
    const event: Partial<BehaviorEvent> = {
      eventType: eventType as any,
      timestamp: Date.now(),
      metadata,
    };
    telemetryBuffer.current.push(event);

    // If buffer exceeds 10 items or significant event, flush immediately
    if (
      telemetryBuffer.current.length >= 8 ||
      eventType === 'TAB_FOCUS_LOST' ||
      eventType === 'PASTE_ATTEMPT'
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
    } catch (e) {
      // re-queue on error
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

  // Window Focus & Blur Listener
  useEffect(() => {
    const handleBlur = () => {
      lastFocusLoss.current = Date.now();
      recordEvent('TAB_FOCUS_LOST', { reason: 'browser_window_blur' });
      setTelemetryNotice({
        message: 'Exam window lost focus. Focus transitions are logged for proctor review.',
        type: 'warn',
      });
      setTimeout(() => setTelemetryNotice(null), 4000);
    };

    const handleFocus = () => {
      const durationMs = lastFocusLoss.current > 0 ? Date.now() - lastFocusLoss.current : 0;
      recordEvent('TAB_FOCUS_RETURNED', { durationMs });
      lastFocusLoss.current = 0;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        lastFocusLoss.current = Date.now();
        recordEvent('TAB_FOCUS_LOST', { reason: 'document_hidden' });
      } else {
        const durationMs = lastFocusLoss.current > 0 ? Date.now() - lastFocusLoss.current : 0;
        recordEvent('TAB_FOCUS_RETURNED', { durationMs, reason: 'document_visible' });
        lastFocusLoss.current = 0;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      recordEvent('COPY_ATTEMPT', {
        charCount: window.getSelection()?.toString().length || 0,
      });
      setTelemetryNotice({
        message: 'Notice: Content copying is logged in the session audit trail.',
        type: 'warn',
      });
      setTimeout(() => setTelemetryNotice(null), 3500);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const len = e.clipboardData?.getData('text')?.length || 0;
      recordEvent('PASTE_ATTEMPT', { charCount: len });
      setTelemetryNotice({
        message: 'Notice: External clipboard paste logged.',
        type: 'warn',
      });
      setTimeout(() => setTelemetryNotice(null), 3500);
    };

    const handleKeyDown = () => {
      const now = Date.now();
      keyTimestamps.current.push(now);
      if (keyTimestamps.current.length > 15) keyTimestamps.current.shift();

      if (keyTimestamps.current.length >= 8) {
        const delta = (now - keyTimestamps.current[0]) / 1000;
        const wpm = delta > 0 ? Math.round(((keyTimestamps.current.length / 5) / delta) * 60) : 40;
        recordEvent('KEYBOARD_ACTIVITY', { speedWpm: Math.min(120, wpm) });
      }
    };

    const handleMouseMove = () => {
      mouseMoves.current++;
      if (mouseMoves.current >= 40) {
        recordEvent('MOUSE_ACTIVITY', { mouseIntensity: 55 });
        mouseMoves.current = 0;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const saveCurrentAnswers = async (currentAns: Record<string, number>) => {
    try {
      await api.autosaveAnswers(session.id, currentAns);
      setLastAutosaveTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Autosave warning:', err);
    }
  };

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

  const handleNavigateQuestion = (index: number) => {
    if (index === currentQIndex || index < 0 || index >= questions.length) return;

    const timeSpent = Math.round((Date.now() - qStartTime.current) / 1000);
    recordEvent('QUESTION_CHANGED', {
      fromIndex: currentQIndex,
      questionIndex: index,
      timeSpentSec: timeSpent,
    });

    qStartTime.current = Date.now();
    setCurrentQIndex(index);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await flushTelemetry();
    try {
      const res = await api.submitExam(session.id, answers);
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

  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeftSec < 300; // < 5 mins

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Authoritative Exam Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {currentQIndex + 1}
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
              {exam.title}
            </div>
            <div className="text-[11px] text-slate-500">
              Autosaved at {lastAutosaveTime} · Non-invasive telemetry active
            </div>
          </div>
        </div>

        {/* Timer & Submit CTA */}
        <div className="flex items-center gap-4">
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
            className="py-1.5 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
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
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <span className="font-mono">{currentQ.marks} Marks</span>
              </div>

              {/* Question Text */}
              <div className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed select-none">
                {currentQ.questionText}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((optionText, optIdx) => {
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
                    className={`h-9 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center border ${
                      isCurrent
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : isAnswered
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
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

          {/* Privacy & Telemetry Sensor Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Non-Invasive Proctoring Active</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Interaction biometrics are continuously recorded. Avoid leaving the exam window or copying external text to keep your session within the normal baseline.
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
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
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
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
