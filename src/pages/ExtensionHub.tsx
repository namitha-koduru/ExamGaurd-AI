import React, { useState } from 'react';
import { Chrome, Shield, Check, Copy, Terminal, ExternalLink, Activity, Info } from 'lucide-react';

export const ExtensionHub: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const manifestJsonString = JSON.stringify(
    {
      manifest_version: 3,
      name: 'SmartExam AI Monitor',
      version: '1.2.0',
      description: 'Privacy-preserving behavioral interaction sensor for secure online examinations.',
      permissions: ['activeTab', 'storage'],
      host_permissions: ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'],
      action: {
        default_popup: 'src/popup/popup.html',
        default_title: 'SmartExam AI Monitor Status',
      },
      background: {
        service_worker: 'src/background/service-worker.js',
      },
      content_scripts: [
        {
          matches: ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'],
          js: ['src/content/exam-monitor.js'],
          run_at: 'document_idle',
        },
      ],
    },
    null,
    2
  );

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium mb-3">
          <Chrome className="w-3.5 h-3.5 text-emerald-500" />
          <span>Chrome Extension Manifest V3</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          SmartExam AI Browser Extension Package
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          The SmartExam client extension acts as a lightweight, non-invasive telemetry sensor that measures client-side
          interaction physics without accessing webcam, microphone, or unrelated browser tabs.
        </p>
      </div>

      {/* Installation Steps in Chrome */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span>How to Load Unpacked in Chrome Developer Mode</span>
        </h2>

        <ol className="space-y-3 pl-4 list-decimal text-slate-600 dark:text-slate-300">
          <li className="leading-relaxed">
            Open Google Chrome and navigate to <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">chrome://extensions</code>.
          </li>
          <li className="leading-relaxed">
            Toggle on <strong>Developer mode</strong> in the top-right corner of the Chrome extensions page.
          </li>
          <li className="leading-relaxed">
            Click the <strong>Load unpacked</strong> button in the top-left toolbar.
          </li>
          <li className="leading-relaxed">
            Select the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">/extension</code> directory from this project workspace.
          </li>
          <li className="leading-relaxed">
            The <strong>SmartExam AI Monitor</strong> extension icon will appear in your Chrome toolbar and immediately attach to examination tabs!
          </li>
        </ol>
      </div>

      {/* Manifest V3 Inspector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>extension/manifest.json (Verified Manifest V3)</span>
          </div>

          <button
            onClick={handleCopyManifest}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Manifest'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-md bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
          {manifestJsonString}
        </pre>
      </div>

      {/* Permissions Transparency */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-lg p-5 text-xs space-y-3">
        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Permissions Audit: Principle of Least Privilege</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
          <div className="p-3 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">activeTab</div>
            <div className="text-slate-500 mt-0.5">
              Limits telemetry inspection strictly to the currently focused examination tab. No access to other browser tabs or history.
            </div>
          </div>

          <div className="p-3 rounded bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">storage</div>
            <div className="text-slate-500 mt-0.5">
              Allows caching session handshake tokens and temporary offline queue in case of network drops.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
