/**
 * ExamGuard AI - Session Forensics & Proctor Inspector
 * Institutional Examination Platform & Behavioral Intelligence
 * Detect Behavior, Not the Person
 */

import React, { useState, useEffect } from 'react';
import { ExamSession, BehaviorEvent, AnomalyReport, BaselineFeatureComparison } from '../../types';
import { api } from '../../services/api';
import { RiskBadge, StatusBadge } from '../../components/common/Badge';
import { Timeline } from '../../components/common/Timeline';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileText,
  Activity,
  Layers,
  Save,
  Code2,
  Terminal,
  Cpu,
  Shield,
  Award,
  Key,
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
  const [activeTab, setActiveTab] = useState<'results' | 'comparison' | 'explanation' | 'coding' | 'timeline'>('results');

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
      setSaveSuccessMsg('Proctor evaluation saved successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update review:', err);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingScreen
          mode="inline"
          title="Loading Behavioral Forensics"
          subtitle="Decrypting session audit logs and calculating anomaly vectors..."
          phases={[
            'Retrieving cryptographic session event stream...',
            'Comparing candidate keystroke dynamics against cohort baseline...',
            'Aggregating copy-paste, focus loss, and window switches...',
            'Forensic timeline ready • Displaying telemetry inspector',
          ]}
        />
      </div>
    );
  }

  const riskScore = session.riskScore || 0;
  const features = session.features;

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
          {(session.terminatedReason === 'TAB_SWITCH_LIMIT_EXCEEDED' || session.terminatedReason === 'TAB_SWITCH_DETECTED') && (
            <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-300 dark:border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              Tab Switch Limit Exceeded
            </span>
          )}
          <StatusBadge status={session.status} />
          <RiskBadge level={session.riskLevel} score={session.riskScore} />
        </div>
      </div>

      {(session.terminatedReason === 'TAB_SWITCH_LIMIT_EXCEEDED' || session.terminatedReason === 'TAB_SWITCH_DETECTED') && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Automatic Termination Event: Tab Switch Limit Exceeded (3rd switch detected)</span>
          </div>
          <p className="text-rose-700 dark:text-rose-400 text-[11px] leading-relaxed">
            The candidate exceeded the maximum allowed 2 tab switches during the examination. In accordance with institutional integrity protocol, the examination was instantly terminated and submitted with current responses.
          </p>
        </div>
      )}

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

          <div className="max-w-[190px] text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            <strong>Core Principle:</strong>
            <span className="block text-slate-500 text-[10px] mt-0.5">
              Behavioral anomaly signal. Never automatic accusation.
            </span>
          </div>
        </div>
      </div>

      {/* Forensic Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'results'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Academic Results & Scoring
        </button>

        <button
          onClick={() => setActiveTab('explanation')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'explanation'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Behavioral Risk & Attribution
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'comparison'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Baseline Biometrics
        </button>

        <button
          onClick={() => setActiveTab('coding')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'coding'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Coding Forensics & Submissions
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Event Timeline ({timeline.length})
        </button>
      </div>

      {/* Tab 0: Academic Results & Question Scoring */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Summary Score Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Official Examination Evaluation
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Candidate Score Breakdown & Paper Review
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                <span>Access Key Used: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{session.accessCodeUsed || 'A7K9-XP2'}</strong></span>
                <span>•</span>
                <span>Time Taken: <strong className="font-mono">{Math.round((session.durationSeconds || 0) / 60)} minutes</strong></span>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-center shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold block">
                Total Score
              </span>
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {session.score !== undefined ? session.score : 0}
                <span className="text-base text-slate-400 font-normal"> / {session.maxScore || 50}</span>
              </div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 font-mono">
                {session.scorePercentage ?? (session.maxScore ? Math.round(((session.score || 0) / session.maxScore) * 100) : 0)}%
              </span>
            </div>
          </div>

          {/* Question-by-Question Grading */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Question Answers & Rubric Assessment
            </h3>

            {session.gradingBreakdown && session.gradingBreakdown.length > 0 ? (
              <div className="space-y-3">
                {session.gradingBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Question {idx + 1}: {item.questionTitle}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-mono">
                          {item.questionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          item.marksAwarded === item.maxMarks
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : item.marksAwarded > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {item.marksAwarded} / {item.maxMarks} Marks
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {item.feedback || (item.isCorrect ? 'Correct submission' : 'Partial / uncredited response')}
                    </p>

                    {/* Candidate's submitted answer details */}
                    {session.answers && session.answers[item.questionId] !== undefined && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-400 font-semibold block mb-1">Candidate's Response:</span>
                        {typeof session.answers[item.questionId] === 'object' && session.answers[item.questionId].code ? (
                          <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded overflow-x-auto">
                            {session.answers[item.questionId].code}
                          </pre>
                        ) : typeof session.answers[item.questionId] === 'string' ? (
                          <p className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {session.answers[item.questionId]}
                          </p>
                        ) : (
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            Selected Option Index: <strong>{String(session.answers[item.questionId])}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(session.answers || {}).map(([qId, ans]: [string, any], idx) => (
                  <div key={qId} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Question {idx + 1} ({qId})</span>
                    <div className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {typeof ans === 'object' ? JSON.stringify(ans) : String(ans)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Baseline Feature Comparison */}
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
                  <th className="py-2.5 px-3 font-semibold">Baseline Normal</th>
                  <th className="py-2.5 px-3 font-semibold">Session Observed</th>
                  <th className="py-2.5 px-3 font-semibold">Z-Score Deviation</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {featureComparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {row.label || row.featureName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {row.baseline}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.sessionValue || `${row.sessionVal} ${row.unit}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          Math.abs(row.zScore ?? 0) >= 2.2
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : Math.abs(row.zScore ?? 0) >= 1.4
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Isolation Forest ML & Scoring Attribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explainable biometric point breakdown and decision-support guidance
                </p>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {anomalyReport?.modelVersion || 'behavioral-iforest-v2'}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {anomalyReport?.scoringVersion || 'risk-v2'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-slate-500 font-medium">ML Model Telemetry</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model Engine:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {anomalyReport?.modelUsed || 'Isolation Forest ML v1.2'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Raw Anomaly Score:</span>
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
                <div className="text-slate-500 font-medium">Human Examiner Recommendation</div>
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

              {anomalyReport?.contributingFactors && anomalyReport.contributingFactors.length > 0 ? (
                <div className="space-y-2">
                  {anomalyReport.contributingFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 ${
                              factor.severity === 'high'
                                ? 'text-rose-500'
                                : factor.severity === 'medium'
                                ? 'text-amber-500'
                                : 'text-blue-500'
                            }`}
                          />
                          {factor.factor}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          +{factor.points} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {factor.explanation}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
                        <span>Observed: {factor.sessionValue}</span>
                        <span>·</span>
                        <span>Expected Baseline: {factor.baselineValue}</span>
                      </div>
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
          </div>
        </div>
      )}

      {/* Tab 3: Coding Forensics */}
      {activeTab === 'coding' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Coding Workspace Telemetry & Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Code editor interaction rhythm, test runs, compile success rates, and sudden code insertion bursts
            </p>
          </div>

          {/* Coding Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px]">Code Edit Duration</div>
              <div className="font-mono text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                {features?.code_edit_duration ?? 0}s
              </div>
            </div>

            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px]">Code Test Runs</div>
              <div className="font-mono text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                {features?.code_run_count ?? 0} runs
              </div>
            </div>

            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px]">Large Insertions</div>
              <div
                className={`font-mono text-base font-semibold mt-0.5 ${
                  (features?.large_insertion_count ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {features?.large_insertion_count ?? 0} bursts
              </div>
            </div>

            <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-slate-400 text-[11px]">Code Pastes</div>
              <div
                className={`font-mono text-base font-semibold mt-0.5 ${
                  (features?.code_paste_count ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                }`}
              >
                {features?.code_paste_count ?? 0} pastes
              </div>
            </div>
          </div>

          {/* Submitted Code View */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Student Code Responses
            </h3>

            {Object.entries(session.answers || {}).filter(([_, val]) => typeof val === 'object' && val.code).length > 0 ? (
              Object.entries(session.answers || {})
                .filter(([_, val]) => typeof val === 'object' && val.code)
                .map(([qId, val]: [string, any]) => (
                  <div key={qId} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">Question {qId}</span>
                        <span className="font-mono text-[11px] uppercase bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {val.language}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        {val.passedTests}/{val.totalTests} Tests Passed
                      </span>
                    </div>

                    <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
                      {val.code}
                    </pre>
                  </div>
                ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No coding question responses recorded in this session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Event Timeline */}
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
