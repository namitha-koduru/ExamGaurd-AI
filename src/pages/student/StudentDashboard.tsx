import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Exam, ExamSession } from '../../types';
import { StatusBadge, RiskBadge } from '../../components/common/Badge';
import { BookOpen, Clock, FileText, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface StudentDashboardProps {
  onSelectExam: (exam: Exam) => void;
  onViewResult?: (session: ExamSession) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSelectExam }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allExams, allSessions] = await Promise.all([
          api.getExams(),
          api.getSessions(),
        ]);
        setExams(allExams);
        const mySessions = allSessions.filter((s) => s.studentId === user?.id || s.studentEmail === user?.email);
        setPastSessions(mySessions);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Loading examination portal...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Student Welcome & Privacy Assurance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            All exams in this portal are monitored using SmartExam AI’s privacy-preserving behavioral biometric telemetry.
            Your video and microphone are never recorded. Only interaction dynamics (focus, answer cadence, clipboard events) are analyzed.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Non-Invasive Protocol Active</span>
        </div>
      </div>

      {/* Available Examinations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Available Examinations
          </h2>
          <span className="text-xs text-slate-500">{exams.length} Active Courses</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const hasCompleted = pastSessions.some((s) => s.examId === exam.id && s.status === 'SUBMITTED');
            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-mono text-slate-500 font-medium">{exam.courseCode}</span>
                    <StatusBadge status={exam.status} />
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {exam.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.totalQuestions} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  {hasCompleted ? (
                    <div className="w-full py-2 px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-default">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Exam Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectExam(exam)}
                      className="w-full py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Take Examination</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Completed Session History */}
      {pastSessions.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Recent Examination Submissions
          </h2>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pastSessions.map((sess) => (
                <div key={sess.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                      {sess.examTitle}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Submitted: {sess.submittedAt ? new Date(sess.submittedAt).toLocaleString() : 'In Progress'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={sess.status} />
                    <div className="text-right">
                      <div className="text-slate-400 text-[11px]">Proctor Review</div>
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {sess.proctorStatus || 'Verified'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
