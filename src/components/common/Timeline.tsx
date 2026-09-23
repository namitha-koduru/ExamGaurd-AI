import React from 'react';
import { BehaviorEvent } from '../../types';
import {
  EyeOff,
  Eye,
  Copy,
  ClipboardCheck,
  Keyboard,
  MousePointer,
  HelpCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface TimelineProps {
  events: BehaviorEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs">
        No behavioral events recorded for this session yet.
      </div>
    );
  }

  const formatRelTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEventIconAndStyle = (type: string) => {
    switch (type) {
      case 'TAB_FOCUS_LOST':
      case 'WINDOW_BLUR':
        return {
          icon: <EyeOff className="w-3.5 h-3.5 text-amber-500" />,
          label: 'Focus Lost (Window Blur)',
          color: 'text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'TAB_FOCUS_RETURNED':
      case 'WINDOW_FOCUS':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Focus Returned',
          color: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-400',
        };
      case 'COPY_ATTEMPT':
        return {
          icon: <Copy className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Copy Attempt',
          color: 'text-rose-700 dark:text-rose-400',
          dot: 'bg-rose-500',
        };
      case 'PASTE_ATTEMPT':
        return {
          icon: <ClipboardCheck className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Paste Attempt',
          color: 'text-rose-700 dark:text-rose-400',
          dot: 'bg-rose-500',
        };
      case 'KEYBOARD_ACTIVITY':
        return {
          icon: <Keyboard className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Typing Dynamics Sample',
          color: 'text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-400',
        };
      case 'MOUSE_ACTIVITY':
        return {
          icon: <MousePointer className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Mouse Movement Dynamics',
          color: 'text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-400',
        };
      case 'QUESTION_CHANGED':
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-blue-500" />,
          label: 'Question Transition',
          color: 'text-blue-700 dark:text-blue-400',
          dot: 'bg-blue-400',
        };
      case 'ANSWER_SUBMITTED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Answer Recorded',
          color: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-500',
        };
      case 'IDLE_STARTED':
      case 'IDLE_ENDED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
          label: type === 'IDLE_STARTED' ? 'Inactivity Period Started' : 'Inactivity Resumed',
          color: 'text-slate-600 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
      default:
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />,
          label: type,
          color: 'text-slate-600 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {events.map((ev, idx) => {
        const meta = getEventIconAndStyle(ev.eventType);
        return (
          <div key={ev.id || idx} className="relative flex items-start gap-3 text-xs">
            <span
              className={`absolute -left-6 top-1.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${meta.dot}`}
              aria-hidden="true"
            />
            <div className="w-14 shrink-0 font-mono text-[11px] text-slate-400 pt-0.5">
              {formatRelTime(ev.relativeSeconds || 0)}
            </div>

            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-md p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-medium">
                  {meta.icon}
                  <span className={meta.color}>{meta.label}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Event Metadata */}
              {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                  {ev.metadata.durationMs !== undefined && (
                    <span>Duration: {(ev.metadata.durationMs / 1000).toFixed(1)}s</span>
                  )}
                  {ev.metadata.charCount !== undefined && (
                    <span>Characters: {ev.metadata.charCount}</span>
                  )}
                  {ev.metadata.questionIndex !== undefined && (
                    <span>Question: #{ev.metadata.questionIndex + 1}</span>
                  )}
                  {ev.metadata.speedWpm !== undefined && (
                    <span>Typing Speed: {ev.metadata.speedWpm} WPM</span>
                  )}
                  {ev.metadata.mouseIntensity !== undefined && (
                    <span>Motion Index: {ev.metadata.mouseIntensity}/100</span>
                  )}
                  {ev.metadata.context && <span>Context: {ev.metadata.context}</span>}
                  {ev.metadata.reason && <span>Source: {ev.metadata.reason}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
