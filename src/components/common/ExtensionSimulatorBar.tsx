import React, { useState } from 'react';
import { Chrome, Activity, Copy, EyeOff, FastForward, Clock, Minimize2, Maximize2 } from 'lucide-react';

interface ExtensionSimulatorBarProps {
  activeSessionId?: string | null;
  onTriggerEvent?: (eventType: string, metadata?: Record<string, any>) => void;
}

export const ExtensionSimulatorBar: React.FC<ExtensionSimulatorBarProps> = ({
  activeSessionId,
  onTriggerEvent,
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  const trigger = (type: string, meta: Record<string, any>, label: string) => {
    if (onTriggerEvent) {
      onTriggerEvent(type, meta);
      setRecentNotification(`Dispatched: ${label}`);
      setTimeout(() => setRecentNotification(null), 2500);
    }
  };

  if (!activeSessionId) return null;

  return (
    <aside aria-label="Extension Diagnostic Hub" className="fixed bottom-3 right-3 z-50 transition-all duration-200">
      <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-lg shadow-xl backdrop-blur-md overflow-hidden text-xs max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-1.5 font-medium">
            <Chrome className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extension Diagnostic Hub</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            title={minimized ? 'Expand Telemetry Controls' : 'Minimize'}
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!minimized && (
          <div className="p-3 space-y-2.5">
            <div className="text-[11px] text-slate-300">
              Active Exam Session: <span className="font-mono text-emerald-300">{activeSessionId.substring(0, 16)}...</span>
            </div>

            {recentNotification ? (
              <div className="p-1.5 rounded bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-300 font-mono">
                {recentNotification}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">
                Test telemetry injection (simulates browser extension events):
              </div>
            )}

            {/* Simulation Triggers */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  trigger('TAB_FOCUS_LOST', { reason: 'alt_tab' }, 'Tab Focus Lost (Window Blur)')
                }
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] transition-colors"
              >
                <EyeOff className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Alt-Tab Focus Loss</span>
              </button>

              <button
                onClick={() =>
                  trigger(
                    'TAB_FOCUS_RETURNED',
                    { durationMs: 4500, reason: 'user_return' },
                    'Tab Focus Returned (+4.5s)'
                  )
                }
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] transition-colors"
              >
                <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Return (4.5s blur)</span>
              </button>

              <button
                onClick={() =>
                  trigger(
                    'PASTE_ATTEMPT',
                    { charCount: 84, context: 'question-input' },
                    'External Paste Event (84 chars)'
                  )
                }
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] transition-colors"
              >
                <Copy className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Paste Attempt</span>
              </button>

              <button
                onClick={() =>
                  trigger(
                    'QUESTION_CHANGED',
                    { questionIndex: 6, rapidTransition: true },
                    'Rapid Question Skip'
                  )
                }
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left text-[11px] transition-colors"
              >
                <FastForward className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Erratic Skip (Q6)</span>
              </button>
            </div>

            <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-800 flex justify-between">
              <span>Non-invasive MV3 sensor</span>
              <span>Zero webcam / mic</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
