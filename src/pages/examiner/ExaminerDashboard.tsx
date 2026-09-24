import React, { useState, useEffect } from 'react';
import { ExamSession, Exam, RiskLevel } from '../../types';
import { api } from '../../services/api';
import { RiskBadge, StatusBadge } from '../../components/common/Badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Plus,
  RefreshCw,
  Eye,
  Radio,
  Key,
  Copy,
  Check,
  Calendar,
  Award,
  BookOpen,
  Users,
} from 'lucide-react';

interface ExaminerDashboardProps {
  onSelectSession: (sessionId: string) => void;
  onCreateExam: () => void;
}

export const ExaminerDashboard: React.FC<ExaminerDashboardProps> = ({
  onSelectSession,
  onCreateExam,
}) => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; text: string }>>([
    { id: '1', time: 'Just now', text: 'Live proctor monitoring pipeline connected (SSE active).' },
  ]);

  const loadData = async () => {
    try {
      const [sessData, examsData] = await Promise.all([
        api.getSessions(),
        api.getExams(),
      ]);
      setSessions(sessData);
      setExams(examsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen to SSE live proctor stream with automatic in-memory reactive updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/proctor/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;
          const data = payload.payload || payload;

          if (type === 'RISK_UPDATE') {
            // Live update session risk in-memory without waiting for refresh
            setSessions((prev) =>
              prev.map((s) =>
                s.id === data.sessionId
                  ? { ...s, riskScore: data.riskScore, riskLevel: data.riskLevel }
                  : s
              )
            );

            const isElevated = data.riskScore >= 55;
            const desc = `${data.studentName || 'Candidate'}: Behavioral Risk updated to ${data.riskScore}/100 (${data.riskLevel})${isElevated ? ' — Review Recommended' : ' — Normal Pattern'}`;

            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: desc,
              },
              ...prev.slice(0, 9),
            ]);
          } else if (type === 'BEHAVIOR_UPDATE') {
            const ev = data.latestEventType || 'Interaction event';
            const desc = `${data.studentName || 'Candidate'}: Telemetry event ${ev} received (${data.eventCount} events buffered)`;

            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: desc,
              },
              ...prev.slice(0, 9),
            ]);
          } else if (type === 'SESSION_STARTED') {
            const desc = `Candidate ${data.studentName} started examination '${data.examTitle}'`;
            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: desc,
              },
              ...prev.slice(0, 9),
            ]);
            loadData();
          } else if (type === 'SESSION_SUBMITTED') {
            const desc = `Candidate ${data.studentName} submitted '${data.examTitle}' (Score: ${data.score}/${data.maxScore}, Risk: ${data.riskScore})`;
            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: desc,
              },
              ...prev.slice(0, 9),
            ]);
            loadData();
          } else if (type === 'SESSION_REVIEWED') {
            const desc = `Examiner ${data.reviewer} updated proctor review status to '${data.proctorStatus}'`;
            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: desc,
              },
              ...prev.slice(0, 9),
            ]);
            loadData();
          }
        } catch {
          // parse error
        }
      };
    } catch (err) {
      console.warn('SSE connection unavailable in this context, using polling fallback.');
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleCopyCode = (examId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedExamId(examId);
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  // Compute Metrics
  const totalSessions = sessions.length;
  const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length;
  const normalCount = sessions.filter((s) => s.riskLevel === 'NORMAL').length;
  const reviewCount = sessions.filter((s) => s.riskLevel === 'REVIEW').length;
  const highAnomalyCount = sessions.filter((s) => s.riskLevel === 'HIGH_ANOMALY').length;

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || s.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Examiner Command & Proctoring Center
            </h1>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <Radio className="w-3 h-3 animate-pulse" />
              Live Telemetry & Evaluation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage scheduled examinations, distribute access codes to candidates, and review academic results and behavioral forensics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onCreateExam}
            className="py-1.5 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Examination</span>
          </button>
        </div>
      </div>

      {/* SECTION: Published Examinations & Teacher Access Codes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            Active Examinations & Student Access Keys
          </h2>
          <span className="text-[11px] text-slate-400">
            Tell these access codes to your students before they start
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exams.map((ex) => {
            const examSessions = sessions.filter((s) => s.examId === ex.id);
            const submissionsCount = examSessions.filter((s) => s.status === 'SUBMITTED').length;
            const activeInExam = examSessions.filter((s) => s.status === 'ACTIVE').length;
            const isCopied = copiedExamId === ex.id;
            const now = new Date();
            const isExpired = new Date(ex.endTime) < now;
            const isUpcoming = new Date(ex.startTime) > now;

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {ex.courseCode}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : isUpcoming
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {isExpired ? 'EXPIRED' : isUpcoming ? 'UPCOMING' : 'OPEN'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 line-clamp-1">
                    {ex.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {ex.description || 'Institutional examination paper.'}
                  </p>
                </div>

                {/* Big Access Key Display with 1-click Copy */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Exam Access Code:
                    </span>
                    <span className="text-base font-black font-mono tracking-wider text-indigo-600 dark:text-indigo-400">
                      🔑 {ex.accessCode || 'A7K9-XP2'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(ex.id, ex.accessCode || 'A7K9-XP2')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-xs"
                    title="Copy exam code to give to students"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Schedule & Duration Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500 font-mono">
                  <div>
                    <span>Duration: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{ex.durationMinutes}m</strong>
                  </div>
                  <div>
                    <span>Total Marks: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{ex.totalMarks}</strong>
                  </div>
                  <div className="col-span-2 text-[10px]">
                    <span>Deadline: </span>
                    <strong className="text-red-600 dark:text-red-400">
                      {new Date(ex.endTime).toLocaleDateString()} {new Date(ex.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">Submissions: <strong>{submissionsCount}</strong></span>
                    {activeInExam > 0 && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {activeInExam} Taking Exam
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Total Submissions</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalSessions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recorded examinee sessions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Writing Exam Now</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active candidates</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Normal Pattern</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {normalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Risk 0-29 (Compliant)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Review Advisory</div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {reviewCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Risk 50-74 (Moderate)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">High Anomaly Flags</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {highAnomalyCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Risk &gt;= 75 (Forensic Alert)</div>
        </div>
      </div>

      {/* Live Proctor Activity Stream */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live Institutional Audit & Broadcast Feed (SSE)
          </span>
          <span className="text-[10px] text-slate-500">Auto-streaming</span>
        </div>
        <div className="divide-y divide-slate-800 text-[11px] font-mono">
          {liveEvents.slice(0, 3).map((item) => (
            <div key={item.id} className="py-1 flex items-center justify-between gap-4">
              <span className="text-slate-300 truncate">{item.text}</span>
              <span className="text-slate-500 shrink-0 text-[10px]">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or course code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Filter className="w-3 h-3" />
            <span>Risk Level:</span>
          </div>

          <div className="inline-flex rounded border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-[11px]">
            {['ALL', 'NORMAL', 'LOW_CONCERN', 'REVIEW', 'HIGH_ANOMALY'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  riskFilter === lvl
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL'
                  ? 'All'
                  : lvl === 'NORMAL'
                  ? 'Normal'
                  : lvl === 'LOW_CONCERN'
                  ? 'Low'
                  : lvl === 'REVIEW'
                  ? 'Review'
                  : 'High Anomaly'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Submissions & Evaluation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Student Submissions & Proctoring Results
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredSessions.length} records found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Candidate</th>
                <th className="py-3 px-4 font-semibold">Examination</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Calculated Score</th>
                <th className="py-3 px-4 font-semibold">Malpractice Risk</th>
                <th className="py-3 px-4 font-semibold">Telemetry Flags</th>
                <th className="py-3 px-4 font-semibold text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s) => {
                  const scoreDisplay = s.score !== undefined && s.maxScore
                    ? `${s.score} / ${s.maxScore} (${s.scorePercentage ?? Math.round((s.score / s.maxScore) * 100)}%)`
                    : s.status === 'SUBMITTED'
                    ? 'Graded'
                    : 'In Progress';

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{s.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.studentEmail}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{s.examTitle}</div>
                        <div className="text-[10px] text-slate-400">
                          Started: {new Date(s.startedAt).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={s.status} />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {scoreDisplay}
                        </div>
                        {s.gradingBreakdown && (
                          <div className="text-[10px] text-slate-400">
                            {s.gradingBreakdown.filter(g => g.isCorrect).length} / {s.gradingBreakdown.length} questions correct
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <RiskBadge level={s.riskLevel} score={s.riskScore} />
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        <div>{s.features?.focus_loss_count ?? 0} tab blurs</div>
                        <div>{s.features?.paste_count ?? 0} paste bursts</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectSession(s.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Results & Malpractice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No examination records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
