/**
 * ExamGuard AI - Innovative Institutional Loading Experience
 * High-tech behavioral telemetry calibration, animated biometric scan rings,
 * dynamic phase tickers, and cryptographic integrity verifications.
 */

import React, { useState, useEffect } from 'react';
import { LogoIcon } from './Logo';
import { Shield, ShieldCheck, Activity, Cpu, Lock, CheckCircle2, Sparkles } from 'lucide-react';

export interface LoadingScreenProps {
  mode?: 'fullscreen' | 'inline' | 'overlay' | 'compact';
  title?: string;
  subtitle?: string;
  phases?: string[];
  durationMs?: number;
  className?: string;
}

const DEFAULT_PHASES = [
  'Calibrating non-invasive behavioral biometrics engine...',
  'Verifying institutional multi-tenant isolation boundaries...',
  'Synchronizing tamper-evident keystroke & focus telemetry...',
  'Cryptographic integrity checks nominal • System armed',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  mode = 'fullscreen',
  title = 'Initializing ExamGuard AI',
  subtitle = 'Institutional Academic Integrity & Behavioral Intelligence Platform',
  phases = DEFAULT_PHASES,
  durationMs,
  className = '',
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(18);

  useEffect(() => {
    // Cycle through phases smoothly
    const intervalTime = 950;
    const phaseInterval = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % phases.length);
    }, intervalTime);

    // Progress bar incremental advancement
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96;
        const jump = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + jump, 96);
      });
    }, 320);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [phases.length]);

  // COMPACT LOADER (for buttons, mini cards)
  if (mode === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 ${className}`}>
        <div className="relative w-5 h-5 flex items-center justify-center">
          <svg className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 animate-pulse">
          {phases[currentPhaseIndex] || 'Processing...'}
        </span>
      </div>
    );
  }

  // INLINE LOADER (for page sections, tables, card loading)
  if (mode === 'inline') {
    return (
      <div className={`w-full py-16 px-4 flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Orbital Ring & Shield Center */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-5">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/15 dark:bg-indigo-500/25 blur-xl animate-pulse" />

          {/* Outer Dashed Orbit */}
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '9s' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              className="text-indigo-400/40 dark:text-indigo-500/30"
              strokeWidth="2.5"
              strokeDasharray="8 8"
              fill="none"
            />
          </svg>

          {/* Inner Counter Orbit */}
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="36"
              stroke="currentColor"
              className="text-cyan-400/40 dark:text-cyan-400/30"
              strokeWidth="1.8"
              strokeDasharray="4 6"
              fill="none"
            />
          </svg>

          {/* Central Animated Logo */}
          <div className="relative z-10 p-1.5 transition-transform flex items-center justify-center">
            <LogoIcon size={40} animate preferImage={true} />
          </div>
        </div>

        {/* Status Phase */}
        <div className="max-w-md space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              {phases[currentPhaseIndex]}
            </p>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-56 mx-auto h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.2">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // FULLSCREEN / OVERLAY LOADER (The flagship innovative & neat loading experience)
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none bg-slate-950 text-slate-100 overflow-hidden font-sans ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 40%, rgba(79, 70, 229, 0.18) 0%, transparent 65%),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
          radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 28px 28px',
      }}
    >
      {/* Top Telemetry Header Ribbon */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-indigo-400 font-bold tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5" />
            ExamGuard AI
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hidden sm:inline">Verification & Telemetry Runtime</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SECURE ENCLAVE ACTIVE
          </span>
          <span className="font-mono text-slate-400 hidden md:inline">TLS 1.3 / AES-256</span>
        </div>
      </div>

      {/* Main Innovative Visual Core */}
      <div className="relative flex flex-col items-center max-w-lg w-full text-center px-4">
        {/* Multilayer Biometric Radar & Shield Hub */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-8">
          {/* Radiant Backglow Halo */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-indigo-600/30 via-cyan-500/25 to-emerald-500/20 blur-2xl animate-pulse" />

          {/* Outer Rotating Measurement Ring (Clockwise) */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '16s' }}
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r="74"
              stroke="rgba(99, 102, 241, 0.25)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="74"
              stroke="#6366F1"
              strokeWidth="2.5"
              strokeDasharray="16 32 8 24"
              fill="none"
            />
            {/* Cardinal Satellite Nodes */}
            <circle cx="80" cy="6" r="3" fill="#38BDF8" />
            <circle cx="154" cy="80" r="2.5" fill="#818CF8" />
            <circle cx="80" cy="154" r="3" fill="#10B981" />
            <circle cx="6" cy="80" r="2.5" fill="#818CF8" />
          </svg>

          {/* Middle Biometric Tick Ring (Counter-Clockwise) */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '10s', animationDirection: 'reverse' }}
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r="62"
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth="1.8"
              strokeDasharray="4 8"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="52"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Sweeping Laser Scanline Effect */}
          <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none flex items-center justify-center">
            <div
              className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 blur-[0.5px] animate-pulse"
              style={{
                position: 'absolute',
                animation: 'scanline 2.4s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* Central Institutional Shield Logo */}
          <div className="relative z-10 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-2xl backdrop-blur-md flex items-center justify-center">
            <LogoIcon size={64} animate preferImage={true} />
          </div>
        </div>

        {/* Title & Institutional Tag */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXAMGUARD AI VERIFICATION ENGINE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Phase Step Ticker & Neat Shimmer Progress */}
        <div className="w-full max-w-md space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-xl backdrop-blur-xs">
          {/* Live Dynamic Phase Text */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-left truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-slate-200 font-medium truncate">
                {phases[currentPhaseIndex]}
              </span>
            </div>
            <span className="text-cyan-400 font-bold shrink-0">
              {progress}%
            </span>
          </div>

          {/* Precision Gradient Progress Bar */}
          <div className="relative w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Traveling Shimmer Spark */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
                style={{
                  animationDuration: '1.5s',
                }}
              />
            </div>
          </div>

          {/* Micro Telemetry Indicators */}
          <div className="pt-1.5 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 justify-center">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Multi-Tenant</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Non-Invasive</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>Telemetry Core</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Institutional Assurance Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2">
          <span>Privacy Assured: No camera footage, ambient audio, or biometric biometric imagery stored.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Status: CALIBRATING</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Global CSS Keyframes for the scanline */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-50px); opacity: 0.2; }
          50% { opacity: 0.9; }
          100% { transform: translateY(50px); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
