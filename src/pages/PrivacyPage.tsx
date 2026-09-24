import React from 'react';
import { ShieldCheck, EyeOff, MicOff, Lock, CheckCircle2, XCircle, FileText, Database } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Privacy Charter</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Privacy-Preserving Examination Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          ExamGuard AI is built on the fundamental premise: <strong>Detect behavior, not the person.</strong>
          We believe high-stakes academic integrity should never require invasive home surveillance or biometric profiling.
        </p>
      </div>

      {/* Comparison Matrix: Invasive vs ExamGuard AI */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Architectural Comparison: Conventional Proctoring vs ExamGuard AI
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Legacy Proctors */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-300 text-sm">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Conventional Invasive Proctoring</span>
            </div>
            <ul className="space-y-2 text-rose-800/90 dark:text-rose-300/80 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>Continuous webcam video recording of student room and facial expressions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>Ambient microphone listening and acoustic environment profiling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>Biometric facial recognition, eye tracking, and emotional speculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>Deep OS invasive kernel drivers scanning local files and processes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>Automated false accusations ("student flagged as cheating")</span>
              </li>
            </ul>
          </div>

          {/* ExamGuard AI */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ExamGuard AI Non-Invasive Approach</span>
            </div>
            <ul className="space-y-2 text-emerald-800/90 dark:text-emerald-300/80 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Zero webcam access. No video stream is ever requested or captured</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Zero microphone access. Complete acoustic privacy in the student’s home</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Interaction telemetry only: window focus, typing cadence, clipboard metadata</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Zero key content logged: only typing speed (WPM) and interval variance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Human-in-the-loop: flags anomaly for review; never declares guilt</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Minimization & Retention Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Data Minimization & Retention Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Ephemeral Aggregation</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Raw mouse moves and keystroke timestamps are aggregated locally inside browser memory into summary features. No raw stream is stored indefinitely.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>No Secret Text Storage</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Clipboard events record character count and event type only. The copied or pasted text is never stored in the database.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>30-Day Retention Window</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Exam interaction logs are scheduled for automatic purge following the institutional grade grievance dispute period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
