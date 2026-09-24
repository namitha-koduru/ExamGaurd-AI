/**
 * ExamGuard AI - Official Institutional Home Page
 * Institutional Examination Platform & Behavioral Intelligence
 * Professional, Dignified Academic Integrity Platform
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo, LogoIcon } from '../components/common/Logo';
import {
  ShieldCheck,
  Lock,
  Activity,
  Cpu,
  EyeOff,
  Clock,
  Code2,
  FileCheck2,
  ArrowRight,
  CheckCircle2,
  Key,
  Layers,
  Award,
  Users,
  Building2,
  ChevronRight,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 pt-14 pb-18 md:pt-20 md:pb-24">
        {/* Ambient subtle background glow */}
        <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Brief and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping"></span>
                <span>Institutional Examination Platform · Multi-Tenant Architecture</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Continuous Behavioral Biometrics for Academic Integrity
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                ExamGuard AI is an institutional examination platform that enables educational organizations to create, schedule, conduct, evaluate, and monitor secure online examinations with privacy-conscious behavioral intelligence.
              </p>

              {/* Primary Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <button
                    onClick={() =>
                      onNavigate(user.role === 'STUDENT' ? 'student-exams' : 'examiner-dashboard')
                    }
                    className="py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Go to My Dashboard ({user.role === 'STUDENT' ? 'Student Portal' : 'Examiner Console'})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigate('login')}
                      className="py-3 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>Sign In to Institutional Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onNavigate('register')}
                      className="py-3 px-6 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
                    >
                      Create Account
                    </button>
                  </>
                )}

                <button
                  onClick={() => onNavigate('privacy')}
                  className="py-3 px-4 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>Privacy & Non-Invasive Charter</span>
                </button>
              </div>

              {/* Institutional Trust Indicators */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Zero Webcam / Audio Recording</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>In-Process Isolation Forest AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Single-Attempt Deadline Enforcement</span>
                </div>
              </div>
            </div>

            {/* Right Column: Innovative ExamGuard AI Emblem & Real-Time Integrity Shield Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-white border border-slate-800 shadow-2xl overflow-hidden">
                {/* Orbital scan rings backdrop */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-600/10 blur-xl pointer-events-none" />

                {/* Header of the Card */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Behavioral Sentinel
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                    V3.2 Active
                  </span>
                </div>

                {/* Central Emblem Showcase */}
                <div className="relative py-4 flex flex-col items-center justify-center text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                    {/* Concentric SVG radar */}
                    <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '14s' }} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.4" />
                    </svg>
                    <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '9s', animationDirection: 'reverse' }} viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="3 5" fill="none" opacity="0.35" />
                    </svg>

                    <div className="relative z-10 drop-shadow-xl">
                      <LogoIcon size={64} animate />
                    </div>
                  </div>

                  <h4 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    ExamGuard AI
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold uppercase">Security Core</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Non-invasive behavioral anomaly detection & institutional examination firewall
                  </p>
                </div>

                {/* Live Micro Status Chips */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">ENCLAVE INTEGRITY</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Continuous Active
                    </span>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">DATA ISOLATION</span>
                    <span className="text-indigo-400 font-semibold">Tenant-Scoped</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Architecture Section */}
      <section className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dual Stakeholder Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for Rigorous Institutional Operations
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              A synchronized platform connecting faculty examination oversight with an unhindered, ethical candidate experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Examiner Portal Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-6 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Faculty & Test Centers
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  Examiner Command Center
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Complete authority to design multi-format papers, lock availability windows, and audit candidate submissions with forensic telemetry.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Multi-Format Questions:</strong> Add MCQs, coding challenges with custom test cases, and descriptive essays.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Time-Locked Publication:</strong> Define start time, deadline, and individual candidate duration.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Automatic Key Generation:</strong> Creates unique access keys (e.g. <code>A7K9-XP2</code>) to share with students.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Live Telemetry & Audits:</strong> Real-time risk attribution, biometric baseline comparisons, and automated rubric scoring.</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate(user?.role === 'EXAMINER' ? 'examiner-dashboard' : 'login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Access Examiner Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Portal Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-6 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Candidates & Students
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  Student Examination Portal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  A dignified, private, stress-free testing experience with authoritative timers, autosaving, and transparent post-exam evaluation.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Key-Protected Entrance:</strong> Enter the instructor's code to unlock the official examination paper.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Strict Single Attempt:</strong> Enforces one attempt per student within the scheduled deadline.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Integrated Code Runner:</strong> In-browser sandboxed runtime to execute and test code in real time.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Results:</strong> Immediate score breakdown and non-invasive behavioral report upon submission.</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate(user?.role === 'STUDENT' ? 'student-exams' : 'login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Enter Student Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Examination Lifecycle Diagram */}
      <section className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Protocol Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              The ExamGuard AI End-to-End Cycle
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              How the platform secures examinations and guarantees institutional standards from paper creation to score delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                <span>PHASE 01</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Configure & Publish
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Examiner compiles questions, locks duration, and sets availability window (Start & End dates).
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                <span>PHASE 02</span>
                <Key className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Key Validation & Start
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Candidate inputs the teacher's secret access key. Server validates deadline and single-attempt eligibility.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                <span>PHASE 03</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Continuous Telemetry
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Client evaluates focus continuity, typing variance, and clipboard events. Anomaly engine scores live risk.
              </p>
            </div>

            {/* Step 4 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                <span>PHASE 04</span>
                <Award className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Grading & Forensics
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                System evaluates MCQ, executes coding test cases, grades responses, and renders full forensic audit report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Charter Callout */}
      <section className="py-14 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Ethical Proctoring Standard
            </span>
            <h3 className="text-2xl font-bold">
              Detect Behavior, Not the Individual
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Traditional proctoring software captures continuous biometric imagery, intrusive eye-tracking, and ambient audio, violating student privacy. ExamGuard AI proves that academic integrity can be safeguarded using clean interaction mathematics alone.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('privacy')}
              className="py-3 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
            >
              Read Institutional Privacy Charter
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="py-3 px-5 rounded-lg border border-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={28} subtitle={false} />
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[11px] text-slate-500">Institutional Examination & Integrity Standard</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('home')} className="hover:text-slate-900 dark:hover:text-white">
              Home
            </button>
            <button onClick={() => onNavigate('privacy')} className="hover:text-slate-900 dark:hover:text-white">
              Privacy Charter
            </button>
            <button onClick={() => onNavigate('login')} className="hover:text-slate-900 dark:hover:text-white">
              Sign In
            </button>
            <button onClick={() => onNavigate('register')} className="hover:text-slate-900 dark:hover:text-white">
              Register
            </button>
          </div>

          <div>
            <span>Official Institutional Release · All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
