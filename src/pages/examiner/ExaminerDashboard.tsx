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
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; text: string }>>([
    { id: '1', time: 'Just now', text: 'Live proctor monitoring pipeline connected (SSE active).' },
  ]);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 6000);
    return () => clearInterval(interval);
  }, []);

  // Listen to SSE live proctor stream if available
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/proctor/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'PROCTOR_ALERT' || payload.type === 'RISK_SCORE_UPDATED') {
            setLiveEvents((prev) => [
              {
                id: `${Date.now()}-${Math.random()}`,
                time: new Date().toLocaleTimeString(),
                text: `${payload.studentName || 'Student'}: ${payload.message || 'Telemetry updated'} (Risk: ${payload.riskScore || 0})`,
              },
              ...prev.slice(0, 5),
            ]);
            loadSessions();
          }
        } catch (e) {
          // parse error
        }
      };
    } catch (err) {
      console.warn('SSE connection unavailable in this context, using polling.');
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

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
              Examiner Proctoring Center
            </h1>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <Radio className="w-3 h-3 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time behavioral biometric anomaly detection across institutional examination sessions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSessions}
            className="p-2 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onCreateExam}
            className="py-1.5 px-3 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Examination</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Total Sessions</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalSessions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recorded attempts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Active Right Now</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Live examinees</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Baseline Normal</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {normalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Risk 0-29</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">Review Recommended</div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {reviewCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Moderate deviation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs">
          <div className="text-slate-500 text-[11px]">High Anomaly Flags</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {highAnomalyCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Score &gt;= 75</div>
        </div>
      </div>

      {/* Live Proctor Activity Stream */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Real-Time Proctor Broadcast Feed
          </span>
          <span className="text-[10px] text-slate-500">Auto-refreshing</span>
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
            placeholder="Search by student name or course..."
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

      {/* Main Sessions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Examination</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Risk Classification</th>
                <th className="py-3 px-4 font-semibold">Focus & Clipboard</th>
                <th className="py-3 px-4 font-semibold text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{s.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.studentEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200">{s.examTitle}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.startedAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={s.status} />
                    </td>

                    <td className="py-3 px-4">
                      <RiskBadge level={s.riskLevel} score={s.riskScore} />
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      <span>{s.features?.focus_loss_count ?? 0} blurs</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span>{s.features?.paste_count ?? 0} pastes</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectSession(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No examination sessions match the selected filters.
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
