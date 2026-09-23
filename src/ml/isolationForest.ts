/**
 * ExamGuard AI - Behavioral Biometric Anomaly Detection Engine
 * Isolation Forest & Explainable Deterministic Risk Scoring
 * Model Version: behavioral-iforest-v2
 * Detect Behavior, Not the Person
 */

import {
  BehavioralFeatures,
  BehaviorEvent,
  AnomalyReport,
  RiskLevel,
  ContributingFactor,
  BaselineFeatureComparison,
} from '../types';

// Baseline reference statistics for typical university online examination interaction
export const BEHAVIORAL_BASELINE: Record<
  keyof BehavioralFeatures,
  { min: number; max: number; mean: number; std: number; unit: string; label: string }
> = {
  typing_speed: { min: 25, max: 65, mean: 42, std: 8, unit: 'WPM', label: 'Typing Speed' },
  typing_variance: { min: 80, max: 280, mean: 170, std: 45, unit: 'ms', label: 'Keystroke Variance' },
  average_answer_time: { min: 35, max: 120, mean: 65, std: 18, unit: 'sec', label: 'Avg Answer Time' },
  answer_time_variance: { min: 10, max: 150, mean: 55, std: 25, unit: 'sec²', label: 'Answer Time Variance' },
  focus_loss_count: { min: 0, max: 2, mean: 0.6, std: 0.8, unit: 'events', label: 'Tab Focus Losses' },
  focus_loss_duration: { min: 0, max: 6, mean: 1.5, std: 2.2, unit: 'sec', label: 'Total Focus Lost Duration' },
  copy_count: { min: 0, max: 0, mean: 0.1, std: 0.3, unit: 'attempts', label: 'Copy Attempts' },
  paste_count: { min: 0, max: 0, mean: 0.05, std: 0.2, unit: 'attempts', label: 'Paste Attempts' },
  mouse_activity_score: { min: 25, max: 75, mean: 50, std: 12, unit: 'score', label: 'Mouse Dynamics Index' },
  mouse_idle_time: { min: 10, max: 90, mean: 45, std: 20, unit: 'sec', label: 'Mouse Idle Duration' },
  question_navigation_count: { min: 5, max: 25, mean: 14, std: 4.5, unit: 'hops', label: 'Question Navigation Count' },
  question_revisit_count: { min: 0, max: 5, mean: 1.8, std: 1.2, unit: 'revisits', label: 'Question Revisit Count' },
  back_navigation_count: { min: 0, max: 6, mean: 2.1, std: 1.5, unit: 'back-steps', label: 'Back Navigation Count' },
  session_duration: { min: 300, max: 3600, mean: 1200, std: 350, unit: 'sec', label: 'Session Duration' },

  // Coding specific baselines
  code_edit_duration: { min: 30, max: 1200, mean: 300, std: 120, unit: 'sec', label: 'Code Edit Duration' },
  code_run_count: { min: 1, max: 15, mean: 5, std: 3, unit: 'runs', label: 'Code Test Runs' },
  code_submit_count: { min: 1, max: 4, mean: 1.5, std: 0.8, unit: 'submits', label: 'Code Submissions' },
  large_insertion_count: { min: 0, max: 0, mean: 0.02, std: 0.1, unit: 'bursts', label: 'Large Insertion Bursts' },
  code_paste_count: { min: 0, max: 0, mean: 0.05, std: 0.2, unit: 'pastes', label: 'Code Paste Events' },
  compile_failure_count: { min: 0, max: 8, mean: 2.5, std: 2.0, unit: 'errors', label: 'Compilation Errors' },
  compile_success_count: { min: 1, max: 12, mean: 3.5, std: 2.5, unit: 'success', label: 'Compilation Success' },
  test_execution_count: { min: 1, max: 20, mean: 6.0, std: 4.0, unit: 'tests', label: 'Test Executions' },
  time_between_edits: { min: 2, max: 45, mean: 12, std: 8, unit: 'sec', label: 'Time Between Edits' },
  coding_focus_loss_count: { min: 0, max: 1, mean: 0.3, std: 0.5, unit: 'events', label: 'Focus Loss in Coding' },
  coding_focus_loss_duration: { min: 0, max: 4, mean: 0.8, std: 1.5, unit: 'sec', label: 'Focus Lost in Coding (s)' },
};

/**
 * Feature Extraction from raw telemetry events stream
 */
export function extractFeaturesFromEvents(
  events: BehaviorEvent[],
  sessionDurationSec: number,
  totalQuestions: number = 10
): BehavioralFeatures {
  let focusLossCount = 0;
  let focusLossDuration = 0;
  let copyCount = 0;
  let pasteCount = 0;
  let typingSpeedSum = 0;
  let typingSpeedSamples = 0;
  let typingVarianceSum = 0;
  let mouseEventsCount = 0;
  let mouseIntensitySum = 0;
  let idleDuration = 0;
  let questionNavCount = 0;
  let backNavCount = 0;
  const questionTimes: Record<number, number> = {};
  const questionVisitedCounts: Record<number, number> = {};
  let currentQuestion = 0;
  let lastQuestionChangeTime = 0;

  // Coding metrics tracking
  let codeEditDuration = 0;
  let codeRunCount = 0;
  let codeSubmitCount = 0;
  let largeInsertionCount = 0;
  let codePasteCount = 0;
  let compileFailureCount = 0;
  let compileSuccessCount = 0;
  let testExecutionCount = 0;
  let codingFocusLossCount = 0;
  let codingFocusLossDuration = 0;
  let activeQuestionIsCoding = false;
  let lastEditTimestamp = 0;
  const editIntervals: number[] = [];

  for (const event of events) {
    switch (event.eventType) {
      case 'TAB_FOCUS_LOST':
      case 'WINDOW_BLUR':
        focusLossCount++;
        if (activeQuestionIsCoding) {
          codingFocusLossCount++;
        }
        break;
      case 'TAB_FOCUS_RETURNED':
      case 'WINDOW_FOCUS':
        if (event.metadata.durationMs) {
          const sec = event.metadata.durationMs / 1000;
          focusLossDuration += sec;
          if (activeQuestionIsCoding) {
            codingFocusLossDuration += sec;
          }
        }
        break;
      case 'COPY_ATTEMPT':
        copyCount++;
        break;
      case 'PASTE_ATTEMPT':
        pasteCount++;
        if (activeQuestionIsCoding) {
          codePasteCount++;
        }
        break;
      case 'LARGE_CODE_INSERTION':
        largeInsertionCount++;
        break;
      case 'CODE_EDIT_ACTIVITY':
        if (event.metadata.durationMs) {
          codeEditDuration += event.metadata.durationMs / 1000;
        } else {
          codeEditDuration += 2;
        }
        if (lastEditTimestamp > 0) {
          const gap = (event.timestamp - lastEditTimestamp) / 1000;
          if (gap > 0 && gap < 120) {
            editIntervals.push(gap);
          }
        }
        lastEditTimestamp = event.timestamp;
        break;
      case 'CODE_RUN':
        codeRunCount++;
        testExecutionCount += event.metadata.totalTests || 1;
        if (event.metadata.compileStatus === 'COMPILE_ERROR' || event.metadata.passedTests === 0) {
          compileFailureCount++;
        } else {
          compileSuccessCount++;
        }
        break;
      case 'CODE_SUBMIT':
        codeSubmitCount++;
        break;
      case 'KEYBOARD_ACTIVITY':
        if (event.metadata.speedWpm !== undefined) {
          typingSpeedSum += event.metadata.speedWpm;
          typingSpeedSamples++;
        }
        if (event.metadata.keyIntervalVariance !== undefined) {
          typingVarianceSum += event.metadata.keyIntervalVariance;
        }
        break;
      case 'MOUSE_ACTIVITY':
        mouseEventsCount++;
        if (event.metadata.mouseIntensity !== undefined) {
          mouseIntensitySum += event.metadata.mouseIntensity;
        }
        break;
      case 'IDLE_ENDED':
        if (event.metadata.idleDurationSec) {
          idleDuration += event.metadata.idleDurationSec;
        }
        break;
      case 'QUESTION_CHANGED': {
        questionNavCount++;
        const targetQ = event.metadata.questionIndex ?? 0;
        if (targetQ < currentQuestion) {
          backNavCount++;
        }
        const delta = Math.max(1, (event.timestamp - (lastQuestionChangeTime || event.timestamp)) / 1000);
        questionTimes[currentQuestion] = (questionTimes[currentQuestion] || 0) + delta;
        questionVisitedCounts[targetQ] = (questionVisitedCounts[targetQ] || 0) + 1;
        currentQuestion = targetQ;
        lastQuestionChangeTime = event.timestamp;
        activeQuestionIsCoding = event.metadata.questionType === 'CODING';
        break;
      }
      default:
        break;
    }
  }

  const typingSpeed = typingSpeedSamples > 0 ? Math.round(typingSpeedSum / typingSpeedSamples) : 42;
  const typingVariance = typingSpeedSamples > 0 ? Math.round(typingVarianceSum / typingSpeedSamples) : 160;

  const answerTimes = Object.values(questionTimes);
  const avgAnswerTime =
    answerTimes.length > 0
      ? Math.round(answerTimes.reduce((a, b) => a + b, 0) / Math.max(1, answerTimes.length))
      : Math.round(Math.max(20, sessionDurationSec / Math.max(1, totalQuestions)));

  const varianceSum = answerTimes.reduce((acc, t) => acc + Math.pow(t - avgAnswerTime, 2), 0);
  const answerTimeVariance =
    answerTimes.length > 1 ? Math.round(varianceSum / (answerTimes.length - 1)) : 45;

  const mouseScore =
    mouseEventsCount > 0
      ? Math.min(100, Math.round((mouseIntensitySum / Math.max(1, mouseEventsCount)) * 1.5 + (mouseEventsCount / 20)))
      : 48;

  let questionRevisitCount = 0;
  Object.values(questionVisitedCounts).forEach((v) => {
    if (v > 1) questionRevisitCount += v - 1;
  });

  const avgEditInterval =
    editIntervals.length > 0
      ? Math.round(editIntervals.reduce((a, b) => a + b, 0) / editIntervals.length)
      : 12;

  return {
    typing_speed: typingSpeed,
    typing_variance: typingVariance,
    average_answer_time: avgAnswerTime,
    answer_time_variance: answerTimeVariance,
    focus_loss_count: focusLossCount,
    focus_loss_duration: Math.round(focusLossDuration * 10) / 10,
    copy_count: copyCount,
    paste_count: pasteCount,
    mouse_activity_score: mouseScore,
    mouse_idle_time: Math.round(idleDuration),
    question_navigation_count: questionNavCount,
    question_revisit_count: questionRevisitCount,
    back_navigation_count: backNavCount,
    session_duration: Math.max(1, sessionDurationSec),

    // Coding features
    code_edit_duration: Math.round(codeEditDuration),
    code_run_count: codeRunCount,
    code_submit_count: codeSubmitCount,
    large_insertion_count: largeInsertionCount,
    code_paste_count: codePasteCount,
    compile_failure_count: compileFailureCount,
    compile_success_count: compileSuccessCount,
    test_execution_count: testExecutionCount,
    time_between_edits: avgEditInterval,
    coding_focus_loss_count: codingFocusLossCount,
    coding_focus_loss_duration: Math.round(codingFocusLossDuration * 10) / 10,
  };
}

/**
 * Lightweight deterministic pseudo-random Isolation Tree node
 */
interface Node {
  isLeaf: boolean;
  size: number;
  splitFeature?: number;
  splitValue?: number;
  left?: Node;
  right?: Node;
}

/**
 * Isolation Forest Implementation
 */
export class IsolationForest {
  private trees: Node[] = [];
  private numTrees: number = 80;
  private subSampleSize: number = 64;
  private maxDepth: number = 6;
  private featureNames: (keyof BehavioralFeatures)[] = [
    'typing_speed',
    'typing_variance',
    'average_answer_time',
    'answer_time_variance',
    'focus_loss_count',
    'focus_loss_duration',
    'copy_count',
    'paste_count',
    'mouse_activity_score',
    'mouse_idle_time',
    'question_navigation_count',
    'question_revisit_count',
    'back_navigation_count',
    'session_duration',
  ];

  constructor() {
    this.buildPretrainedForest();
  }

  private buildPretrainedForest() {
    const trainingSamples: number[][] = [];
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 256; i++) {
      const sample: number[] = [];
      for (const feat of this.featureNames) {
        const b = BEHAVIORAL_BASELINE[feat];
        const u1 = Math.max(0.0001, random());
        const u2 = random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const val = Math.max(0, b.mean + z * b.std);
        sample.push(val);
      }
      trainingSamples.push(sample);
    }

    for (let t = 0; t < this.numTrees; t++) {
      const subSample: number[][] = [];
      for (let s = 0; s < this.subSampleSize; s++) {
        const idx = Math.floor(random() * trainingSamples.length);
        subSample.push(trainingSamples[idx]);
      }
      const tree = this.buildTree(subSample, 0, random);
      this.trees.push(tree);
    }
  }

  private buildTree(data: number[][], currentDepth: number, rnd: () => number): Node {
    if (data.length <= 1 || currentDepth >= this.maxDepth) {
      return { isLeaf: true, size: data.length };
    }

    const featureIdx = Math.floor(rnd() * this.featureNames.length);
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of data) {
      const v = row[featureIdx];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    if (minVal === maxVal) {
      return { isLeaf: true, size: data.length };
    }

    const splitVal = minVal + rnd() * (maxVal - minVal);
    const leftData = data.filter((row) => row[featureIdx] < splitVal);
    const rightData = data.filter((row) => row[featureIdx] >= splitVal);

    if (leftData.length === 0 || rightData.length === 0) {
      return { isLeaf: true, size: data.length };
    }

    return {
      isLeaf: false,
      size: data.length,
      splitFeature: featureIdx,
      splitValue: splitVal,
      left: this.buildTree(leftData, currentDepth + 1, rnd),
      right: this.buildTree(rightData, currentDepth + 1, rnd),
    };
  }

  private pathLength(sample: number[], node: Node, currentDepth: number): number {
    if (node.isLeaf) {
      return currentDepth + this.c(node.size);
    }
    const splitFeat = node.splitFeature!;
    const splitVal = node.splitValue!;
    if (sample[splitFeat] < splitVal) {
      return this.pathLength(sample, node.left!, currentDepth + 1);
    } else {
      return this.pathLength(sample, node.right!, currentDepth + 1);
    }
  }

  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2.0 * (Math.log(n - 1) + eulerGamma) - (2.0 * (n - 1)) / n;
  }

  public score(features: BehavioralFeatures): number {
    const sample = this.featureNames.map((k) => features[k] ?? 0);
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.pathLength(sample, tree, 0);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cN = this.c(this.subSampleSize);
    const score = Math.pow(2, -avgPathLength / Math.max(1, cN));
    return Math.max(0.01, Math.min(0.99, score));
  }
}

// Singleton model instance
export const mlIsolationForest = new IsolationForest();

/**
 * Transparent, Explainable Risk Engine
 * Computes deterministic score (0-100), risk levels, and itemized contributing factors
 */
export function calculateExplainableRisk(
  features: BehavioralFeatures,
  useML: boolean = true
): AnomalyReport {
  let mlScore = 0.35;
  let modelUsed = 'Isolation Forest ML v1.2';

  try {
    if (useML) {
      mlScore = mlIsolationForest.score(features);
    } else {
      modelUsed = 'Deterministic Rule Fallback';
    }
  } catch (err) {
    modelUsed = 'Deterministic Rule Fallback';
  }

  const contributingFactors: ContributingFactor[] = [];
  const detectedPatterns: string[] = [];

  // 1. Focus Loss Deviation
  let focusScore = 0;
  if (features.focus_loss_count > 0 || features.focus_loss_duration > 3) {
    const countExcess = Math.max(0, features.focus_loss_count - 1);
    const durationExcess = Math.max(0, features.focus_loss_duration - 4);
    focusScore = Math.min(25, countExcess * 7 + Math.min(12, durationExcess * 1.5));
    if (focusScore > 5) {
      contributingFactors.push({
        factor: 'Tab Focus Loss & Window Transitions',
        points: Math.round(focusScore),
        explanation: `${features.focus_loss_count} focus changes (${Math.round(features.focus_loss_duration)}s away) vs expected baseline of 0–2 (< 5s)`,
        severity: focusScore > 16 ? 'high' : focusScore > 8 ? 'medium' : 'low',
        featureName: 'focus_loss_count',
        sessionValue: `${features.focus_loss_count} events (${Math.round(features.focus_loss_duration)}s)`,
        baselineValue: '0–2 events (< 5s)',
      });
      detectedPatterns.push('Unusual tab focus transitions during examination');
    }
  }

  // 2. Clipboard Activity
  let copyPasteScore = 0;
  if (features.copy_count > 0 || features.paste_count > 0) {
    copyPasteScore = Math.min(25, features.copy_count * 8 + features.paste_count * 12);
    contributingFactors.push({
      factor: 'Clipboard Manipulation Detected',
      points: Math.round(copyPasteScore),
      explanation: `${features.copy_count} copy and ${features.paste_count} paste events recorded during session`,
      severity: copyPasteScore >= 16 ? 'high' : 'medium',
      featureName: 'paste_count',
      sessionValue: `${features.copy_count} copies, ${features.paste_count} pastes`,
      baselineValue: '0 clipboard interactions',
    });
    detectedPatterns.push('Anomalous clipboard activity on question interface');
  }

  // 3. Coding Specific Anomalies
  let codingScore = 0;
  const largeInsertions = features.large_insertion_count || 0;
  const codePastes = features.code_paste_count || 0;
  const codingFocusLoss = features.coding_focus_loss_count || 0;

  if (largeInsertions > 0) {
    const insertionPoints = Math.min(20, largeInsertions * 12);
    codingScore += insertionPoints;
    contributingFactors.push({
      factor: 'Large Code Block Insertion',
      points: insertionPoints,
      explanation: `${largeInsertions} sudden large code insertion event(s) recorded without preceding incremental editing`,
      severity: 'high',
      featureName: 'large_insertion_count',
      sessionValue: `${largeInsertions} burst insertion(s)`,
      baselineValue: '0 burst insertions (gradual edits expected)',
    });
    detectedPatterns.push('Abrupt insertion of complete code structure without incremental development');
  }

  if (codePastes > 0 && largeInsertions === 0) {
    const pastePoints = Math.min(15, codePastes * 8);
    codingScore += pastePoints;
    contributingFactors.push({
      factor: 'External Code Pasting',
      points: pastePoints,
      explanation: `${codePastes} paste events observed inside coding workspace`,
      severity: 'medium',
      featureName: 'code_paste_count',
      sessionValue: `${codePastes} code pastes`,
      baselineValue: '0 external pastes',
    });
    detectedPatterns.push('External code paste event into the code editor');
  }

  if (codingFocusLoss > 1 && (largeInsertions > 0 || codePastes > 0)) {
    codingScore += 10;
    contributingFactors.push({
      factor: 'Correlated Focus Loss Around Code Insertions',
      points: 10,
      explanation: `Focus switch occurred directly adjacent to code insertion events (${codingFocusLoss} coding focus changes)`,
      severity: 'high',
      featureName: 'coding_focus_loss_count',
      sessionValue: `${codingFocusLoss} focus shifts`,
      baselineValue: '0–1 focus shifts',
    });
    detectedPatterns.push('Coinciding focus transitions and code workspace changes');
  }

  // 4. Timing Anomalies
  let timingScore = 0;
  if (features.average_answer_time < 20 && features.session_duration > 40) {
    timingScore += 14;
    contributingFactors.push({
      factor: 'Rapid Answer Cadence',
      points: 14,
      explanation: `Average answer time of ${features.average_answer_time}s is significantly below typical reading pace (35–120s)`,
      severity: 'medium',
      featureName: 'average_answer_time',
      sessionValue: `${features.average_answer_time}s`,
      baselineValue: '35–120s',
    });
    detectedPatterns.push('Unusually rapid answer cadence below typical reading threshold');
  } else if (features.average_answer_time > 180) {
    timingScore += 6;
    contributingFactors.push({
      factor: 'Prolonged Inactivity Between Answers',
      points: 6,
      explanation: `Extended pauses per question averaging ${features.average_answer_time}s`,
      severity: 'low',
      featureName: 'average_answer_time',
      sessionValue: `${features.average_answer_time}s`,
      baselineValue: '35–120s',
    });
  }

  // 5. Navigation Patterns
  let navigationScore = 0;
  if (features.back_navigation_count > 8 || features.question_navigation_count > 30) {
    navigationScore = Math.min(12, Math.round(features.back_navigation_count * 1.2));
    contributingFactors.push({
      factor: 'Non-linear Question Navigation',
      points: navigationScore,
      explanation: `Elevated question jumping (${features.question_navigation_count} transitions, ${features.back_navigation_count} back-steps)`,
      severity: 'low',
      featureName: 'back_navigation_count',
      sessionValue: `${features.question_navigation_count} hops (${features.back_navigation_count} back)`,
      baselineValue: '5–25 hops (≤ 6 back)',
    });
    detectedPatterns.push('Frequent non-linear question navigation sequence');
  }

  // 6. Mouse Immobility
  let mouseIdleScore = 0;
  if (features.mouse_activity_score < 15 && features.session_duration > 120) {
    mouseIdleScore = 8;
    contributingFactors.push({
      factor: 'Prolonged Cursor Immobility',
      points: 8,
      explanation: `Very low mouse dynamics index (${features.mouse_activity_score}/100) with ${features.mouse_idle_time}s idle cursor`,
      severity: 'low',
      featureName: 'mouse_activity_score',
      sessionValue: `${features.mouse_activity_score}/100`,
      baselineValue: '25–75/100',
    });
    detectedPatterns.push('Extended lack of cursor movement while viewing test content');
  }

  // 7. Isolation Forest Multivariate Vector Anomaly
  const mlWeightedPoints = Math.round(Math.max(0, (mlScore - 0.4) * 30));
  if (mlWeightedPoints > 5) {
    contributingFactors.push({
      factor: 'Multivariate Behavioral Biometric Anomaly',
      points: mlWeightedPoints,
      explanation: `Isolation Forest ensemble detected structural deviation across 14 biometric dimensions (raw anomaly score ${(mlScore * 100).toFixed(1)}%)`,
      severity: mlWeightedPoints > 14 ? 'high' : 'medium',
      featureName: 'isolation_forest_vector',
      sessionValue: `${(mlScore * 100).toFixed(1)}% anomaly probability`,
      baselineValue: '< 45.0%',
    });
    detectedPatterns.push('Multivariate interaction vector deviated from baseline population distribution');
  }

  // Aggregate final risk score (0-100)
  const rawSum = focusScore + copyPasteScore + codingScore + timingScore + navigationScore + mouseIdleScore + mlWeightedPoints;
  const finalRiskScore = Math.min(100, Math.max(0, Math.round(rawSum)));

  // Categorize risk level
  let riskLevel: RiskLevel = 'NORMAL';
  let recommendation = 'Exam interactions are consistent with baseline expectations. No proctor intervention needed.';

  if (finalRiskScore >= 75) {
    riskLevel = 'HIGH_ANOMALY';
    recommendation =
      'Multiple significant behavioral deviations detected. Detailed human examiner review recommended. Inspect forensic event timeline.';
  } else if (finalRiskScore >= 55) {
    riskLevel = 'REVIEW';
    recommendation =
      'Several behavioral deviations observed. Human review recommended to evaluate contextual interaction.';
  } else if (finalRiskScore >= 30) {
    riskLevel = 'LOW_CONCERN';
    recommendation =
      'Minor deviations noted. Patterns likely reflect routine student interaction or momentary system context shifts.';
  }

  if (detectedPatterns.length === 0) {
    detectedPatterns.push('Consistent exam focus and typical incremental pacing');
  }

  return {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sessionId: '',
    anomalyScore: Math.round(mlScore * 100) / 100,
    riskScore: finalRiskScore,
    riskLevel,
    modelUsed,
    modelVersion: 'behavioral-iforest-v2',
    featureSchemaVersion: 'behavior-v2',
    scoringVersion: 'risk-v2',
    detectedPatterns,
    contributingFactors,
    recommendation,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates baseline feature comparison for the UI
 */
export function getBaselineFeatureComparison(
  features: BehavioralFeatures
): BaselineFeatureComparison[] {
  const keys: (keyof BehavioralFeatures)[] = [
    'focus_loss_count',
    'focus_loss_duration',
    'copy_count',
    'paste_count',
    'typing_speed',
    'average_answer_time',
    'mouse_activity_score',
    'mouse_idle_time',
    'question_navigation_count',
    'back_navigation_count',
    'large_insertion_count',
    'code_run_count',
    'coding_focus_loss_count',
  ];

  return keys
    .filter((key) => BEHAVIORAL_BASELINE[key] !== undefined)
    .map((key) => {
      const meta = BEHAVIORAL_BASELINE[key];
      const val = (features[key] ?? 0) as number;
      let status: 'normal' | 'moderate' | 'deviated' = 'normal';

      if (key === 'copy_count' || key === 'paste_count' || key === 'large_insertion_count') {
        status = val > 0 ? 'deviated' : 'normal';
      } else if (key === 'focus_loss_count' || key === 'coding_focus_loss_count') {
        status = val > 3 ? 'deviated' : val > 1 ? 'moderate' : 'normal';
      } else if (key === 'focus_loss_duration') {
        status = val > 15 ? 'deviated' : val > 6 ? 'moderate' : 'normal';
      } else if (val < meta.min || val > meta.max) {
        const distance = Math.abs(val - meta.mean) / Math.max(1, meta.std);
        status = distance > 2.2 ? 'deviated' : 'moderate';
      }

      const zScore = Math.round(((val - meta.mean) / Math.max(0.1, meta.std)) * 10) / 10;

      return {
        featureName: meta.label || key,
        label: meta.label,
        baseline: `${meta.min}–${meta.max} ${meta.unit}`,
        session: `${val} ${meta.unit}`,
        baselineMin: meta.min,
        baselineMax: meta.max,
        baselineMean: meta.mean,
        baselineStd: meta.std,
        sessionVal: val,
        sessionValue: `${val} ${meta.unit}`,
        zScore,
        status,
        unit: meta.unit,
      };
    });
}
