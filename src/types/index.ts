/**
 * SmartExam AI - ED-02 Anomaly Detection
 * Core Type Definitions
 */

export type UserRole = 'STUDENT' | 'EXAMINER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  createdBy: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  options: string[];
  marks: number;
  orderIndex: number;
  category?: string;
  // Note: correctAnswer is omitted on student endpoints for exam integrity
  correctAnswer?: number;
}

export type RiskLevel = 'NORMAL' | 'LOW_CONCERN' | 'REVIEW' | 'HIGH_ANOMALY';

export interface ContributingFactor {
  factor: string;
  points: number;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
  featureName: string;
  sessionValue: number | string;
  baselineValue: number | string;
}

export interface AnomalyReport {
  id: string;
  sessionId: string;
  anomalyScore: number; // 0 to 1 (from Isolation Forest)
  riskScore: number; // 0 to 100 (deterministic scale)
  riskLevel: RiskLevel;
  modelUsed: 'Isolation Forest ML v1.2' | 'Deterministic Rule Fallback' | string;
  detectedPatterns: string[];
  contributingFactors: ContributingFactor[];
  recommendation: string;
  explanation?: string;
  createdAt: string;
}

export type BehaviorEventType =
  | 'TAB_FOCUS_LOST'
  | 'TAB_FOCUS_RETURNED'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'KEYBOARD_ACTIVITY'
  | 'MOUSE_ACTIVITY'
  | 'QUESTION_CHANGED'
  | 'ANSWER_STARTED'
  | 'ANSWER_SUBMITTED'
  | 'IDLE_STARTED'
  | 'IDLE_ENDED'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS';

export interface BehaviorEvent {
  id: string;
  sessionId: string;
  eventType: BehaviorEventType;
  timestamp: number; // millisecond epoch
  relativeSeconds: number;
  metadata: {
    durationMs?: number;
    charCount?: number;
    context?: string;
    questionIndex?: number;
    questionId?: string;
    speedWpm?: number;
    keyIntervalVariance?: number;
    mouseIntensity?: number;
    idleDurationSec?: number;
    [key: string]: any;
  };
}

export interface BehavioralFeatures {
  typing_speed: number; // WPM
  typing_variance: number; // Variance in ms
  average_answer_time: number; // seconds per question
  answer_time_variance: number; // variance in sec
  focus_loss_count: number; // count
  focus_loss_duration: number; // total seconds out of focus
  copy_count: number; // count
  paste_count: number; // count
  mouse_activity_score: number; // 0-100 activity index
  mouse_idle_time: number; // seconds
  question_navigation_count: number; // total question switches
  question_revisit_count: number; // revisited questions
  back_navigation_count: number; // jumped backwards
  session_duration: number; // total seconds
}

export interface BaselineFeatureComparison {
  featureName: string;
  label: string;
  baseline: string;
  session: string;
  baselineMin: number;
  baselineMax: number;
  sessionVal: number;
  status: 'normal' | 'moderate' | 'deviated' | 'ANOMALOUS' | 'ELEVATED' | string;
  unit: string;
  zScore?: number;
  baselineMean?: number | string;
  baselineStd?: number | string;
  sessionValue?: number | string;
}

export interface ExamSession {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED';
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  progress: number; // percentage
  riskScore: number;
  riskLevel: RiskLevel;
  anomalyReport?: AnomalyReport;
  features?: BehavioralFeatures;
  proctorNotes?: string;
  proctorStatus?: 'UNREVIEWED' | 'REVIEWED' | 'FLAGGED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  details: string;
}
