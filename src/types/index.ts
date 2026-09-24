/**
 * ExamGuard AI - Core Type Definitions
 * ED-02 — AI-Based Exam Malpractice Detection
 * Detect Behavior, Not the Person
 */

export type UserRole = 'STUDENT' | 'EXAMINER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'CODING' | 'DESCRIPTIVE';

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
  explanation?: string;
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Question {
  id: string;
  examId: string;
  title?: string;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  orderIndex: number;
  category?: string;

  // Multiple Choice specific
  options?: string[];
  correctAnswer?: number; // Omitted on student endpoints before submission
  explanation?: string;

  // Coding specific
  problemStatement?: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  examples?: QuestionExample[];
  allowedLanguages?: string[];
  starterCode?: Record<string, string>;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  testCases?: TestCase[]; // Hidden test cases omitted on student endpoints

  // Descriptive specific
  rubric?: string;
  minWords?: number;
  maxWords?: number;
}

export interface ExamSettings {
  extensionRequired?: boolean;
  fullscreenRequired?: boolean;
  clipboardMonitoring?: boolean;
  typingDynamics?: boolean;
  mouseDynamics?: boolean;
  allowQuestionNavigation?: boolean;
  showResultsImmediately?: boolean;
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
  accessCode?: string; // The teacher-provided exam key, e.g. A7K9-XP2
  isPublished?: boolean;
  settings?: ExamSettings;
  questionDistribution?: {
    mcq: number;
    coding: number;
    descriptive: number;
  };
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
  riskScore: number; // 0 to 100 (explainable deterministic scale)
  riskLevel: RiskLevel;
  modelUsed: string;
  modelVersion?: string;
  featureSchemaVersion?: string;
  scoringVersion?: string;
  detectedPatterns: string[];
  contributingFactors: ContributingFactor[];
  recommendation: string;
  explanation?: string;
  createdAt: string;
}

export type BehaviorEventType =
  | 'TAB_FOCUS_LOST'
  | 'TAB_FOCUS_RETURNED'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS'
  | 'FULLSCREEN_ENTERED'
  | 'FULLSCREEN_EXITED'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'LARGE_CODE_INSERTION'
  | 'KEYBOARD_ACTIVITY'
  | 'MOUSE_ACTIVITY'
  | 'QUESTION_CHANGED'
  | 'QUESTION_REVISITED'
  | 'ANSWER_STARTED'
  | 'ANSWER_SUBMITTED'
  | 'IDLE_STARTED'
  | 'IDLE_ENDED'
  | 'CODE_EDIT_ACTIVITY'
  | 'CODE_RUN'
  | 'CODE_SUBMIT'
  | 'EXTENSION_CONNECTED'
  | 'EXTENSION_DISCONNECTED';

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
    language?: string;
    codeLength?: number;
    passedTests?: number;
    totalTests?: number;
    compileStatus?: string;
    insertedLength?: number;
    reason?: string;
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

  // Coding behavioral metrics
  code_edit_duration?: number;
  code_run_count?: number;
  code_submit_count?: number;
  large_insertion_count?: number;
  code_paste_count?: number;
  compile_failure_count?: number;
  compile_success_count?: number;
  test_execution_count?: number;
  time_between_edits?: number;
  coding_focus_loss_count?: number;
  coding_focus_loss_duration?: number;
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

export interface CodingSubmission {
  id: string;
  sessionId: string;
  questionId: string;
  language: string;
  code: string;
  passedTests: number;
  totalTests: number;
  status: 'PASSED' | 'FAILED' | 'COMPILE_ERROR' | 'TIMEOUT' | 'ERROR';
  executionTimeMs: number;
  compilerOutput?: string;
  runtimeOutput?: string;
  testResults?: {
    testCaseId?: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTimeMs?: number;
  }[];
  submittedAt: string;
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
  answers: Record<string, any>; // questionId -> value (number for MCQ, string for Descriptive, object for Coding)
  progress: number; // percentage 0 - 100
  score?: number;
  maxScore?: number;
  scorePercentage?: number;
  gradingBreakdown?: {
    questionId: string;
    questionTitle: string;
    questionType: QuestionType;
    marksAwarded: number;
    maxMarks: number;
    isCorrect?: boolean;
    feedback?: string;
  }[];
  accessCodeUsed?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  anomalyReport?: AnomalyReport;
  features?: BehavioralFeatures;
  codingSubmissions?: Record<string, CodingSubmission>;
  proctorNotes?: string;
  proctorStatus?: 'UNREVIEWED' | 'REVIEWED' | 'FLAGGED';
  handshakeToken?: string;
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
  metadata?: Record<string, any>;
}
