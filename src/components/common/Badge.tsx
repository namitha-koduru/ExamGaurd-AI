import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = true }) => {
  let dotColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700 dark:text-emerald-400';
  let label = 'Normal';

  if (level === 'LOW_CONCERN') {
    dotColor = 'bg-blue-500';
    textColor = 'text-blue-700 dark:text-blue-400';
    label = 'Low Concern';
  } else if (level === 'REVIEW') {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-800 dark:text-amber-300';
    label = 'Review Recommended';
  } else if (level === 'HIGH_ANOMALY') {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-700 dark:text-rose-400';
    label = 'High Anomaly';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="text-slate-400 font-normal">({score})</span>
      )}
    </div>
  );
};

export const StatusBadge: React.FC<{ status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'UPCOMING' | 'REVIEWED' | 'FLAGGED' | 'UNREVIEWED' | 'COMPLETED' | string }> = ({ status }) => {
  let dotColor = 'bg-slate-400';
  let text = status as string;
  let textColor = 'text-slate-600 dark:text-slate-300';

  if (status === 'ACTIVE') {
    dotColor = 'bg-emerald-500 animate-pulse';
    textColor = 'text-emerald-700 dark:text-emerald-400';
    text = 'In Progress';
  } else if (status === 'SUBMITTED' || status === 'REVIEWED' || status === 'COMPLETED') {
    dotColor = 'bg-slate-400';
    textColor = 'text-slate-700 dark:text-slate-300';
    text = status === 'REVIEWED' ? 'Reviewed' : status === 'COMPLETED' ? 'Completed' : 'Submitted';
  } else if (status === 'FLAGGED') {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-700 dark:text-rose-400';
    text = 'Flagged';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
};
