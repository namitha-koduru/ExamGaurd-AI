/**
 * ExamGuard AI - Student Examination Result & Feedback
 * Privacy-safe explanation of behavioral dynamics & score
 */

import React from 'react';
import { ExamSession } from '../../types';
import { Logo } from '../../components/common/Logo';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Activity,
  Clock,
  FileText,
  Info,
  Award,
  Key,
  Check,
  XCircle,
} from 'lucide-react';

interface ExamResultProps {
  session: ExamSession;
  onReturnDashboard: () => void;
}

export const ExamResult: React.FC<ExamResultProps> = ({ session, onReturnDashboard }) => {
  const answeredCount = Object.keys(session.answers || {}).length;
  const features = session.features;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center space-y-6">
      <div className="flex justify-center mb-2">
        <Logo size={36} subtitle={session.institutionName || 'Institutional Academic Registry'} />
      </div>

      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Examination Submitted Successfully
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Your responses for <strong>{session.examTitle}</strong> have been evaluated and recorded in the institutional registry.
        </p>
      </div>

      {/* Main Score & Academic Result Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left text-xs space-y-4 max-w-md mx-auto shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
              Candidate Score
            </span>
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {session.score !== undefined ? session.score : 0}
              <span className="text-sm font-normal text-slate-400"> / {session.maxScore || 50}</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
              {session.scorePercentage ?? (session.maxScore ? Math.round(((session.score || 0) / session.maxScore) * 100) : 0)}%
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
              Completed
            </span>
          </div>
        </div>

        <div className="space-y-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Exam Access Key:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              🔑 {session.accessCodeUsed || 'A7K9-XP2'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Submission Time:</span>
            <span>{new Date(session.submittedAt || Date.now()).toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Time Taken:</span>
            <span>{Math.round((session.durationSeconds || 0) / 60)} minutes</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">Attempt Limit:</span>
            <span className="text-emerald-600 font-semibold">1 of 1 (Final)</span>
          </div>
        </div>

        {/* Question Breakdown Preview */}
        {session.gradingBreakdown && session.gradingBreakdown.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
              Question Summary:
            </span>
            <div className="space-y-1.5">
              {session.gradingBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50 text-[11px]"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                    Q{idx + 1}: {item.questionTitle}
                  </span>
                  <span className={`font-mono font-bold ${item.isCorrect ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {item.marksAwarded}/{item.maxMarks}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Privacy-Safe Behavioral Telemetry Explanation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3 max-w-md mx-auto shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Non-Invasive Integrity Report</span>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed">
          ExamGuard AI evaluated continuous statistical biometrics to verify natural human test-taking patterns:
        </p>

        <div className="space-y-2 pt-1 font-mono text-[11px]">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <span className="text-slate-500 font-sans">Window Focus Continuity:</span>
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
              {session.riskLevel === 'NORMAL' ? 'Standard Rhythm (Compliant)' : 'Advisory Review'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
          <span>
            Telemetry note: Behavioral metrics provide explainable decision-support and never replace human faculty evaluation.
          </span>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 text-xs text-left max-w-md mx-auto flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-slate-500 text-[11px] leading-relaxed">
          <strong>Privacy Protocol Guarantee:</strong> Zero video streams, webcam images, audio recordings, or desktop snooping occurred during this session.
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onReturnDashboard}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <span>Return to Student Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
