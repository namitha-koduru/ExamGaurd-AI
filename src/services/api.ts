/**
 * ExamGuard AI - Client API Service
 * Institutional Examination Platform & Behavioral Intelligence
 */

import {
  Institution,
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
  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    const res = await fetch(`${API_BASE}/auth/institutions`);
    if (!res.ok) throw new Error('Failed to load institutions');
    return res.json();
  },

  async registerInstitution(data: {
    name: string;
    registrationId: string;
    type: string;
    country: string;
    domain?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }): Promise<{ institution: Institution; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register-institution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Institutional registration failed');
    }
    const result = await res.json();
    if (result.token) {
      localStorage.setItem('examguard_token', result.token);
    }
    return result;
  },

  // Auth
  async login(
    email: string,
    password: string,
    institutionId?: string,
    institutionRegistrationId?: string
  ): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, institutionId, institutionRegistrationId }),
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

  async register(
    name: string,
    email: string,
    password: string,
    role: string,
    institutionId?: string,
    studentId?: string,
    employeeId?: string
  ): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, institutionId, studentId, employeeId }),
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
  async getExams(institutionId?: string): Promise<Exam[]> {
    const url = institutionId ? `${API_BASE}/exams?institutionId=${encodeURIComponent(institutionId)}` : `${API_BASE}/exams`;
    const res = await fetch(url, {
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

  // Exam Code Validation & Single-Attempt Check
  async validateExamCode(
    examId: string,
    code: string
  ): Promise<{
    valid: boolean;
    status: 'VALID' | 'INVALID_CODE' | 'EXPIRED' | 'NOT_STARTED' | 'ALREADY_ATTEMPTED' | 'NOT_FOUND';
    message: string;
    exam?: Partial<Exam>;
    existingSessionId?: string;
  }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/validate-code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    return res.json();
  },

  // Exam Sessions
  async startExam(
    examId: string,
    accessCode?: string
  ): Promise<{ session: ExamSession; handshakeToken?: string }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accessCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to initialize exam session');
    }
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
  async getSessions(filter?: { examId?: string; riskLevel?: string; status?: string; search?: string; institutionId?: string }): Promise<ExamSession[]> {
    const params = new URLSearchParams();
    if (filter?.institutionId) params.append('institutionId', filter.institutionId);
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
