import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Activity, BookOpen, BarChart3, Lock, Chrome, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  extensionActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, extensionActive = false }) => {
  const { user, switchUserRole } = useAuth();
  const [extDetected, setExtDetected] = useState(extensionActive);

  useEffect(() => {
    // Check if extension is present in window
    if ((window as any).__SMARTEXAM_EXTENSION_ACTIVE__) {
      setExtDetected(true);
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SMARTEXAM_EXTENSION_READY') {
        setExtDetected(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const isExaminer = user?.role === 'EXAMINER' || user?.role === 'ADMIN';

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
      {/* Top Evaluation & Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-[11px] font-semibold tracking-wide">ED-02 PROJECT</span>
          <span className="text-slate-600">·</span>
          <span>Privacy-Preserving Behavioral Anomaly Detection</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Zero Webcam · Zero Audio</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">Role Switcher:</span>
          <div className="inline-flex rounded border border-slate-700 bg-slate-800 p-0.5 text-[11px]">
            <button
              onClick={() => switchUserRole('STUDENT')}
              className={`px-2 py-0.5 rounded transition-colors ${
                user?.role === 'STUDENT'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Student (Alex)
            </button>
            <button
              onClick={() => switchUserRole('EXAMINER')}
              className={`px-2 py-0.5 rounded transition-colors ${
                user?.role === 'EXAMINER'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Examiner (Dr. Elena)
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab(isExaminer ? 'examiner-dashboard' : 'student-exams')}>
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              SE
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SmartExam AI
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded border border-slate-300 dark:border-slate-700 text-slate-500 font-normal">
                  v1.2
                </span>
              </div>
              <div className="text-[11px] text-slate-500 -mt-0.5">Behavioral Biometrics Platform</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {!isExaminer ? (
              <>
                <button
                  onClick={() => onSelectTab('student-exams')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'student-exams'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Available Examinations
                </button>
                <button
                  onClick={() => onSelectTab('extension-hub')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'extension-hub'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Chrome className="w-3.5 h-3.5" />
                  Browser Extension
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('examiner-dashboard')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'examiner-dashboard' || currentTab === 'session-detail'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Live Proctor Dashboard
                </button>
                <button
                  onClick={() => onSelectTab('analytics')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'analytics'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Cohort Analytics
                </button>
                <button
                  onClick={() => onSelectTab('extension-hub')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'extension-hub'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Chrome className="w-3.5 h-3.5" />
                  Extension Package
                </button>
              </>
            )}

            <button
              onClick={() => onSelectTab('privacy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'privacy'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Privacy Charter
            </button>
          </nav>

          {/* Right Status & User info */}
          <div className="flex items-center gap-3">
            {/* Extension Sensor Status */}
            <div
              onClick={() => onSelectTab('extension-hub')}
              className="flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300"
              title={extDetected ? 'SmartExam Chrome Extension sensor connected' : 'Click to inspect or toggle extension sensor'}
            >
              <span className={`w-2 h-2 rounded-full ${extDetected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                {extDetected ? 'Extension Active' : 'Extension Ready'}
              </span>
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-right">
                <div className="font-medium text-slate-900 dark:text-white leading-tight">{user?.name}</div>
                <div className="text-[10px] text-slate-500">{user?.role}</div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-200">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
