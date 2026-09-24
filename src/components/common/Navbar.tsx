/**
 * ExamGuard AI - Official Institutional Top Navigation Bar
 * Professional, Dignified Header with Real Auth State Management
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';
import {
  ShieldCheck,
  Activity,
  BookOpen,
  BarChart3,
  LogOut,
  User as UserIcon,
  Shield,
  FileCheck2,
  Lock,
  ChevronRight,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const isExaminer = user?.role === 'EXAMINER' || user?.role === 'ADMIN';

  const handleSignOut = () => {
    logout();
    onSelectTab('home');
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
      {/* Institutional Compliance Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-slate-800 font-sans">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-[10px] font-bold tracking-wide uppercase">
            MULTI-TENANT INTEGRITY ARCHITECTURE
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-slate-300">
            ExamGuard AI Institutional Platform
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Non-Invasive Behavioral Biometrics
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-400 hidden md:inline">Continuous Telemetry Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
      </div>

      {/* Main Institutional Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo & Name */}
          <div
            className="cursor-pointer select-none"
            onClick={() => onSelectTab(user ? (isExaminer ? 'examiner-dashboard' : 'student-exams') : 'home')}
          >
            <Logo size={32} subtitle="Academic Integrity & Anomaly Engine" />
          </div>

          {/* Active Institution Badge */}
          {user?.institutionName && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.institutionName}</span>
              {user.institutionRegistrationId && (
                <span className="text-[10px] font-mono text-slate-500">[{user.institutionRegistrationId}]</span>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <button
                  onClick={() => onSelectTab('home')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    currentTab === 'home'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => onSelectTab('privacy')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    currentTab === 'privacy'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Privacy & Ethics Charter
                </button>
              </>
            ) : !isExaminer ? (
              // Student navigation
              <>
                <button
                  onClick={() => onSelectTab('student-exams')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'student-exams'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Available Examinations
                </button>
                <button
                  onClick={() => onSelectTab('privacy')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'privacy'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Student Privacy Charter
                </button>
              </>
            ) : (
              // Examiner navigation
              <>
                <button
                  onClick={() => onSelectTab('examiner-dashboard')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'examiner-dashboard' || currentTab === 'session-detail'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Examiner Command Center
                </button>
                <button
                  onClick={() => onSelectTab('analytics')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'analytics'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Integrity Analytics
                </button>
                <button
                  onClick={() => onSelectTab('privacy')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    currentTab === 'privacy'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Compliance Charter
                </button>
              </>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('login')}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onSelectTab('register')}
                  className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* User Info Badge */}
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {user.role === 'EXAMINER' ? 'Faculty Instructor' : 'Candidate'}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  title="Sign Out of Institutional Account"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
