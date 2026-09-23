/**
 * SmartExam AI - Behavioral Biometric Anomaly Detection Engine
 * Isolation Forest & Explainable Deterministic Risk Scoring
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

  for (const event of events) {
    switch (event.eventType) {
      case 'TAB_FOCUS_LOST':
      case 'WINDOW_BLUR':
        focusLossCount++;
        break;
      case 'TAB_FOCUS_RETURNED':
      case 'WINDOW_FOCUS':
        if (event.metadata.durationMs) {
          focusLossDuration += event.metadata.durationMs / 1000;
        }
        break;
      case 'COPY_ATTEMPT':
        copyCount++;
        break;
      case 'PASTE_ATTEMPT':
        pasteCount++;
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
    // Generate synthetic normal training sample vectors based on baseline distributions
    const trainingSamples: number[][] = [];
    // Seeded generator for 100% deterministic reproducibility
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 256; i++) {
      const sample: number[] = [];
      for (const feat of this.featureNames) {
        const b = BEHAVIORAL_BASELINE[feat];
        // Gaussian approximation via Box-Muller
        const u1 = Math.max(0.0001, random());
        const u2 = random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const val = Math.max(0, b.mean + z * b.std);
        sample.push(val);
      }
      trainingSamples.push(sample);
    }

    // Build trees
    for (let t = 0; t < this.numTrees; t++) {
      // Draw sub-sample
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

  // Harmonic number approximation constant c(n)
  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2.0 * (Math.log(n - 1) + eulerGamma) - (2.0 * (n - 1)) / n;
  }

  /**
   * Score sample vector -> returns anomaly score between 0.0 and 1.0
   * s(x, n) = 2 ^ (- E(h(x)) / c(n))
   */
  public score(features: BehavioralFeatures): number {
    const sample = this.featureNames.map((k) => features[k]);
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
  let modelUsed: 'Isolation Forest ML v1.2' | 'Deterministic Rule Fallback' = 'Isolation Forest ML v1.2';

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

  let focusScore = 0;
  if (features.focus_loss_count > 0 || features.focus_loss_duration > 3) {
    const countExcess = Math.max(0, features.focus_loss_count - 1);
    const durationExcess = Math.max(0, features.focus_loss_duration - 4);
    focusScore = Math.min(30, countExcess * 7 + Math.min(15, durationExcess * 1.5));
    if (focusScore > 6) {
      contributingFactors.push({
        factor: 'Tab Focus Loss & Window Blur',
        points: Math.round(focusScore),
        explanation: `${features.focus_loss_count} focus changes (${Math.round(features.focus_loss_duration)}s away) vs expected baseline of 0–2 (< 5s)`,
        severity: focusScore > 18 ? 'high' : focusScore > 10 ? 'medium' : 'low',
        featureName: 'focus_loss_count',
        sessionValue: `${features.focus_loss_count} events (${Math.round(features.focus_loss_duration)}s)`,
        baselineValue: '0–2 events (< 5s)',
      });
      detectedPatterns.push('Unusual tab focus deviation during exam session');
    }
  }

  let copyPasteScore = 0;
  if (features.copy_count > 0 || features.paste_count > 0) {
    copyPasteScore = Math.min(30, features.copy_count * 10 + features.paste_count * 15);
    contributingFactors.push({
      factor: 'Clipboard Manipulation Detected',
      points: Math.round(copyPasteScore),
      explanation: `${features.copy_count} copy and ${features.paste_count} paste events recorded during session`,
      severity: copyPasteScore >= 20 ? 'high' : 'medium',
      featureName: 'paste_count',
      sessionValue: `${features.copy_count} copies, ${features.paste_count} pastes`,
      baselineValue: '0 clipboard interactions',
    });
    detectedPatterns.push('Anomalous clipboard activity on question interface');
  }

  let timingScore = 0;
  if (features.average_answer_time < 20 && features.session_duration > 40) {
    // Unusually rapid answer time (reading complex question usually takes > 30s)
    timingScore += 16;
    contributingFactors.push({
      factor: 'Rapid Answer Cadence',
      points: 16,
      explanation: `Average answer time of ${features.average_answer_time}s is significantly below typical reading pace (35–120s)`,
      severity: 'medium',
      featureName: 'average_answer_time',
      sessionValue: `${features.average_answer_time}s`,
      baselineValue: '35–120s',
    });
    detectedPatterns.push('Statistically improbable answer pace (sub-reading threshold)');
  } else if (features.average_answer_time > 180) {
    timingScore += 8;
    contributingFactors.push({
      factor: 'Prolonged Inactivity Between Answers',
      points: 8,
      explanation: `Extended pauses per question averaging ${features.average_answer_time}s`,
      severity: 'low',
      featureName: 'average_answer_time',
      sessionValue: `${features.average_answer_time}s`,
      baselineValue: '35–120s',
    });
  }

  let navigationScore = 0;
  if (features.back_navigation_count > 8 || features.question_navigation_count > 30) {
    navigationScore = Math.min(15, Math.round(features.back_navigation_count * 1.4));
    contributingFactors.push({
      factor: 'Erratic Question Navigation',
      points: navigationScore,
      explanation: `Elevated question jumping (${features.question_navigation_count} transitions, ${features.back_navigation_count} back-steps)`,
      severity: 'medium',
      featureName: 'back_navigation_count',
      sessionValue: `${features.question_navigation_count} hops (${features.back_navigation_count} back)`,
      baselineValue: '5–25 hops (≤ 6 back)',
    });
    detectedPatterns.push('Non-linear or scanning question navigation pattern');
  }

  let mouseIdleScore = 0;
  if (features.mouse_activity_score < 15 && features.session_duration > 120) {
    mouseIdleScore = 10;
    contributingFactors.push({
      factor: 'Prolonged Cursor Immobility',
      points: 10,
      explanation: `Very low mouse dynamics index (${features.mouse_activity_score}/100) with ${features.mouse_idle_time}s idle cursor`,
      severity: 'low',
      featureName: 'mouse_activity_score',
      sessionValue: `${features.mouse_activity_score}/100`,
      baselineValue: '25–75/100',
    });
    detectedPatterns.push('Atypical lack of cursor movement while viewing test content');
  }

  // Weight Isolation Forest anomaly probability
  // mlScore in [0, 1]. Baseline normal is ~0.3 - 0.45. Above 0.65 is anomalous.
  const mlWeightedPoints = Math.round(Math.max(0, (mlScore - 0.4) * 35));
  if (mlWeightedPoints > 6) {
    contributingFactors.push({
      factor: 'Multivariate Behavioral Biometric Vector Anomaly',
      points: mlWeightedPoints,
      explanation: `Isolation Forest ensemble detected structural deviation across 14 biometric dimensions (raw anomaly score ${(mlScore * 100).toFixed(1)}%)`,
      severity: mlWeightedPoints > 15 ? 'high' : 'medium',
      featureName: 'isolation_forest_vector',
      sessionValue: `${(mlScore * 100).toFixed(1)}% anomaly probability`,
      baselineValue: '< 45.0%',
    });
    detectedPatterns.push('Multivariate behavioral vector deviated from trained baseline');
  }

  // Aggregate final risk score (clamped to 0 - 100)
  const rawSum = focusScore + copyPasteScore + timingScore + navigationScore + mouseIdleScore + mlWeightedPoints;
  const finalRiskScore = Math.min(100, Math.max(0, Math.round(rawSum)));

  // Categorize
  let riskLevel: RiskLevel = 'NORMAL';
  let recommendation = 'Exam interactions are consistent with baseline expectations. No action required.';

  if (finalRiskScore >= 75) {
    riskLevel = 'HIGH_ANOMALY';
    recommendation =
      'High behavioral anomaly detected. Human examiner review recommended. Inspect timeline events and focus loss logs.';
  } else if (finalRiskScore >= 55) {
    riskLevel = 'REVIEW';
    recommendation =
      'Moderate behavioral deviation detected. Secondary examiner check recommended to verify navigation and interaction context.';
  } else if (finalRiskScore >= 30) {
    riskLevel = 'LOW_CONCERN';
    recommendation =
      'Minor deviations noted. Patterns likely reflect routine student interaction or momentary system context shifts.';
  }

  if (detectedPatterns.length === 0) {
    detectedPatterns.push('Normal steady pacing and consistent exam focus');
  }

  return {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sessionId: '',
    anomalyScore: Math.round(mlScore * 100) / 100,
    riskScore: finalRiskScore,
    riskLevel,
    modelUsed,
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
  ];

  return keys.map((key) => {
    const meta = BEHAVIORAL_BASELINE[key];
    const val = features[key];
    let status: 'normal' | 'moderate' | 'deviated' = 'normal';

    if (key === 'copy_count' || key === 'paste_count') {
      status = val > 0 ? 'deviated' : 'normal';
    } else if (key === 'focus_loss_count') {
      status = val > 4 ? 'deviated' : val > 2 ? 'moderate' : 'normal';
    } else if (key === 'focus_loss_duration') {
      status = val > 15 ? 'deviated' : val > 6 ? 'moderate' : 'normal';
    } else if (val < meta.min || val > meta.max) {
      const distance = Math.abs(val - meta.mean) / Math.max(1, meta.std);
      status = distance > 2.5 ? 'deviated' : 'moderate';
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
