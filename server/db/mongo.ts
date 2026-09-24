/**
 * ExamGuard AI - MongoDB Persistence Engine
 * Supports real MongoDB Atlas via MongoClient with resilient in-memory collection fallback
 * Collections: users, exams, questions, sessions, behavior_events, coding_submissions, audit_logs
 */

import { MongoClient, Db, Collection } from 'mongodb';
import bcrypt from 'bcryptjs';
import {
  User,
  Exam,
  Question,
  ExamSession,
  BehaviorEvent,
  CodingSubmission,
  AuditLog,
  AnomalyReport,
} from '../../src/types';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DATABASE || 'examguard_db';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnectedToAtlas = false;

// -------------------------------------------------------------
// In-Memory Database Fallback Store (Used when MONGODB_URI is offline/not set)
// -------------------------------------------------------------
function matchDoc(item: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  if (query.$or && Array.isArray(query.$or)) {
    const matched = query.$or.some((sub: any) => matchDoc(item, sub));
    if (!matched) return false;
  }
  for (const key of Object.keys(query)) {
    if (key === '$or') continue;
    const expected = query[key];
    const actual = item[key];
    if (expected !== undefined) {
      if (typeof expected === 'object' && expected !== null) {
        if (expected.$regex && !new RegExp(expected.$regex, expected.$options || '').test(String(actual))) {
          return false;
        }
        if (expected.$in && Array.isArray(expected.$in) && !expected.$in.includes(actual)) {
          return false;
        }
      } else if (actual !== expected) {
        return false;
      }
    }
  }
  return true;
}

class InMemoryCollection<T extends { id?: string; _id?: any }> {
  private items = new Map<string, T>();

  constructor(public name: string) {}

  async find(query: any = {}): Promise<{ toArray: () => Promise<T[]> }> {
    const results: T[] = [];
    for (const item of this.items.values()) {
      if (matchDoc(item, query)) {
        results.push({ ...item });
      }
    }
    return {
      toArray: async () => results,
    };
  }

  async findOne(query: any): Promise<T | null> {
    for (const item of this.items.values()) {
      if (matchDoc(item, query)) {
        return { ...item };
      }
    }
    return null;
  }

  async insertOne(doc: T): Promise<{ insertedId: string }> {
    const id = doc.id || doc._id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cloned = { ...doc, id, _id: id };
    this.items.set(id, cloned);
    return { insertedId: id };
  }

  async insertMany(docs: T[]): Promise<{ insertedCount: number }> {
    for (const doc of docs) {
      await this.insertOne(doc);
    }
    return { insertedCount: docs.length };
  }

  async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
    const existing = await this.findOne(query);
    if (!existing) return { modifiedCount: 0 };
    const id = existing.id || existing._id;
    const patch = update.$set ? update.$set : update;
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return { modifiedCount: 1 };
  }

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    const existing = await this.findOne(query);
    if (!existing) return { deletedCount: 0 };
    const id = existing.id || existing._id;
    this.items.delete(id);
    return { deletedCount: 1 };
  }

  async deleteMany(query: any): Promise<{ deletedCount: number }> {
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((item as any)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        this.items.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  }

  async countDocuments(query: any = {}): Promise<number> {
    const res = await this.find(query);
    const arr = await res.toArray();
    return arr.length;
  }

  async createIndex(_spec: any, _options?: any): Promise<string> {
    return 'index_created';
  }
}

// In-Memory collections table
const inMemoryStore = {
  users: new InMemoryCollection<User & { passwordHash?: string }>('users'),
  exams: new InMemoryCollection<Exam>('exams'),
  questions: new InMemoryCollection<Question>('questions'),
  sessions: new InMemoryCollection<ExamSession>('sessions'),
  behavior_events: new InMemoryCollection<BehaviorEvent>('behavior_events'),
  coding_submissions: new InMemoryCollection<CodingSubmission>('coding_submissions'),
  audit_logs: new InMemoryCollection<AuditLog>('audit_logs'),
};

// -------------------------------------------------------------
// Initialize MongoDB Connection & Collections
// -------------------------------------------------------------
export async function initMongo(): Promise<boolean> {
  if (MONGODB_URI) {
    try {
      console.log(`[MongoDB] Connecting to cluster at ${MONGODB_URI.split('@')[1] || 'configured URI'}...`);
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 4000,
      });
      await client.connect();
      dbInstance = client.db(DB_NAME);
      isConnectedToAtlas = true;
      console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

      // Ensure indexes
      await dbInstance.collection('users').createIndex({ email: 1 }, { unique: true });
      await dbInstance.collection('sessions').createIndex({ examId: 1, studentId: 1 });
      await dbInstance.collection('sessions').createIndex({ status: 1 });
      await dbInstance.collection('behavior_events').createIndex({ sessionId: 1, timestamp: 1 });
      await dbInstance.collection('coding_submissions').createIndex({ sessionId: 1, questionId: 1 });
      await dbInstance.collection('audit_logs').createIndex({ timestamp: -1 });

      // Seed if empty
      const userCount = await dbInstance.collection('users').countDocuments();
      if (userCount === 0) {
        await seedDatabase();
      }
      return true;
    } catch (err: any) {
      console.warn(`[MongoDB] Atlas connection failed (${err.message}). Using resilient local in-memory store.`);
      isConnectedToAtlas = false;
      client = null;
      dbInstance = null;
    }
  } else {
    console.log('[MongoDB] No MONGODB_URI provided. Initializing persistent local in-memory store.');
  }

  // Seed in-memory store
  await seedDatabase();
  return false;
}

export function getDbCollection<T extends { id?: string; _id?: any }>(collectionName: keyof typeof inMemoryStore): any {
  if (isConnectedToAtlas && dbInstance) {
    return dbInstance.collection(collectionName);
  }
  return inMemoryStore[collectionName];
}

// Helper accessors
export const db = {
  users: () => getDbCollection<User & { passwordHash?: string }>('users'),
  exams: () => getDbCollection<Exam>('exams'),
  questions: () => getDbCollection<Question>('questions'),
  sessions: () => getDbCollection<ExamSession>('sessions'),
  behavior_events: () => getDbCollection<BehaviorEvent>('behavior_events'),
  coding_submissions: () => getDbCollection<CodingSubmission>('coding_submissions'),
  audit_logs: () => getDbCollection<AuditLog>('audit_logs'),
};

export async function checkDbHealth(): Promise<{
  status: string;
  type: 'MongoDB Atlas' | 'In-Memory Resilient Store';
  connected: boolean;
  database: string;
  counts: Record<string, number>;
}> {
  const usersCount = await db.users().countDocuments();
  const examsCount = await db.exams().countDocuments();
  const sessionsCount = await db.sessions().countDocuments();
  const eventsCount = await db.behavior_events().countDocuments();

  return {
    status: 'healthy',
    type: isConnectedToAtlas ? 'MongoDB Atlas' : 'In-Memory Resilient Store',
    connected: true,
    database: DB_NAME,
    counts: {
      users: usersCount,
      exams: examsCount,
      sessions: sessionsCount,
      behaviorEvents: eventsCount,
    },
  };
}

// -------------------------------------------------------------
// Deterministic Seed Data
// -------------------------------------------------------------
async function seedDatabase() {
  const defaultHash = await bcrypt.hash('password123', 10);

  // Seed Users
  const seedUsers: (User & { passwordHash: string })[] = [
    {
      id: 'usr-examiner-1',
      name: 'Dr. Sarah Jenkins',
      email: 'examiner@university.edu',
      role: 'EXAMINER',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-examiner-2',
      name: 'Elena Rostova',
      email: 'elena.examiner@smartexam.edu',
      role: 'EXAMINER',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-student-1',
      name: 'Alex Rivera',
      email: 'alex.student@smartexam.edu',
      role: 'STUDENT',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-student-alt',
      name: 'Alex Rivera',
      email: 'alex.rivera@student.edu',
      role: 'STUDENT',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-student-2',
      name: 'Maya Chen',
      email: 'maya.chen@student.edu',
      role: 'STUDENT',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-student-3',
      name: 'Jordan Taylor',
      email: 'jordan.taylor@student.edu',
      role: 'STUDENT',
      passwordHash: defaultHash,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of seedUsers) {
    const existing = await db.users().findOne({ email: u.email });
    if (!existing) {
      await db.users().insertOne(u);
    }
  }

  // Seed Exam with Mixed Question Types (MCQ, Coding, Descriptive)
  const examId = 'exam-demo-cs301';
  const existingExam = await db.exams().findOne({ id: examId });
  if (!existingExam) {
    const demoExam: Exam = {
      id: examId,
      title: 'CS 301: Advanced Algorithms & Data Structures',
      courseCode: 'CS-301',
      description:
        'Comprehensive examination covering algorithmic complexity, graph traversal, and coding implementation with privacy-preserving behavioral integrity monitoring.',
      durationMinutes: 45,
      totalMarks: 50,
      totalQuestions: 4,
      status: 'ACTIVE',
      createdBy: 'Dr. Sarah Jenkins',
      accessCode: 'A7K9-XP2',
      isPublished: true,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      createdAt: new Date().toISOString(),
      settings: {
        fullscreenRequired: true,
        clipboardMonitoring: true,
        typingDynamics: true,
        mouseDynamics: true,
        allowQuestionNavigation: true,
      },
      questionDistribution: {
        mcq: 2,
        coding: 1,
        descriptive: 1,
      },
    };
    await db.exams().insertOne(demoExam);

    const questions: Question[] = [
      {
        id: 'q-demo-1',
        examId,
        title: 'Algorithmic Complexity Analysis',
        questionText:
          'What is the worst-case time complexity of searching for an element in a balanced AVL Tree with N elements?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctAnswer: 1,
        marks: 5,
        orderIndex: 0,
        category: 'Complexity Theory',
        explanation: 'Balanced BSTs maintain a height of O(log N), making search, insertion, and deletion O(log N).',
      },
      {
        id: 'q-demo-2',
        examId,
        title: 'Graph Traversal & Cycle Detection',
        questionText:
          'Which data structure is primarily utilized to implement Breadth-First Search (BFS) in an unweighted graph?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['Stack', 'Queue', 'Priority Queue', 'Disjoint Set Union'],
        correctAnswer: 1,
        marks: 5,
        orderIndex: 1,
        category: 'Graph Theory',
        explanation: 'BFS uses a FIFO Queue to visit neighbors level-by-level.',
      },
      {
        id: 'q-demo-3',
        examId,
        title: 'Two Sum Target Problem',
        questionText:
          'Write an efficient function `twoSum(nums, target)` that finds the indices of the two numbers in an array that sum to the target value.',
        questionType: 'CODING',
        problemStatement:
          'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer as a comma-separated pair of indices in ascending order (e.g. `0, 1`).',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
        inputFormat: 'First line: comma-separated array of integers.\nSecond line: target integer.',
        outputFormat: 'Two indices separated by a comma (e.g. `0, 1`).',
        allowedLanguages: ['python', 'javascript', 'typescript', 'c', 'cpp', 'java'],
        starterCode: {
          javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return \`\${map.get(complement)}, \${i}\`;
    }
    map.set(nums[i], i);
  }
  return '';
}

// Process standard input
const lines = input.trim().split('\\n');
const nums = lines[0].split(',').map(x => parseInt(x.trim(), 10));
const target = parseInt(lines[1].trim(), 10);
console.log(twoSum(nums, target));`,
          python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return f"{seen[diff]}, {i}"
        seen[num] = i
    return ""

import sys
lines = sys.stdin.read().strip().split('\\n')
nums = [int(x.strip()) for x in lines[0].split(',')]
target = int(lines[1].strip())
print(two_sum(nums, target))`,
        },
        marks: 25,
        orderIndex: 2,
        category: 'Algorithms',
        examples: [
          {
            input: '2, 7, 11, 15\n9',
            output: '0, 1',
            explanation: 'Because nums[0] + nums[1] == 2 + 7 == 9, return 0, 1.',
          },
          {
            input: '3, 2, 4\n6',
            output: '1, 2',
            explanation: 'Because nums[1] + nums[2] == 2 + 4 == 6, return 1, 2.',
          },
        ],
        testCases: [
          {
            id: 'tc-1',
            input: '2, 7, 11, 15\n9',
            expectedOutput: '0, 1',
            hidden: false,
          },
          {
            id: 'tc-2',
            input: '3, 2, 4\n6',
            expectedOutput: '1, 2',
            hidden: false,
          },
          {
            id: 'tc-3',
            input: '3, 3\n6',
            expectedOutput: '0, 1',
            hidden: true,
          },
          {
            id: 'tc-4',
            input: '1, 5, 8, 12, 19\n27',
            expectedOutput: '2, 4',
            hidden: true,
          },
        ],
      },
      {
        id: 'q-demo-4',
        examId,
        title: 'System Design & Trade-offs',
        questionText:
          'Explain the engineering trade-offs between using a Hash Table vs a Red-Black Tree for an in-memory database index with high frequency concurrent read/write queries.',
        questionType: 'DESCRIPTIVE',
        marks: 15,
        orderIndex: 3,
        category: 'System Architecture',
        rubric:
          'Excellence criteria: (1) Time complexity comparison for average & worst case, (2) Memory overhead & CPU cache locality, (3) Support for range queries vs point lookups, (4) Concurrency lock contention.',
        minWords: 50,
        maxWords: 500,
      },
    ];

    for (const q of questions) {
      await db.questions().insertOne(q);
    }
  }

  // Seed sample completed sessions to populate examiner view immediately
  const existingSession = await db.sessions().findOne({ id: 'sess-alex-completed' });
  if (!existingSession) {
    const completedSession: ExamSession = {
      id: 'sess-alex-completed',
      examId,
      examTitle: 'CS 301: Advanced Algorithms & Data Structures',
      studentId: 'usr-student-1',
      studentName: 'Alex Rivera',
      studentEmail: 'alex.rivera@student.edu',
      startedAt: new Date(Date.now() - 2400000).toISOString(),
      submittedAt: new Date(Date.now() - 300000).toISOString(),
      durationSeconds: 2100,
      status: 'SUBMITTED',
      answers: {
        'q-demo-1': 1,
        'q-demo-2': 1,
        'q-demo-3': {
          code: 'function twoSum(nums, target) { ... }',
          language: 'javascript',
          passedTests: 4,
          totalTests: 4,
          status: 'PASSED',
        },
        'q-demo-4':
          'Hash tables offer average O(1) lookups for point queries, but do not support efficient range scans or sorted traversals. Red-Black trees guarantee O(log N) worst-case performance and allow efficient range scanning...',
      },
      progress: 100,
      riskScore: 18,
      riskLevel: 'NORMAL',
      proctorStatus: 'REVIEWED',
      proctorNotes: 'Normal steady pace observed. Clean incremental code edits.',
      features: {
        typing_speed: 46,
        typing_variance: 140,
        average_answer_time: 68,
        answer_time_variance: 42,
        focus_loss_count: 1,
        focus_loss_duration: 2.1,
        copy_count: 0,
        paste_count: 0,
        mouse_activity_score: 58,
        mouse_idle_time: 32,
        question_navigation_count: 12,
        question_revisit_count: 2,
        back_navigation_count: 2,
        session_duration: 2100,
        code_edit_duration: 480,
        code_run_count: 4,
        code_submit_count: 1,
        large_insertion_count: 0,
        code_paste_count: 0,
        compile_failure_count: 1,
        compile_success_count: 3,
        test_execution_count: 12,
        time_between_edits: 14,
        coding_focus_loss_count: 0,
        coding_focus_loss_duration: 0,
      },
      anomalyReport: {
        id: 'rep-alex-1',
        sessionId: 'sess-alex-completed',
        anomalyScore: 0.28,
        riskScore: 18,
        riskLevel: 'NORMAL',
        modelUsed: 'Isolation Forest ML v1.2',
        modelVersion: 'behavioral-iforest-v2',
        featureSchemaVersion: 'behavior-v2',
        scoringVersion: 'risk-v2',
        detectedPatterns: ['Consistent exam focus and typical incremental pacing'],
        contributingFactors: [],
        recommendation: 'Exam interactions are consistent with baseline expectations. No proctor intervention needed.',
        createdAt: new Date().toISOString(),
      },
    };
    await db.sessions().insertOne(completedSession);
  }

  // Seed high anomaly sample session for proctor demonstration
  const existingAnomalySession = await db.sessions().findOne({ id: 'sess-jordan-anomaly' });
  if (!existingAnomalySession) {
    const anomalySession: ExamSession = {
      id: 'sess-jordan-anomaly',
      examId,
      examTitle: 'CS 301: Advanced Algorithms & Data Structures',
      studentId: 'usr-student-3',
      studentName: 'Jordan Taylor',
      studentEmail: 'jordan.taylor@student.edu',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      submittedAt: new Date(Date.now() - 100000).toISOString(),
      durationSeconds: 1700,
      status: 'SUBMITTED',
      answers: {
        'q-demo-1': 1,
        'q-demo-2': 1,
        'q-demo-3': {
          code: 'def two_sum(nums, target): ...',
          language: 'python',
          passedTests: 4,
          totalTests: 4,
          status: 'PASSED',
        },
        'q-demo-4': 'Hash tables have amortized O(1) performance...',
      },
      progress: 100,
      riskScore: 78,
      riskLevel: 'HIGH_ANOMALY',
      proctorStatus: 'FLAGGED',
      proctorNotes: 'Multiple focus loss transitions correlating with large code insertion event.',
      features: {
        typing_speed: 62,
        typing_variance: 290,
        average_answer_time: 22,
        answer_time_variance: 110,
        focus_loss_count: 8,
        focus_loss_duration: 28.5,
        copy_count: 2,
        paste_count: 3,
        mouse_activity_score: 22,
        mouse_idle_time: 75,
        question_navigation_count: 28,
        question_revisit_count: 7,
        back_navigation_count: 6,
        session_duration: 1700,
        code_edit_duration: 95,
        code_run_count: 1,
        code_submit_count: 1,
        large_insertion_count: 2,
        code_paste_count: 2,
        compile_failure_count: 0,
        compile_success_count: 1,
        test_execution_count: 4,
        time_between_edits: 4,
        coding_focus_loss_count: 4,
        coding_focus_loss_duration: 18.2,
      },
      anomalyReport: {
        id: 'rep-jordan-1',
        sessionId: 'sess-jordan-anomaly',
        anomalyScore: 0.82,
        riskScore: 78,
        riskLevel: 'HIGH_ANOMALY',
        modelUsed: 'Isolation Forest ML v1.2',
        modelVersion: 'behavioral-iforest-v2',
        featureSchemaVersion: 'behavior-v2',
        scoringVersion: 'risk-v2',
        detectedPatterns: [
          'Unusual tab focus transitions during examination',
          'Abrupt insertion of complete code structure without incremental development',
          'Coinciding focus transitions and code workspace changes',
          'Multivariate interaction vector deviated from baseline population distribution',
        ],
        contributingFactors: [
          {
            factor: 'Tab Focus Loss & Window Transitions',
            points: 24,
            explanation: '8 focus changes (29s away) vs expected baseline of 0–2 (< 5s)',
            severity: 'high',
            featureName: 'focus_loss_count',
            sessionValue: '8 events (29s)',
            baselineValue: '0–2 events (< 5s)',
          },
          {
            factor: 'Large Code Block Insertion',
            points: 20,
            explanation: '2 sudden large code insertion event(s) recorded without preceding incremental editing',
            severity: 'high',
            featureName: 'large_insertion_count',
            sessionValue: '2 burst insertion(s)',
            baselineValue: '0 burst insertions (gradual edits expected)',
          },
          {
            factor: 'Correlated Focus Loss Around Code Insertions',
            points: 10,
            explanation: 'Focus switch occurred directly adjacent to code insertion events (4 coding focus changes)',
            severity: 'high',
            featureName: 'coding_focus_loss_count',
            sessionValue: '4 focus shifts',
            baselineValue: '0–1 focus shifts',
          },
          {
            factor: 'Clipboard Manipulation Detected',
            points: 14,
            explanation: '2 copy and 3 paste events recorded during session',
            severity: 'medium',
            featureName: 'paste_count',
            sessionValue: '2 copies, 3 pastes',
            baselineValue: '0 clipboard interactions',
          },
        ],
        recommendation:
          'Multiple significant behavioral deviations detected. Detailed human examiner review recommended. Inspect forensic event timeline.',
        createdAt: new Date().toISOString(),
      },
    };
    await db.sessions().insertOne(anomalySession);
  }

  // Seed sample audit log
  const existingAudit = await db.audit_logs().findOne({ id: 'log-seed-1' });
  if (!existingAudit) {
    await db.audit_logs().insertOne({
      id: 'log-seed-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actorId: 'usr-examiner-1',
      actorName: 'Dr. Sarah Jenkins',
      actorRole: 'EXAMINER',
      action: 'EXAM_PUBLISHED',
      targetId: examId,
      details: 'Published CS 301 examination with mixed question formats (MCQ, Coding, Descriptive)',
    });
  }
}
