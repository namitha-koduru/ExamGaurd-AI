/**
 * ExamGuard AI - Official Brand Identity & Vector Emblem
 * High-precision SVG Logo with institutional geometry, biometric core, and multi-size variants
 */

import React from 'react';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'icon' | 'full' | 'compact' | 'badge' | 'hero';
  animate?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtitle?: string | boolean;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{
  size?: number | string;
  className?: string;
  animate?: boolean;
  preferImage?: boolean;
}> = ({ size = 36, className = '', animate = false, preferImage = true }) => {
  const pixelSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 36;
  const uniqueId = React.useId().replace(/:/g, '');
  const [imageError, setImageError] = React.useState(false);

  if (preferImage && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {animate && (
          <div
            className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md animate-ping"
            style={{ animationDuration: '3s' }}
          />
        )}
        <img
          src="/ExamGaurd.png"
          alt="ExamGuard AI"
          width={pixelSize}
          height={pixelSize}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 ${
            animate ? 'scale-105' : ''
          }`}
        />
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      className={`shrink-0 select-none ${className}`}
      aria-label="ExamGuard AI Emblem"
    >
      <defs>
        {/* Main Shield Gradient: Indigo -> Royal Blue -> Cyan */}
        <linearGradient
          id={`eg-shield-${uniqueId}`}
          x1="6"
          y1="4"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Faceted Shadow Half for 3D Architectural Depth */}
        <linearGradient
          id={`eg-facet-${uniqueId}`}
          x1="24"
          y1="4"
          x2="7"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#312E81" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.95" />
        </linearGradient>

        {/* AI Biometric Core Radiant Gradient */}
        <linearGradient
          id={`eg-core-${uniqueId}`}
          x1="18"
          y1="18"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Radial Glow */}
        <radialGradient
          id={`eg-glow-${uniqueId}`}
          cx="24"
          cy="23"
          r="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>

        {/* Drop Shadow for outer shield */}
        <filter id={`eg-shadow-${uniqueId}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#1E1B4B" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer Shield Geometry */}
      <path
        d="M24 3.5 L40.5 9.5 C40.5 24 33.5 37.5 24 44.5 C14.5 37.5 7.5 24 7.5 9.5 L24 3.5 Z"
        fill={`url(#eg-shield-${uniqueId})`}
        filter={`url(#eg-shadow-${uniqueId})`}
      />

      {/* Dark Faceted Half (Left Side Architectural Angle) */}
      <path
        d="M24 3.5 L7.5 9.5 C7.5 24 14.5 37.5 24 44.5 V3.5 Z"
        fill={`url(#eg-facet-${uniqueId})`}
      />

      {/* Interior Rim Highlight */}
      <path
        d="M24 6 L38 11.2 C38 23.5 31.8 35.2 24 41.5 C16.2 35.2 10 23.5 10 11.2 L24 6 Z"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Ambient Neural Core Glow */}
      <circle cx="24" cy="23" r="13" fill={`url(#eg-glow-${uniqueId})`} />

      {/* Concentric Biometric Radar Rings (Rotatable / Animated) */}
      <circle
        cx="24"
        cy="23"
        r="10.5"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        strokeDasharray="4 3"
        fill="none"
        className={animate ? 'animate-spin origin-center' : ''}
        style={{ transformOrigin: '24px 23px', animationDuration: '12s' }}
      />

      {/* Integrated Monogram & Guardian Circuitry:
          Upper "E" arm and Lower "G" chevron anchor */}
      {/* Upper "E" Circuit */}
      <path
        d="M17 15 H31 M17 15 V23 M17 23 H28"
        stroke="#FFFFFF"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower "G" Circuit */}
      <path
        d="M31 23 V31 C31 32 29.5 33 28 33 H19 C17.5 33 17 32 17 31 V28 M23 28 H31"
        stroke="#FFFFFF"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic AI Core Node (Vibrant Cyan / Emerald Pulsing Center) */}
      <circle
        cx="24"
        cy="23"
        r="3.2"
        fill={`url(#eg-core-${uniqueId})`}
        className={animate ? 'animate-ping origin-center opacity-75' : ''}
        style={{ transformOrigin: '24px 23px', animationDuration: '3s' }}
      />
      <circle cx="24" cy="23" r="3.2" fill={`url(#eg-core-${uniqueId})`} />
      <circle cx="24" cy="23" r="1.3" fill="#FFFFFF" />

      {/* Verification Sentinel Node (Top-Right Active Light) */}
      <circle cx="35" cy="12" r="1.8" fill="#10B981" />
      <circle cx="35" cy="12" r="0.8" fill="#FFFFFF" />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  animate = false,
  className = '',
  iconClassName = '',
  textClassName = '',
  subtitle,
  onClick,
}) => {
  // Map size tokens to pixel heights
  const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <LogoIcon size={pixelSize} className={iconClassName} animate={animate} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-900 border border-slate-700/80 shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <LogoIcon size={24} className={iconClassName} animate={animate} />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs text-white tracking-tight">ExamGuard</span>
            <span className="font-mono text-[9px] font-bold text-indigo-400 bg-indigo-950/80 px-1 py-0.2 rounded border border-indigo-700/50">
              AI
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Institutional Standard</span>
        </div>
      </div>
    );
  }

  // Default 'full' or 'compact'
  const defaultSubtitle = subtitle === undefined
    ? 'Institutional Examination Platform'
    : subtitle;

  return (
    <div
      className={`inline-flex items-center gap-3 ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <LogoIcon size={pixelSize} className={iconClassName} animate={animate} />
      </div>

      <div className={`flex flex-col leading-tight ${textClassName}`}>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg flex items-center gap-1">
            ExamGuard
            <span className="text-indigo-600 dark:text-indigo-400 font-black">AI</span>
          </span>

          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 uppercase tracking-wide">
            Institutional
          </span>
        </div>

        {defaultSubtitle && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
            {typeof defaultSubtitle === 'string' ? defaultSubtitle : 'Academic Integrity & Anomaly Engine'}
          </span>
        )}
      </div>
    </div>
  );
};
