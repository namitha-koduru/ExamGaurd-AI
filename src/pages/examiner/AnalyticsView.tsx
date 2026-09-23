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
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAnalyticsOverview();
        setAnalytics(data);
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

  const { metrics, riskDistribution, focusLossRanges } = analytics;

  const riskData = [
    { name: 'Normal (0-29)', count: riskDistribution.normal, fill: '#10b981' },
    { name: 'Low Concern (30-54)', count: riskDistribution.lowConcern, fill: '#3b82f6' },
    { name: 'Review (55-74)', count: riskDistribution.review, fill: '#f59e0b' },
    { name: 'High Anomaly (75-100)', count: riskDistribution.highAnomaly, fill: '#ef4444' },
  ];

  const focusData = [
    { range: '0s (None)', count: focusLossRanges['0s'] || 0 },
    { range: '1-10s', count: focusLossRanges['1-10s'] || 0 },
    { range: '11-30s', count: focusLossRanges['11-30s'] || 0 },
    { range: '31-60s', count: focusLossRanges['31-60s'] || 0 },
    { range: '>60s', count: focusLossRanges['>60s'] || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Cohort Behavioral Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated behavioral biometric patterns, anomaly rates, and window focus retention statistics
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Total Analyzed Sessions</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics.totalSessions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all examinations</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Average Risk Score</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {metrics.averageRiskScore}/100
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Within target bounds</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Baseline Normal Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {Math.round((riskDistribution.normal / Math.max(1, metrics.totalSessions)) * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Require no proctor intervention</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="text-slate-500 text-[11px]">Flagged For Review</div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {riskDistribution.review + riskDistribution.highAnomaly}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Candidates for human verification</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Level Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Risk Level Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Number of examinees grouped by behavioral risk tiers</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Loss Duration Ranges */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Window Blur & Focus Loss Duration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Total duration students spent outside active exam window</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
