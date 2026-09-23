/**
 * SmartExam AI - Canonical In-Memory Data Store & Seed Database
 * Acts as the authoritative state on the server
 */

import {
  User,
  Exam,
  Question,
  ExamSession,
  BehaviorEvent,
  AuditLog,
} from '../types';
import {
  calculateExplainableRisk,
  extractFeaturesFromEvents,
} from '../ml/isolationForest';

export class DataStore {
  public users: Map<string, User> = new Map();
  public userPasswords: Map<string, string> = new Map(); // email -> hash/pass
  public exams: Map<string, Exam> = new Map();
  public questions: Map<string, Question[]> = new Map(); // examId -> Question[]
  public sessions: Map<string, ExamSession> = new Map();
  public sessionEvents: Map<string, BehaviorEvent[]> = new Map(); // sessionId -> events
  public auditLogs: AuditLog[] = [];
  public sseListeners: Set<(event: { type: string; payload: any }) => void> = new Set();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Users
    const students: User[] = [
      {
        id: 'usr-student-1',
        name: 'Alex Rivera',
        email: 'alex.student@smartexam.edu',
        role: 'STUDENT',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'usr-student-2',
        name: 'Priya Sharma',
        email: 'priya.sharma@smartexam.edu',
        role: 'STUDENT',
        createdAt: '2026-09-01T08:05:00Z',
      },
      {
        id: 'usr-student-3',
        name: 'David Kim',
        email: 'david.kim@smartexam.edu',
        role: 'STUDENT',
        createdAt: '2026-09-01T08:10:00Z',
      },
      {
        id: 'usr-student-4',
        name: 'Jordan Hayes',
        email: 'jordan.hayes@smartexam.edu',
        role: 'STUDENT',
        createdAt: '2026-09-01T08:15:00Z',
      },
      {
        id: 'usr-student-5',
        name: 'Samuel Vance',
        email: 'samuel.vance@smartexam.edu',
        role: 'STUDENT',
        createdAt: '2026-09-01T08:20:00Z',
      },
    ];

    const examiners: User[] = [
      {
        id: 'usr-examiner-1',
        name: 'Dr. Elena Vance',
        email: 'elena.examiner@smartexam.edu',
        role: 'EXAMINER',
        createdAt: '2026-08-15T09:00:00Z',
      },
      {
        id: 'usr-admin-1',
        name: 'Marcus Aurelius',
        email: 'admin@smartexam.edu',
        role: 'ADMIN',
        createdAt: '2026-08-01T09:00:00Z',
      },
    ];

    [...students, ...examiners].forEach((u) => {
      this.users.set(u.id, u);
      this.userPasswords.set(u.email, 'password123');
    });

    // 2. Seed Exams
    const exam1: Exam = {
      id: 'exam-101',
      title: 'CS 341: Data Structures & Algorithms Final',
      courseCode: 'CS341',
      description:
        'Comprehensive assessment covering balanced binary search trees, graph shortest path algorithms, dynamic programming formulations, and amortized complexity bounds.',
      durationMinutes: 45,
      totalMarks: 50,
      totalQuestions: 8,
      status: 'ACTIVE',
      createdBy: 'Dr. Elena Vance',
      startTime: '2026-09-23T06:00:00Z',
      endTime: '2026-09-24T23:59:59Z',
      createdAt: '2026-09-18T10:00:00Z',
    };

    const exam2: Exam = {
      id: 'exam-102',
      title: 'SEC 402: Network Security & Cryptographic Protocols',
      courseCode: 'SEC402',
      description:
        'Evaluation of TLS 1.3 handshakes, asymmetric key exchange (ECDHE), zero-knowledge proof concepts, replay attack mitigations, and behavioral intrusion telemetry.',
      durationMinutes: 30,
      totalMarks: 40,
      totalQuestions: 6,
      status: 'ACTIVE',
      createdBy: 'Dr. Elena Vance',
      startTime: '2026-09-23T08:00:00Z',
      endTime: '2026-09-25T18:00:00Z',
      createdAt: '2026-09-20T14:30:00Z',
    };

    const exam3: Exam = {
      id: 'exam-103',
      title: 'AI 210: Ethics & Privacy in Autonomous Systems',
      courseCode: 'AI210',
      description:
        'Foundational principles of privacy-preserving behavioral biometric monitoring, differential privacy, GDPR Article 22 automated decisions, and transparent algorithmic audits.',
      durationMinutes: 25,
      totalMarks: 30,
      totalQuestions: 5,
      status: 'ACTIVE',
      createdBy: 'Marcus Aurelius',
      startTime: '2026-09-22T08:00:00Z',
      endTime: '2026-09-26T20:00:00Z',
      createdAt: '2026-09-19T11:00:00Z',
    };

    this.exams.set(exam1.id, exam1);
    this.exams.set(exam2.id, exam2);
    this.exams.set(exam3.id, exam3);

    // 3. Seed Questions for CS 341
    const qCS341: Question[] = [
      {
        id: 'q101-1',
        examId: 'exam-101',
        questionText:
          'What is the tightest upper bound (Big-O) for finding the lowest common ancestor (LCA) of two arbitrary nodes in a balanced Red-Black Tree with n nodes?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        marks: 6,
        orderIndex: 0,
        category: 'Trees & Complexity',
        correctAnswer: 1,
      },
      {
        id: 'q101-2',
        examId: 'exam-101',
        questionText:
          'When executing Dijkstra’s algorithm on a connected directed graph with V vertices and E edges using a Fibonacci Heap, what is the asymptotic worst-case runtime?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['O(E + V log V)', 'O(V²)', 'O((E + V) log V)', 'O(E log V)'],
        marks: 6,
        orderIndex: 1,
        category: 'Graph Algorithms',
        correctAnswer: 0,
      },
      {
        id: 'q101-3',
        examId: 'exam-101',
        questionText:
          'In dynamic programming, which structural property is essential for a problem to be solvable via optimal substructure and overlapping subproblems?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'The state transition graph must contain directed cycles with negative weights.',
          'An optimal solution to the problem contains within it optimal solutions to subproblems.',
          'The recurrence relation must have exactly one base condition.',
          'The subproblem dependencies must form an undirected bipartite graph.',
        ],
        marks: 6,
        orderIndex: 2,
        category: 'Dynamic Programming',
        correctAnswer: 1,
      },
      {
        id: 'q101-4',
        examId: 'exam-101',
        questionText:
          'What is the amortized cost per insertion in a dynamic array that doubles its capacity whenever the current buffer is full?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(√n)'],
        marks: 6,
        orderIndex: 3,
        category: 'Amortized Analysis',
        correctAnswer: 2,
      },
      {
        id: 'q101-5',
        examId: 'exam-101',
        questionText:
          'Which sorting algorithm guarantees O(n log n) worst-case time complexity, operates in-place (O(1) auxiliary memory), but is inherently unstable?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Radix Sort'],
        marks: 6,
        orderIndex: 4,
        category: 'Sorting Algorithms',
        correctAnswer: 2,
      },
      {
        id: 'q101-6',
        examId: 'exam-101',
        questionText:
          'In a B-Tree of minimum degree t ≥ 2, what is the maximum number of keys that any non-root internal node can store?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['t - 1', '2t - 1', '2t', 't'],
        marks: 6,
        orderIndex: 5,
        category: 'Advanced Trees',
        correctAnswer: 1,
      },
      {
        id: 'q101-7',
        examId: 'exam-101',
        questionText:
          'Which of the following problems is known to be NP-Complete?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Shortest Path on DAG',
          '2-Satisfiability (2-SAT)',
          'Boolean Satisfiability (3-SAT)',
          'Minimum Spanning Tree (MST)',
        ],
        marks: 7,
        orderIndex: 6,
        category: 'Complexity Theory',
        correctAnswer: 2,
      },
      {
        id: 'q101-8',
        examId: 'exam-101',
        questionText:
          'What invariant is maintained by the Disjoint Set Union (DSU) structure when both path compression and union by rank optimizations are applied?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Maximum tree height remains strictly ≤ 2',
          'Amortized runtime per operation is O(α(n)), where α is the inverse Ackermann function',
          'Every union operation executes in strictly O(1) worst-case time without dereferencing',
          'Root nodes store the sum of all elements in their set',
        ],
        marks: 7,
        orderIndex: 7,
        category: 'Data Structures',
        correctAnswer: 1,
      },
    ];

    // Seed questions for SEC 402
    const qSEC402: Question[] = [
      {
        id: 'q102-1',
        examId: 'exam-102',
        questionText:
          'In TLS 1.3, which major enhancement eliminates round-trips compared to TLS 1.2 while enforcing Forward Secrecy?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Deprecation of static RSA key transport in favor of ephemeral Diffie-Hellman (ECDHE)',
          'Use of plaintext HTTP headers before handshake validation',
          'Reliance on MD5 hash chains for session resumption',
          'Elimination of Certificate Authorities',
        ],
        marks: 7,
        orderIndex: 0,
        category: 'TLS Architecture',
        correctAnswer: 0,
      },
      {
        id: 'q102-2',
        examId: 'exam-102',
        questionText:
          'What fundamental security guarantee does Perfect Forward Secrecy (PFS) provide in secure communications?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Compromise of the server’s long-term private key does not compromise past recorded session keys',
          'Messages cannot be lost during packet dropouts',
          'The client identity is completely hidden from the ISP',
          'Both communicating parties must be simultaneously online',
        ],
        marks: 7,
        orderIndex: 1,
        category: 'Cryptography',
        correctAnswer: 0,
      },
      {
        id: 'q102-3',
        examId: 'exam-102',
        questionText:
          'How does a Nonce (Number used Once) effectively prevent replay attacks in mutual authentication protocols?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'It guarantees message payload encryption using a symmetric stream cipher',
          'It provides freshness verification so replayed past transcripts are rejected as stale',
          'It increases the network packet size to overflow attacker buffers',
          'It encrypts the DNS resolution query',
        ],
        marks: 6,
        orderIndex: 2,
        category: 'Protocol Security',
        correctAnswer: 1,
      },
      {
        id: 'q102-4',
        examId: 'exam-102',
        questionText:
          'In the context of behavioral intrusion detection systems (HIDS/NIDS), what does a "false positive" represent?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'An actual malicious compromise that the system failed to flag',
          'Benign authorized activity incorrectly flagged as anomalous or malicious',
          'A hardware fault in the monitoring NIC sensor',
          'An expired SSL certificate on the gateway',
        ],
        marks: 6,
        orderIndex: 3,
        category: 'Anomaly Detection',
        correctAnswer: 1,
      },
      {
        id: 'q102-5',
        examId: 'exam-102',
        questionText:
          'What is the primary benefit of Ephemeral Elliptic Curve Diffie-Hellman (ECDHE) over classic modular Diffie-Hellman (DHE)?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Equivalent cryptographic security with substantially shorter key lengths and lower compute overhead',
          'Support for quantum decryption without public keys',
          'Removal of the need for elliptic curve curve25519',
          'Automatic IP address anonymization',
        ],
        marks: 7,
        orderIndex: 4,
        category: 'Public Key Cryptography',
        correctAnswer: 0,
      },
      {
        id: 'q102-6',
        examId: 'exam-102',
        questionText:
          'Which HTTP security response header prevents Clickjacking attacks by forbidding framing of the webpage?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'X-Frame-Options: DENY (or CSP frame-ancestors none)',
          'Strict-Transport-Security: max-age=31536000',
          'Access-Control-Allow-Origin: *',
          'X-Content-Type-Options: nosniff',
        ],
        marks: 7,
        orderIndex: 5,
        category: 'Web Security',
        correctAnswer: 0,
      },
    ];

    // Seed questions for AI 210
    const qAI210: Question[] = [
      {
        id: 'q103-1',
        examId: 'exam-103',
        questionText:
          'Under privacy-preserving behavioral telemetry principles, why is aggregate keystroke timing dynamics preferred over raw keystroke logging?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'It preserves the diagnostic timing signal while ensuring sensitive student content/credentials are never captured',
          'Raw keystroke logging requires GPU acceleration',
          'Aggregate timing dynamics increases the database file size',
          'Keystroke content cannot be parsed in JSON',
        ],
        marks: 6,
        orderIndex: 0,
        category: 'Data Minimization',
        correctAnswer: 0,
      },
      {
        id: 'q103-2',
        examId: 'exam-103',
        questionText:
          'What core requirement does GDPR Article 22 impose regarding automated decision-making and profiling systems?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Individuals have the right not to be subject to a decision based solely on automated processing without human review',
          'All models must use deep neural networks with at least 50 layers',
          'Data must be kept indefinitely for model retraining',
          'Users cannot delete their exam records',
        ],
        marks: 6,
        orderIndex: 1,
        category: 'Regulatory Compliance',
        correctAnswer: 0,
      },
      {
        id: 'q103-3',
        examId: 'exam-103',
        questionText:
          'Why are continuous facial recognition and webcam emotional surveillance considered ethically problematic in online examinations?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'They introduce severe demographic bias, neurodivergent penalties, and excessive intrusion without proportional integrity benefits',
          'Webcam drivers always cause browser crashes',
          'Facial recognition algorithms cannot run on laptops',
          'Microphones consume too much Wi-Fi bandwidth',
        ],
        marks: 6,
        orderIndex: 2,
        category: 'Algorithmic Fairness',
        correctAnswer: 0,
      },
      {
        id: 'q103-4',
        examId: 'exam-103',
        questionText:
          'What distinguishes Explainable AI (XAI) feature attribution from opaque black-box risk scores?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'XAI provides transparent, verifiable evidence breakdown showing exact deviations and baseline comparisons',
          'XAI guarantees a 100% precision rate with zero false alarms',
          'XAI eliminates the need for human proctors entirely',
          'XAI can only be expressed in natural language audio',
        ],
        marks: 6,
        orderIndex: 3,
        category: 'Explainability',
        correctAnswer: 0,
      },
      {
        id: 'q103-5',
        examId: 'exam-103',
        questionText:
          'What is the core tenet of the "Detect behavior, not the person" paradigm in SmartExam AI?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          'Focus exclusively on non-invasive interaction signals rather than personal biometric identity or appearance',
          'Randomly disqualify 5% of test-takers',
          'Require fingerprint scanners on mouse hardware',
          'Prohibit students from using external monitors',
        ],
        marks: 6,
        orderIndex: 4,
        category: 'Core Architecture',
        correctAnswer: 0,
      },
    ];

    this.questions.set(exam1.id, qCS341);
    this.questions.set(exam2.id, qSEC402);
    this.questions.set(exam3.id, qAI210);

    // 4. Seed Historical Exam Sessions with realistic behavioral biometric profiles
    this.seedHistoricalSessions();

    // 5. Seed Audit Logs
    this.auditLogs = [
      {
        id: 'log-1',
        timestamp: '2026-09-23T06:30:00Z',
        actorId: 'usr-examiner-1',
        actorName: 'Dr. Elena Vance',
        actorRole: 'EXAMINER',
        action: 'EXAM_PUBLISHED',
        targetId: 'exam-101',
        details: 'Published CS 341 Final Exam with 8 questions and 45m time limit.',
      },
      {
        id: 'log-2',
        timestamp: '2026-09-23T07:15:00Z',
        actorId: 'usr-examiner-1',
        actorName: 'Dr. Elena Vance',
        actorRole: 'EXAMINER',
        action: 'SESSION_REVIEWED',
        targetId: 'sess-history-3',
        details: 'Reviewed Jordan Hayes session. Noted clipboard paste anomaly on Q4. Added proctor observation notes.',
      },
    ];
  }

  private seedHistoricalSessions() {
    // Session 1: Priya Sharma - NORMAL (Pristine behavioral baseline)
    const sess1Events: BehaviorEvent[] = [
      { id: 'e1-1', sessionId: 'sess-history-1', eventType: 'KEYBOARD_ACTIVITY', timestamp: 1727078400000, relativeSeconds: 10, metadata: { speedWpm: 44, keyIntervalVariance: 155 } },
      { id: 'e1-2', sessionId: 'sess-history-1', eventType: 'MOUSE_ACTIVITY', timestamp: 1727078440000, relativeSeconds: 40, metadata: { mouseIntensity: 52 } },
      { id: 'e1-3', sessionId: 'sess-history-1', eventType: 'QUESTION_CHANGED', timestamp: 1727078470000, relativeSeconds: 70, metadata: { questionIndex: 1 } },
      { id: 'e1-4', sessionId: 'sess-history-1', eventType: 'ANSWER_SUBMITTED', timestamp: 1727078530000, relativeSeconds: 130, metadata: { questionIndex: 1 } },
      { id: 'e1-5', sessionId: 'sess-history-1', eventType: 'QUESTION_CHANGED', timestamp: 1727078590000, relativeSeconds: 190, metadata: { questionIndex: 2 } },
      { id: 'e1-6', sessionId: 'sess-history-1', eventType: 'MOUSE_ACTIVITY', timestamp: 1727078650000, relativeSeconds: 250, metadata: { mouseIntensity: 48 } },
      { id: 'e1-7', sessionId: 'sess-history-1', eventType: 'QUESTION_CHANGED', timestamp: 1727078720000, relativeSeconds: 320, metadata: { questionIndex: 3 } },
      { id: 'e1-8', sessionId: 'sess-history-1', eventType: 'KEYBOARD_ACTIVITY', timestamp: 1727078800000, relativeSeconds: 400, metadata: { speedWpm: 42, keyIntervalVariance: 160 } },
    ];
    this.sessionEvents.set('sess-history-1', sess1Events);
    const feat1 = extractFeaturesFromEvents(sess1Events, 1140, 8);
    const rep1 = calculateExplainableRisk(feat1, true);
    rep1.sessionId = 'sess-history-1';
    rep1.riskScore = 14;
    rep1.riskLevel = 'NORMAL';

    this.sessions.set('sess-history-1', {
      id: 'sess-history-1',
      examId: 'exam-101',
      examTitle: 'CS 341: Data Structures & Algorithms Final',
      studentId: 'usr-student-2',
      studentName: 'Priya Sharma',
      studentEmail: 'priya.sharma@smartexam.edu',
      startedAt: '2026-09-23T06:10:00Z',
      submittedAt: '2026-09-23T06:29:00Z',
      durationSeconds: 1140,
      status: 'SUBMITTED',
      answers: { 'q101-1': 1, 'q101-2': 0, 'q101-3': 1, 'q101-4': 2, 'q101-5': 2, 'q101-6': 1, 'q101-7': 2, 'q101-8': 1 },
      progress: 100,
      riskScore: 14,
      riskLevel: 'NORMAL',
      features: feat1,
      anomalyReport: rep1,
      proctorStatus: 'REVIEWED',
      proctorNotes: 'Verified compliant. Regular pacing and zero window focus departures.',
    });

    // Session 2: David Kim - LOW CONCERN (Single system notification focus shift)
    const sess2Events: BehaviorEvent[] = [
      { id: 'e2-1', sessionId: 'sess-history-2', eventType: 'KEYBOARD_ACTIVITY', timestamp: 1727079000000, relativeSeconds: 15, metadata: { speedWpm: 39, keyIntervalVariance: 175 } },
      { id: 'e2-2', sessionId: 'sess-history-2', eventType: 'TAB_FOCUS_LOST', timestamp: 1727079120000, relativeSeconds: 120, metadata: {} },
      { id: 'e2-3', sessionId: 'sess-history-2', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727079123000, relativeSeconds: 123, metadata: { durationMs: 3000 } },
      { id: 'e2-4', sessionId: 'sess-history-2', eventType: 'QUESTION_CHANGED', timestamp: 1727079200000, relativeSeconds: 200, metadata: { questionIndex: 2 } },
      { id: 'e2-5', sessionId: 'sess-history-2', eventType: 'MOUSE_ACTIVITY', timestamp: 1727079300000, relativeSeconds: 300, metadata: { mouseIntensity: 45 } },
    ];
    this.sessionEvents.set('sess-history-2', sess2Events);
    const feat2 = extractFeaturesFromEvents(sess2Events, 1280, 8);
    feat2.focus_loss_count = 1;
    feat2.focus_loss_duration = 3.2;
    const rep2 = calculateExplainableRisk(feat2, true);
    rep2.sessionId = 'sess-history-2';
    rep2.riskScore = 36;
    rep2.riskLevel = 'LOW_CONCERN';

    this.sessions.set('sess-history-2', {
      id: 'sess-history-2',
      examId: 'exam-101',
      examTitle: 'CS 341: Data Structures & Algorithms Final',
      studentId: 'usr-student-3',
      studentName: 'David Kim',
      studentEmail: 'david.kim@smartexam.edu',
      startedAt: '2026-09-23T06:20:00Z',
      submittedAt: '2026-09-23T06:41:20Z',
      durationSeconds: 1280,
      status: 'SUBMITTED',
      answers: { 'q101-1': 1, 'q101-2': 0, 'q101-3': 1, 'q101-4': 2, 'q101-5': 0, 'q101-6': 1, 'q101-7': 2, 'q101-8': 1 },
      progress: 100,
      riskScore: 36,
      riskLevel: 'LOW_CONCERN',
      features: feat2,
      anomalyReport: rep2,
      proctorStatus: 'REVIEWED',
      proctorNotes: 'Brief 3-second focus loss recorded. Consistent with OS alert popup.',
    });

    // Session 3: Jordan Hayes - REVIEW RECOMMENDED (Moderate focus shifts & paste attempt)
    const sess3Events: BehaviorEvent[] = [
      { id: 'e3-1', sessionId: 'sess-history-3', eventType: 'QUESTION_CHANGED', timestamp: 1727080000000, relativeSeconds: 10, metadata: { questionIndex: 0 } },
      { id: 'e3-2', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_LOST', timestamp: 1727080080000, relativeSeconds: 80, metadata: {} },
      { id: 'e3-3', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727080098000, relativeSeconds: 98, metadata: { durationMs: 18000 } },
      { id: 'e3-4', sessionId: 'sess-history-3', eventType: 'PASTE_ATTEMPT', timestamp: 1727080110000, relativeSeconds: 110, metadata: { charCount: 42, context: 'question-scratchpad' } },
      { id: 'e3-5', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_LOST', timestamp: 1727080220000, relativeSeconds: 220, metadata: {} },
      { id: 'e3-6', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727080235000, relativeSeconds: 235, metadata: { durationMs: 15000 } },
      { id: 'e3-7', sessionId: 'sess-history-3', eventType: 'QUESTION_CHANGED', timestamp: 1727080300000, relativeSeconds: 300, metadata: { questionIndex: 4 } },
      { id: 'e3-8', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_LOST', timestamp: 1727080410000, relativeSeconds: 410, metadata: {} },
      { id: 'e3-9', sessionId: 'sess-history-3', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727080422000, relativeSeconds: 422, metadata: { durationMs: 12000 } },
    ];
    this.sessionEvents.set('sess-history-3', sess3Events);
    const feat3 = extractFeaturesFromEvents(sess3Events, 980, 6);
    feat3.focus_loss_count = 5;
    feat3.focus_loss_duration = 54.0;
    feat3.paste_count = 1;
    feat3.copy_count = 1;
    feat3.question_navigation_count = 22;
    feat3.back_navigation_count = 7;
    const rep3 = calculateExplainableRisk(feat3, true);
    rep3.sessionId = 'sess-history-3';
    rep3.riskScore = 68;
    rep3.riskLevel = 'REVIEW';

    this.sessions.set('sess-history-3', {
      id: 'sess-history-3',
      examId: 'exam-102',
      examTitle: 'SEC 402: Network Security & Cryptographic Protocols',
      studentId: 'usr-student-4',
      studentName: 'Jordan Hayes',
      studentEmail: 'jordan.hayes@smartexam.edu',
      startedAt: '2026-09-23T07:00:00Z',
      submittedAt: '2026-09-23T07:16:20Z',
      durationSeconds: 980,
      status: 'SUBMITTED',
      answers: { 'q102-1': 0, 'q102-2': 0, 'q102-3': 1, 'q102-4': 1, 'q102-5': 0, 'q102-6': 0 },
      progress: 100,
      riskScore: 68,
      riskLevel: 'REVIEW',
      features: feat3,
      anomalyReport: rep3,
      proctorStatus: 'FLAGGED',
      proctorNotes: 'Multiple window blurs with 54s cumulative time off-tab. Paste attempt recorded on scratchpad.',
    });

    // Session 4: Samuel Vance - HIGH ANOMALY (Frequent focus departures, clipboard transfers, erratic jumping)
    const sess4Events: BehaviorEvent[] = [
      { id: 'e4-1', sessionId: 'sess-history-4', eventType: 'QUESTION_CHANGED', timestamp: 1727081000000, relativeSeconds: 5, metadata: { questionIndex: 0 } },
      { id: 'e4-2', sessionId: 'sess-history-4', eventType: 'COPY_ATTEMPT', timestamp: 1727081020000, relativeSeconds: 20, metadata: { charCount: 88, context: 'q1-text' } },
      { id: 'e4-3', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_LOST', timestamp: 1727081025000, relativeSeconds: 25, metadata: {} },
      { id: 'e4-4', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727081055000, relativeSeconds: 55, metadata: { durationMs: 30000 } },
      { id: 'e4-5', sessionId: 'sess-history-4', eventType: 'PASTE_ATTEMPT', timestamp: 1727081060000, relativeSeconds: 60, metadata: { charCount: 120, context: 'answer-box' } },
      { id: 'e4-6', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_LOST', timestamp: 1727081110000, relativeSeconds: 110, metadata: {} },
      { id: 'e4-7', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727081150000, relativeSeconds: 150, metadata: { durationMs: 40000 } },
      { id: 'e4-8', sessionId: 'sess-history-4', eventType: 'QUESTION_CHANGED', timestamp: 1727081160000, relativeSeconds: 160, metadata: { questionIndex: 5 } },
      { id: 'e4-9', sessionId: 'sess-history-4', eventType: 'COPY_ATTEMPT', timestamp: 1727081170000, relativeSeconds: 170, metadata: { charCount: 95 } },
      { id: 'e4-10', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_LOST', timestamp: 1727081180000, relativeSeconds: 180, metadata: {} },
      { id: 'e4-11', sessionId: 'sess-history-4', eventType: 'TAB_FOCUS_RETURNED', timestamp: 1727081230000, relativeSeconds: 230, metadata: { durationMs: 50000 } },
      { id: 'e4-12', sessionId: 'sess-history-4', eventType: 'PASTE_ATTEMPT', timestamp: 1727081240000, relativeSeconds: 240, metadata: { charCount: 115 } },
    ];
    this.sessionEvents.set('sess-history-4', sess4Events);
    const feat4 = extractFeaturesFromEvents(sess4Events, 840, 8);
    feat4.focus_loss_count = 11;
    feat4.focus_loss_duration = 135.0;
    feat4.copy_count = 4;
    feat4.paste_count = 4;
    feat4.average_answer_time = 18;
    feat4.back_navigation_count = 12;
    feat4.question_navigation_count = 38;
    const rep4 = calculateExplainableRisk(feat4, true);
    rep4.sessionId = 'sess-history-4';
    rep4.riskScore = 86;
    rep4.riskLevel = 'HIGH_ANOMALY';

    this.sessions.set('sess-history-4', {
      id: 'sess-history-4',
      examId: 'exam-101',
      examTitle: 'CS 341: Data Structures & Algorithms Final',
      studentId: 'usr-student-5',
      studentName: 'Samuel Vance',
      studentEmail: 'samuel.vance@smartexam.edu',
      startedAt: '2026-09-23T07:15:00Z',
      submittedAt: '2026-09-23T07:29:00Z',
      durationSeconds: 840,
      status: 'SUBMITTED',
      answers: { 'q101-1': 1, 'q101-2': 0, 'q101-3': 1, 'q101-4': 2, 'q101-5': 2, 'q101-6': 1, 'q101-7': 2, 'q101-8': 1 },
      progress: 100,
      riskScore: 86,
      riskLevel: 'HIGH_ANOMALY',
      features: feat4,
      anomalyReport: rep4,
      proctorStatus: 'FLAGGED',
      proctorNotes: 'Elevated review priority. High frequency of tab departures (11 occurrences totaling 2m 15s) and repeated copy/paste events.',
    });
  }

  public notifyProctors(type: string, payload: any) {
    this.sseListeners.forEach((cb) => {
      try {
        cb({ type, payload });
      } catch (e) {
        // drop failed listener
      }
    });
  }
}

export const db = new DataStore();
