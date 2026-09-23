/**
 * SmartExam AI - Main Application Entrypoint
 * ED-02 — AI-Based Exam Malpractice Detection
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInstructions } from './pages/student/ExamInstructions';
import { ExamInterface } from './pages/student/ExamInterface';
import { ExamResult } from './pages/student/ExamResult';
import { ExaminerDashboard } from './pages/examiner/ExaminerDashboard';
import { SessionDetail } from './pages/examiner/SessionDetail';
import { AnalyticsView } from './pages/examiner/AnalyticsView';
import { CreateExamModal } from './pages/examiner/CreateExamModal';
import { PrivacyPage } from './pages/PrivacyPage';
import { ExtensionHub } from './pages/ExtensionHub';
import { ExtensionSimulatorBar } from './components/common/ExtensionSimulatorBar';
import { api } from './services/api';
import { Exam, ExamSession, Question } from './types';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('student-exams');

  // Student flow state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [completedSession, setCompletedSession] = useState<ExamSession | null>(null);

  // Examiner flow state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);

  // Start exam flow
  const handleSelectExamForInstructions = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentTab('exam-instructions');
  };

  const handleStartExamSession = async (examId: string) => {
    const [startRes, examRes] = await Promise.all([
      api.startExam(examId),
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

  // Telemetry trigger handler for Simulator Bar
  const handleSimulatorEvent = async (eventType: string, metadata: Record<string, any> = {}) => {
    if (activeSession) {
      try {
        await api.sendBehaviorEvents(activeSession.id, [
          {
            eventType: eventType as any,
            timestamp: Date.now(),
            metadata,
          },
        ]);
      } catch (err) {
        console.error('Simulator event failed:', err);
      }
    }
  };

  // Fullscreen exam experience (hide navbar during active exam)
  if (currentTab === 'exam-active' && selectedExam && activeSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        <ExamInterface
          exam={selectedExam}
          session={activeSession}
          questions={sessionQuestions}
          onSubmitSuccess={handleExamSubmitSuccess}
        />
        <ExtensionSimulatorBar
          activeSessionId={activeSession.id}
          onTriggerEvent={handleSimulatorEvent}
        />
      </div>
    );
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
        extensionActive={true}
      />

      <main className="flex-1">
        {/* Student Views */}
        {currentTab === 'student-exams' && (
          <StudentDashboard
            onSelectExam={handleSelectExamForInstructions}
            onViewResult={(sess) => {
              setCompletedSession(sess);
              setCurrentTab('exam-result');
            }}
          />
        )}

        {currentTab === 'exam-instructions' && selectedExam && (
          <ExamInstructions
            exam={selectedExam}
            onBack={() => setCurrentTab('student-exams')}
            onStartExam={handleStartExamSession}
          />
        )}

        {currentTab === 'exam-result' && completedSession && (
          <ExamResult
            session={completedSession}
            onReturnDashboard={() => {
              setCompletedSession(null);
              setCurrentTab('student-exams');
            }}
          />
        )}

        {/* Examiner Views */}
        {currentTab === 'examiner-dashboard' && (
          <ExaminerDashboard
            onSelectSession={handleSelectSessionForInspection}
            onCreateExam={() => setShowCreateExamModal(true)}
          />
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
        {currentTab === 'extension-hub' && <ExtensionHub />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">SmartExam AI</span>
            <span>·</span>
            <span>ED-02 AI-Based Exam Malpractice Detection</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Behavioral Biometrics Protocol</span>
            <span>·</span>
            <span>Zero Webcam Surveillance</span>
            <span>·</span>
            <span>Manifest V3</span>
          </div>
        </div>
      </footer>

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
