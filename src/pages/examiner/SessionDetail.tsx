import React, { useState, useEffect } from 'react';
import { ExamSession, BehaviorEvent, AnomalyReport, BaselineFeatureComparison } from '../../types';
import { api } from '../../services/api';
import { RiskBadge, StatusBadge } from '../../components/common/Badge';
import { Timeline } from '../../components/common/Timeline';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileText,
  User,
  Activity,
  Layers,
  Save,
} from 'lucide-react';

interface SessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ sessionId, onBack }) => {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [timeline, setTimeline] = useState<BehaviorEvent[]>([]);
  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null);
  const [featureComparison, setFeatureComparison] = useState<BaselineFeatureComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'comparison' | 'timeline' | 'explanation'>('comparison');

  // Proctor review form
  const [proctorStatus, setProctorStatus] = useState<'UNREVIEWED' | 'REVIEWED' | 'FLAGGED'>('UNREVIEWED');
  const [proctorNotes, setProctorNotes] = useState<string>('');
  const [savingReview, setSavingReview] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadForensics() {
      try {
        const [detailData, timelineData] = await Promise.all([
          api.getSessionDetail(sessionId),
          api.getSessionTimeline(sessionId),
        ]);
        setSession(detailData.session);
        setAnomalyReport(detailData.anomalyReport || null);
        setFeatureComparison(detailData.featureComparison || []);
        setTimeline(timelineData);
        setProctorStatus(detailData.session.proctorStatus || 'UNREVIEWED');
        setProctorNotes(detailData.session.proctorNotes || '');
      } catch (err) {
        console.error('Failed to load session forensics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadForensics();
  }, [sessionId]);

  const handleSaveReview = async () => {
    setSavingReview(true);
    try {
      await api.updateSessionReview(sessionId, {
        proctorStatus,
        proctorNotes,
      });
      setSaveSuccessMsg('Proctor evaluation saved.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update review:', err);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        Loading biometric session forensics...
      </div>
    );
  }

  const riskScore = session.riskScore || 0;
  const isElevated = riskScore >= 55;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Proctor Dashboard
        </button>

        <div className="flex items-center gap-3">
          <StatusBadge status={session.status} />
          <RiskBadge level={session.riskLevel} score={session.riskScore} />
        </div>
      </div>

      {/* Main Student & Exam Identity Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-slate-400">SESSION ID: {session.id}</div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {session.studentName}
          </h1>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>{session.studentEmail}</span>
            <span>·</span>
            <span>{session.examTitle}</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Started: {new Date(session.startedAt).toLocaleString()}
            {session.submittedAt && ` · Submitted: ${new Date(session.submittedAt).toLocaleTimeString()}`}
          </div>
        </div>

        {/* Risk Score Gauge & Principle Reminder */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-4 flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Risk Index
            </div>
            <div
              className={`text-3xl font-extrabold font-mono mt-0.5 ${
                riskScore >= 75
                  ? 'text-rose-600 dark:text-rose-400'
                  : riskScore >= 55
                  ? 'text-amber-600 dark:text-amber-400'
                  : riskScore >= 30
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {riskScore}
            </div>
            <div className="text-[10px] text-slate-400">Scale 0 - 100</div>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="max-w-[180px] text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            <strong>Core Principle:</strong>
            <span className="block text-slate-500 text-[10px] mt-0.5">
              Behavioral anomaly signal. Never automatic accusation.
            </span>
          </div>
        </div>
      </div>

      {/* Forensic Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'comparison'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Baseline Feature Comparison
        </button>

        <button
          onClick={() => setActiveTab('explanation')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'explanation'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Explainability & Attribution
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Event Timeline ({timeline.length})
        </button>
      </div>

      {/* Tab 1: Baseline Feature Comparison (Key Requirement) */}
      {activeTab === 'comparison' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Observed Session Biometrics vs Baseline Normal Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Features are compared against calibrated institutional baseline parameters. Z-scores &gt; 2.0 indicate statistically significant deviations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Biometric Signal</th>
                  <th className="py-2.5 px-3 font-semibold">Baseline Normal (μ ± σ)</th>
                  <th className="py-2.5 px-3 font-semibold">Session Observed</th>
                  <th className="py-2.5 px-3 font-semibold">Z-Score Deviation</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {featureComparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {row.featureName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {row.baselineMean} ± {row.baselineStd}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.sessionValue}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          Math.abs(row.zScore ?? 0) >= 2.5
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : Math.abs(row.zScore ?? 0) >= 1.5
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }
                      >
                        {row.zScore !== undefined
                          ? row.zScore > 0
                            ? `+${row.zScore.toFixed(1)}σ`
                            : `${row.zScore.toFixed(1)}σ`
                          : '0.0σ'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      {row.status === 'deviated' || row.status === 'ANOMALOUS' ? (
                        <span className="text-rose-700 dark:text-rose-400 text-xs font-semibold">
                          · Significant Anomaly
                        </span>
                      ) : row.status === 'moderate' || row.status === 'ELEVATED' ? (
                        <span className="text-amber-700 dark:text-amber-400 text-xs font-medium">
                          · Mild Deviation
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 text-xs">
                          · Within Baseline
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Explainability & Attribution */}
      {activeTab === 'explanation' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Isolation Forest & Scoring Attribution
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-500 font-medium">ML Model Telemetry</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model Engine:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {anomalyReport?.modelUsed || 'Isolation Forest v1.2'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anomaly Probability:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {((anomalyReport?.anomalyScore || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Classification Level:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {session.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-500 font-medium">Examiner Recommendation</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  {anomalyReport?.recommendation ||
                    'Review interaction timeline and clipboard metadata before finalizing verification.'}
                </p>
              </div>
            </div>

            {/* Contributing Factors Breakdown */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Detected Behavioral Anomalies & Point Attribution
              </div>

              {anomalyReport?.detectedPatterns && anomalyReport.detectedPatterns.length > 0 ? (
                <div className="space-y-1.5">
                  {anomalyReport.detectedPatterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>All recorded interactions adhere to normal baseline student test-taking rhythms.</span>
                </div>
              )}
            </div>

            {/* Explainable text output */}
            {anomalyReport?.explanation && (
              <div className="mt-3 p-3 rounded bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line border border-slate-200 dark:border-slate-800">
                {anomalyReport.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Event Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Session Event Timeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Millisecond-accurate log of interactions, window focus transitions, and telemetry bursts
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total Events: {timeline.length}
            </div>
          </div>

          <div className="pt-2">
            <Timeline events={timeline} />
          </div>
        </div>
      )}

      {/* Proctor Decision & Review Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Proctor Evaluation & Committee Notes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Review Status
            </label>
            <select
              value={proctorStatus}
              onChange={(e) => setProctorStatus(e.target.value as any)}
              className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="UNREVIEWED">Unreviewed</option>
              <option value="REVIEWED">Verified (Compliant)</option>
              <option value="FLAGGED">Flag for Academic Review</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Examiner Observations / Notes
            </label>
            <textarea
              rows={2}
              value={proctorNotes}
              onChange={(e) => setProctorNotes(e.target.value)}
              placeholder="Record contextual evaluation observations..."
              className="w-full p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            {saveSuccessMsg && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveSuccessMsg}
              </span>
            )}
          </div>

          <button
            onClick={handleSaveReview}
            disabled={savingReview}
            className="py-1.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingReview ? 'Saving...' : 'Save Proctor Evaluation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
