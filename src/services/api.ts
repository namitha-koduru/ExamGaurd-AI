/**
 * SmartExam AI - Client API Service
 */

import {
  User,
  Exam,
  Question,
  ExamSession,
  BehaviorEvent,
  AnomalyReport,
  BaselineFeatureComparison,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('smartexam_token');
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
    return res.json();
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
    return res.json();
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
    return data.exams || [];
  },

  async getExam(id: string): Promise<{ exam: Exam; questions: Question[] }> {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch exam details');
    return res.json();
  },

  async createExam(examData: Partial<Exam> & { questions: any[] }): Promise<Exam> {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(examData),
    });
    if (!res.ok) throw new Error('Failed to create examination');
    const data = await res.json();
    return data.exam;
  },

  // Exam Sessions
  async startExam(examId: string): Promise<{ session: ExamSession; exam: Exam; questions: Question[] }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to initialize exam session');
    return res.json();
  },

  async autosaveAnswers(sessionId: string, answers: Record<string, number>): Promise<{ success: boolean; progress: number }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error('Autosave failed');
    return res.json();
  },

  async submitExam(
    sessionId: string,
    answers: Record<string, number>
  ): Promise<{ session: ExamSession; anomalyReport: AnomalyReport; message: string }> {
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

  // Proctor & Analytics
  async getSessions(filter?: { examId?: string; riskLevel?: string; status?: string }): Promise<ExamSession[]> {
    const params = new URLSearchParams();
    if (filter?.examId) params.append('examId', filter.examId);
    if (filter?.riskLevel) params.append('riskLevel', filter.riskLevel);
    if (filter?.status) params.append('status', filter.status);

    const res = await fetch(`${API_BASE}/sessions?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve student sessions');
    const data = await res.json();
    return data.sessions || [];
  },

  async getSessionDetail(
    sessionId: string
  ): Promise<{ session: ExamSession; eventsCount: number; anomalyReport?: AnomalyReport; featureComparison: BaselineFeatureComparison[] }> {
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
    return data.timeline || [];
  },

  async updateSessionReview(
    sessionId: string,
    payload: { proctorNotes?: string; proctorStatus?: 'UNREVIEWED' | 'REVIEWED' | 'FLAGGED' }
  ): Promise<{ session: ExamSession }> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/review`, {
      method: 'PATCH',
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
};
