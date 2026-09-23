/**
 * ExamGuard AI - Client API Service
 * ED-02 — AI-Based Exam Malpractice Detection
 */

import {
  User,
  Exam,
  Question,
  ExamSession,
  BehaviorEvent,
  AnomalyReport,
  BaselineFeatureComparison,
  CodingSubmission,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('examguard_token') || localStorage.getItem('smartexam_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('examguard_token', data.token);
    }
    return data;
  },

  async register(name: string, email: string, password: string, role: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('examguard_token', data.token);
    }
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve user session');
    return res.json();
  },

  // Exams
  async getExams(): Promise<Exam[]> {
    const res = await fetch(`${API_BASE}/exams`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch exams');
    const data = await res.json();
    return Array.isArray(data) ? data : data.exams || [];
  },

  async getExam(id: string): Promise<{ exam: Exam; questions: Question[] }> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch exam details');
    return res.json();
  },

  async getExamById(id: string): Promise<{ exam: Exam; questions: Question[] }> {
    return this.getExam(id);
  },

  async createExam(examData: Partial<Exam> & { questions: any[] }): Promise<Exam> {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(examData),
    });
    if (!res.ok) throw new Error('Failed to create examination');
    const data = await res.json();
    return data.exam || data;
  },

  async deleteExam(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete examination');
  },

  // Exam Sessions
  async startExam(examId: string): Promise<{ session: ExamSession; handshakeToken?: string }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to initialize exam session');
    return res.json();
  },

  async autosaveAnswers(
    sessionId: string,
    answers: Record<string, any>,
    progress?: number
  ): Promise<{ message: string; progress: number }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/answers`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers, progress }),
    });
    if (!res.ok) throw new Error('Autosave failed');
    return res.json();
  },

  async submitExam(
    sessionId: string,
    answers: Record<string, any>
  ): Promise<{ session: ExamSession; anomalyReport: AnomalyReport }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error('Submission failed');
    return res.json();
  },

  // Behavioral Telemetry Ingestion
  async sendBehaviorEvents(sessionId: string, events: Partial<BehaviorEvent>[]): Promise<any> {
    const res = await fetch(`${API_BASE}/behavior/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, events }),
    });
    if (!res.ok) throw new Error('Telemetry transmission failed');
    return res.json();
  },

  // Code Execution Sandbox
  async runCode(payload: {
    code: string;
    language: string;
    questionId: string;
    sessionId?: string;
  }): Promise<{
    status: 'PASSED' | 'FAILED' | 'COMPILE_ERROR' | 'TIMEOUT' | 'ERROR';
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    compilerOutput?: string;
    runtimeOutput?: string;
    testResults: any[];
  }> {
    const res = await fetch(`${API_BASE}/coding/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Code execution failed');
    return res.json();
  },

  async submitCode(payload: {
    code: string;
    language: string;
    questionId: string;
    sessionId: string;
  }): Promise<{
    submission: CodingSubmission;
    executionResult: any;
  }> {
    const res = await fetch(`${API_BASE}/coding/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Code submission failed');
    return res.json();
  },

  // Proctor & Analytics
  async getSessions(filter?: { examId?: string; riskLevel?: string; status?: string; search?: string }): Promise<ExamSession[]> {
    const params = new URLSearchParams();
    if (filter?.examId) params.append('examId', filter.examId);
    if (filter?.riskLevel) params.append('riskLevel', filter.riskLevel);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.search) params.append('search', filter.search);

    const res = await fetch(`${API_BASE}/sessions?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve student sessions');
    const data = await res.json();
    return Array.isArray(data) ? data : data.sessions || [];
  },

  async getSessionDetail(
    sessionId: string
  ): Promise<{ session: ExamSession; anomalyReport?: AnomalyReport; featureComparison: BaselineFeatureComparison[] }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch session details');
    return res.json();
  },

  async getSessionTimeline(sessionId: string): Promise<BehaviorEvent[]> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/timeline`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch session timeline');
    const data = await res.json();
    return Array.isArray(data) ? data : data.timeline || [];
  },

  async updateSessionReview(
    sessionId: string,
    payload: { proctorNotes?: string; proctorStatus?: 'UNREVIEWED' | 'REVIEWED' | 'FLAGGED' }
  ): Promise<{ session: ExamSession }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/review`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update session review');
    return res.json();
  },

  async getAnalyticsOverview(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    return Array.isArray(data) ? data : data.logs || [];
  },

  async checkDatabaseHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health/db`);
    if (!res.ok) throw new Error('Database health check failed');
    return res.json();
  },
};
