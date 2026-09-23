/**
 * ExamGuard AI - Cohort Behavioral Analytics & Audit Trail
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity, History, Clock } from 'lucide-react';
import { AuditLog } from '../../types';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [data, logs] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getAuditLogs().catch(() => []),
        ]);
        setAnalytics(data);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        Loading institutional behavioral analytics...
      </div>
    );
  }

  const { metrics, riskDistribution, focusLossRanges, topAnomalyPatterns } = analytics;

  const riskData = [
    { name: 'Normal (0-29)', count: riskDistribution?.normal || 0, fill: '#10b981' },
    { name: 'Low Concern (30-54)', count: riskDistribution?.lowConcern || 0, fill: '#3b82f6' },
    { name: 'Review (55-74)', count: riskDistribution?.review || 0, fill: '#f59e0b' },
    { name: 'High Anomaly (75-100)', count: riskDistribution?.highAnomaly || 0, fill: '#ef4444' },
  ];

  const focusData = [
    { range: '0s (None)', count: focusLossRanges?.['0s'] || 0 },
    { range: '1-10s', count: focusLossRanges?.['1-10s'] || 0 },
    { range: '11-30s', count: focusLossRanges?.['11-30s'] || 0 },
    { range: '31-60s', count: focusLossRanges?.['31-60s'] || 0 },
    { range: '>60s', count: focusLossRanges?.['>60s'] || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Cohort Behavioral Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated behavioral biometric patterns, anomaly rates, and window focus retention statistics
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-slate-600 dark:text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Model: {analytics.modelVersion || 'behavioral-iforest-v2'}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Total Analyzed Sessions</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics?.totalSessions ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all examinations</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Average Risk Score</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics?.averageRiskScore ?? 0}/100
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Within target baseline</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Baseline Normal Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {Math.round(((riskDistribution?.normal || 0) / Math.max(1, metrics?.totalSessions || 1)) * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Require no intervention</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Flagged For Review</div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {(riskDistribution?.highAnomaly || 0) + (riskDistribution?.review || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recommended for inspection</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cohort Risk Level Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sessions categorized by explainable anomaly confidence
            </p>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {riskData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-600 dark:text-slate-400">{item.name}:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Loss Duration Histogram */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Focus Loss Duration Frequency
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative seconds spent away from the active examination window
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            Most examinees remain within the target &lt; 10s focus transition window.
          </div>
        </div>
      </div>

      {/* Audit Log Trail */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Institutional Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable log of proctor evaluations, exam creations, and final session submissions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{auditLogs.length} Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Actor</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Target</th>
                <th className="py-2.5 px-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {log.actorName} ({log.actorRole})
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">{log.targetId}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
