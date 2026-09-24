/**
 * ExamGuard AI - Main Application Entrypoint
 * Institutional Examination Platform & Behavioral Intelligence
 * Official Institutional Platform Architecture
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInstructions } from './pages/student/ExamInstructions';
import { ExamInterface } from './pages/student/ExamInterface';
import { ExamResult } from './pages/student/ExamResult';
import { ExaminerDashboard } from './pages/examiner/ExaminerDashboard';
import { SessionDetail } from './pages/examiner/SessionDetail';
import { AnalyticsView } from './pages/examiner/AnalyticsView';
import { CreateExamModal } from './pages/examiner/CreateExamModal';
import { PrivacyPage } from './pages/PrivacyPage';
import { api } from './services/api';
import { Exam, ExamSession, Question } from './types';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Student flow state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [validatedAccessCode, setValidatedAccessCode] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

  // Examiner flow state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);

  // Redirect upon login or logout
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (currentTab === 'home' || currentTab === 'login' || currentTab === 'register') {
          setCurrentTab(user.role === 'STUDENT' ? 'student-exams' : 'examiner-dashboard');
        }
      } else {
        if (currentTab === 'student-exams' || currentTab === 'examiner-dashboard' || currentTab === 'session-detail') {
          setCurrentTab('home');
        }
      }
    }
  }, [user, isLoading]);

  // Start exam flow
  const handleSelectExamForInstructions = (exam: Exam, accessCode: string) => {
    setSelectedExam(exam);
    setValidatedAccessCode(accessCode);
    setCurrentTab('exam-instructions');
  };

  const handleStartExamSession = async (examId: string, accessCode?: string) => {
    const codeToUse = accessCode || validatedAccessCode;
    const [startRes, examRes] = await Promise.all([
      api.startExam(examId, codeToUse),
      api.getExam(examId),
    ]);
    setActiveSession(startRes.session);
    setSessionQuestions(examRes.questions);
    setSelectedExam(examRes.exam);
    setCurrentTab('exam-active');
  };

  const handleExamSubmitSuccess = (session: ExamSession) => {
    setActiveSession(null);
    setCompletedSession(session);
    setCurrentTab('exam-result');
  };

  const handleSelectSessionForInspection = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentTab('session-detail');
  };

  const isExaminer = user?.role === 'EXAMINER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 text-xs font-mono">
        Initializing Institutional Verification Engine...
      </div>
    );
  }

  // Active fullscreen exam view (hide navigation header for testing focus)
  if (currentTab === 'exam-active' && selectedExam && activeSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        <ExamInterface
          exam={selectedExam}
          session={activeSession}
          questions={sessionQuestions}
          onSubmitSuccess={handleExamSubmitSuccess}
        />
      </div>
    );
  }

  // Standalone Auth Pages (Hide full navbar for clean institutional focus)
  if (currentTab === 'login') {
    return <LoginPage onNavigate={setCurrentTab} />;
  }

  if (currentTab === 'register') {
    return <RegisterPage onNavigate={setCurrentTab} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-slate-200">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'examiner-dashboard') setSelectedSessionId(null);
          if (tab === 'student-exams') setSelectedExam(null);
        }}
      />

      <main className="flex-1">
        {/* Public Home Page */}
        {currentTab === 'home' && <HomePage onNavigate={setCurrentTab} />}

        {/* Student Views (Protected) */}
        {currentTab === 'student-exams' && (
          user ? (
            <StudentDashboard
              onSelectExam={handleSelectExamForInstructions}
              onViewResult={(sess) => {
                setCompletedSession(sess);
                setCurrentTab('exam-result');
              }}
            />
          ) : (
            <LoginPage onNavigate={setCurrentTab} />
          )
        )}

        {currentTab === 'exam-instructions' && selectedExam && (
          <ExamInstructions
            exam={selectedExam}
            accessCode={validatedAccessCode}
            onBack={() => setCurrentTab('student-exams')}
            onStartExam={handleStartExamSession}
          />
        )}

        {currentTab === 'exam-result' && completedSession && (
          <ExamResult
            session={completedSession}
            onReturnDashboard={() => {
              setCompletedSession(null);
              setCurrentTab(user?.role === 'EXAMINER' ? 'examiner-dashboard' : 'student-exams');
            }}
          />
        )}

        {/* Examiner Views (Protected) */}
        {currentTab === 'examiner-dashboard' && (
          user && isExaminer ? (
            <ExaminerDashboard
              onSelectSession={handleSelectSessionForInspection}
              onCreateExam={() => setShowCreateExamModal(true)}
            />
          ) : (
            <LoginPage onNavigate={setCurrentTab} />
          )
        )}

        {currentTab === 'session-detail' && selectedSessionId && (
          <SessionDetail
            sessionId={selectedSessionId}
            onBack={() => {
              setSelectedSessionId(null);
              setCurrentTab('examiner-dashboard');
            }}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsView />}

        {/* Informational Pages */}
        {currentTab === 'privacy' && <PrivacyPage />}
      </main>

      {/* Official Institutional Footer (Only on standard pages) */}
      {currentTab !== 'home' && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">ExamGuard AI</span>
              <span>·</span>
              <span>Institutional Examination Platform & Integrity Architecture</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>FERPA & GDPR Compliant</span>
              <span>·</span>
              <span>Zero Webcam Surveillance</span>
              <span>·</span>
              <span>In-Process Anomaly Engine</span>
            </div>
          </div>
        </footer>
      )}

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={showCreateExamModal}
        onClose={() => setShowCreateExamModal(false)}
        onCreated={() => {
          setShowCreateExamModal(false);
          setCurrentTab('examiner-dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
