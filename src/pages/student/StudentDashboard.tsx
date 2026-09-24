import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Exam, ExamSession } from '../../types';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import {
  BookOpen,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Key,
  Calendar,
  Lock,
  Check,
  AlertTriangle,
  X,
  Award,
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectExam: (exam: Exam, accessCode: string) => void;
  onViewResult?: (session: ExamSession) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectExam,
  onViewResult,
}) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Exam Code Modal state
  const [selectedExamForCode, setSelectedExamForCode] = useState<Exam | null>(null);
  const [inputCode, setInputCode] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [allExams, allSessions] = await Promise.all([
          api.getExams(),
          api.getSessions(),
        ]);
        setExams(allExams);
        const mySessions = allSessions.filter(
          (s) => s.studentId === user?.id || s.studentEmail === user?.email
        );
        setPastSessions(mySessions);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleOpenCodeModal = (exam: Exam) => {
    setSelectedExamForCode(exam);
    setInputCode('');
    setValidationError(null);
    setValidationSuccess(false);
  };

  const handleValidateAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForCode || !inputCode.trim()) return;

    setValidating(true);
    setValidationError(null);

    try {
      const res = await api.validateExamCode(selectedExamForCode.id, inputCode.trim());

      if (res.valid) {
        setValidationSuccess(true);
        setTimeout(() => {
          const target = selectedExamForCode;
          const key = inputCode.trim();
          setSelectedExamForCode(null);
          onSelectExam(target, key);
        }, 600);
      } else {
        setValidationError(res.message || 'Invalid exam code. Please check with your teacher.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Validation request failed. Please check network connection.');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Loading institutional examination portal...
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Student Welcome & Privacy Assurance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome, {user?.name}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              Student ID: {user?.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            All examinations enforce single-attempt integrity within the scheduled deadline. Behavioral biometric telemetry continuously assesses natural test-taking patterns without webcam, audio recording, or intrusive surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Privacy Preserved · Non-Invasive</span>
        </div>
      </div>

      {/* Available Examinations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Institutional Examinations
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {exams.length} Courses Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const completedSession = pastSessions.find(
              (s) => s.examId === exam.id && s.status === 'SUBMITTED'
            );
            const activeSession = pastSessions.find(
              (s) => s.examId === exam.id && s.status === 'ACTIVE'
            );

            const startTime = new Date(exam.startTime);
            const endTime = new Date(exam.endTime);
            const isExpired = now > endTime;
            const isUpcoming = now < startTime;
            const isAvailable = !isExpired && !isUpcoming && !completedSession;

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                      {exam.courseCode}
                    </span>

                    {completedSession ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        ATTEMPTED
                      </span>
                    ) : isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        DEADLINE EXPIRED
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        OPENS SOON
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        AVAILABLE NOW
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {exam.description || 'Institutional examination paper.'}
                  </p>

                  {/* Schedule & Duration Specs */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.totalQuestions} Questions</span>
                    </div>
                    <div className="col-span-2 text-[10px] pt-1 text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        Deadline: <strong className="text-red-600 dark:text-red-400">{endTime.toLocaleDateString()} {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                    </div>
                  </div>

                  {/* If completed: Score display banner */}
                  {completedSession && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200 block">
                            Score Achieved:
                          </span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {completedSession.score !== undefined ? `${completedSession.score} / ${completedSession.maxScore || exam.totalMarks}` : 'Submitted'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">1/1 Attempt</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3">
                  {completedSession ? (
                    <button
                      onClick={() => onViewResult && onViewResult(completedSession)}
                      className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View My Submission & Results</span>
                    </button>
                  ) : isExpired ? (
                    <div className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Deadline Expired — Closed</span>
                    </div>
                  ) : isUpcoming ? (
                    <div className="w-full py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Opens {startTime.toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenCodeModal(exam)}
                      className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Enter Exam Code & Start</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: Enter Exam Code & Validate Flow */}
      {selectedExamForCode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Enter Examination Key
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedExamForCode.courseCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamForCode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleValidateAndStart} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                  {selectedExamForCode.title}
                </span>
                <p className="text-[11px] text-slate-500">
                  Please enter the access code announced by your teacher to unlock and start this examination.
                </p>
              </div>

              {/* Single Attempt Warning Box */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Institutional Policy:</strong> Each candidate is permitted only <strong>one single attempt</strong> within the deadline. Once started, the timer runs authoritatively.
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Exam Access Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      setValidationError(null);
                    }}
                    placeholder="e.g. A7K9-XP2"
                    className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-indigo-500 outline-hidden uppercase"
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <Key className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Official code announced by faculty</span>
                  <span className="font-mono text-slate-500">
                    Format: XXXX-XXX
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {validationError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Success State */}
              {validationSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Code verified! Initializing secure exam session...</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedExamForCode(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validating || !inputCode.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {validating ? (
                    <span>Validating Key...</span>
                  ) : (
                    <>
                      <span>Validate & Proceed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
