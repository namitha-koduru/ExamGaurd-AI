/**
 * ExamGuard AI - Student Examination Result & Feedback
 * Privacy-safe explanation of behavioral dynamics
 */

import React from 'react';
import { ExamSession } from '../../types';
import { CheckCircle2, ShieldCheck, ArrowRight, Activity, Clock, FileText, Info } from 'lucide-react';

interface ExamResultProps {
  session: ExamSession;
  onReturnDashboard: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({ session, onReturnDashboard }) => {
  const answeredCount = Object.keys(session.answers || {}).length;
  const features = session.features;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Examination Submitted Successfully
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Your responses for <strong>{session.examTitle}</strong> have been recorded in the institution registry.
        </p>
      </div>

      {/* Submission Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-left text-xs space-y-3 max-w-md mx-auto shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Submission Timestamp</span>
          <span className="font-mono text-slate-900 dark:text-white">
            {new Date(session.submittedAt || Date.now()).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Answered Questions</span>
          <span className="font-mono text-slate-900 dark:text-white font-medium">
            {answeredCount} Recorded
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">Duration</span>
          <span className="font-mono text-slate-900 dark:text-white font-medium">
            {Math.round((session.durationSeconds || 0) / 60)} minutes
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Faculty Review Status</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {session.proctorStatus === 'REVIEWED'
              ? 'Verified Compliant'
              : session.proctorStatus === 'FLAGGED'
              ? 'In Committee Review'
              : 'Pending Faculty Review'}
          </span>
        </div>
      </div>

      {/* Privacy-Safe Behavioral Telemetry Explanation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-left text-xs space-y-3 max-w-md mx-auto shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Privacy-Preserving Behavioral Report</span>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed">
          ExamGuard AI evaluated statistical telemetry to verify session integrity without biometric intrusion:
        </p>

        <div className="space-y-2 pt-1 font-mono text-[11px]">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <span className="text-slate-500 font-sans">Active Focus Continuity:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {features ? Math.round(100 - Math.min(100, (features.focus_loss_count * 5))) : 95}%
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <span className="text-slate-500 font-sans">Interaction Classification:</span>
            <span
              className={`font-semibold ${
                session.riskLevel === 'HIGH_ANOMALY'
                  ? 'text-rose-600'
                  : session.riskLevel === 'REVIEW'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {session.riskLevel === 'NORMAL' ? 'Standard Rhythm' : 'Review Recommended'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
          <span>
            Decision-support note: Behavioral metrics only detect unusual rhythms. They never definitively prove misconduct and require human faculty verification.
          </span>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 text-xs text-left max-w-md mx-auto flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-slate-500 text-[11px] leading-relaxed">
          <strong>Privacy Charter Guarantee:</strong> Zero webcam footage, facial recognition scans, or microphone audio was gathered. Only client interaction metadata was analyzed.
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onReturnDashboard}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors"
        >
          <span>Return to Student Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
