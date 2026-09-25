/**
 * ExamGuard AI - Coding Question Workspace
 * Monaco Editor integration with multi-language execution and behavioral telemetry
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Question, TestCase } from '../../types';
import { api } from '../../services/api';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  AlertTriangle,
  Code2,
  FileCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface CodeWorkspaceProps {
  question: Question;
  sessionId: string;
  savedAnswer?: {
    code?: string;
    language?: string;
    passedTests?: number;
    totalTests?: number;
    status?: string;
  };
  onAnswerChange: (answer: {
    code: string;
    language: string;
    passedTests?: number;
    totalTests?: number;
    status?: string;
  }) => void;
  onTelemetryEvent: (eventType: string, metadata?: Record<string, any>) => void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  question,
  sessionId,
  savedAnswer,
  onAnswerChange,
  onTelemetryEvent,
}) => {
  const allowedLanguages = question.allowedLanguages || ['javascript', 'python', 'typescript', 'c', 'cpp', 'java'];
  const [language, setLanguage] = useState<string>(
    savedAnswer?.language || allowedLanguages[0] || 'javascript'
  );

  const getInitialCode = (lang: string) => {
    if (savedAnswer?.code) return savedAnswer.code;
    if (question.starterCode && question.starterCode[lang]) {
      return question.starterCode[lang];
    }
    if (lang === 'python') {
      return '# Write your solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
    }
    return '// Write your solution here\nfunction solve(input) {\n  return "";\n}\n';
  };

  const [code, setCode] = useState<string>(getInitialCode(language));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');
  const [runResult, setRunResult] = useState<{
    status: string;
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    compilerOutput?: string;
    runtimeOutput?: string;
    testResults?: any[];
  } | null>(null);

  const lastCodeLen = useRef<number>(code.length);
  const lastEditTime = useRef<number>(Date.now());

  useEffect(() => {
    if (savedAnswer?.code) {
      setCode(savedAnswer.code);
    } else {
      setCode(getInitialCode(language));
    }
  }, [question.id]);

  const handleEditorChange = (value: string | undefined) => {
    const currentCode = value || '';
    const lengthDelta = currentCode.length - lastCodeLen.current;
    const now = Date.now();
    const editGap = (now - lastEditTime.current) / 1000;

    // Detect large sudden code insertions (> 80 characters within < 1 second)
    if (lengthDelta > 80 && editGap < 1.5) {
      onTelemetryEvent('LARGE_CODE_INSERTION', {
        questionId: question.id,
        insertedLength: lengthDelta,
        language,
      });
    } else {
      onTelemetryEvent('CODE_EDIT_ACTIVITY', {
        questionId: question.id,
        codeLength: currentCode.length,
        language,
      });
    }

    lastCodeLen.current = currentCode.length;
    lastEditTime.current = now;
    setCode(currentCode);

    onAnswerChange({
      code: currentCode,
      language,
      passedTests: runResult?.passedTests,
      totalTests: runResult?.totalTests,
      status: runResult?.status,
    });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const newStarter = getInitialCode(newLang);
    setCode(newStarter);
    onAnswerChange({
      code: newStarter,
      language: newLang,
    });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('tests');
    try {
      const result = await api.runCode({
        code,
        language,
        questionId: question.id,
        sessionId,
      });
      setRunResult(result);
      onAnswerChange({
        code,
        language,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        status: result.status,
      });
      onTelemetryEvent('CODE_RUN', {
        questionId: question.id,
        language,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        compileStatus: result.status,
      });
    } catch (err) {
      console.error('Run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetStarter = () => {
    const starter = getInitialCode(language);
    setCode(starter);
    onAnswerChange({ code: starter, language });
  };

  // Map language to Monaco language identifier
  const getMonacoLang = (lang: string) => {
    if (lang === 'js') return 'javascript';
    if (lang === 'py') return 'python';
    if (lang === 'ts') return 'typescript';
    if (lang === 'c' || lang === 'cpp') return 'cpp';
    return lang;
  };

  return (
    <div className="space-y-4">
      {/* Problem Statement & Specs */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-xs space-y-3">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Problem Description</h4>
          <p className="mt-1 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {question.problemStatement || question.questionText}
          </p>
        </div>

        {question.constraints && (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Constraints:</span>
            <pre className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              {question.constraints}
            </pre>
          </div>
        )}

        {question.examples && question.examples.length > 0 && (
          <div className="space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white">Sample Examples:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1"
                >
                  <div className="text-slate-400 font-sans font-semibold">Example {idx + 1}</div>
                  <div>
                    <span className="text-slate-500">Input: </span>
                    <span className="text-slate-800 dark:text-slate-200">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Output: </span>
                    <span className="text-emerald-600 dark:text-emerald-400">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="text-slate-400 font-sans text-[10px]">{ex.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Header Bar */}
      <div className="bg-slate-900 text-white rounded-t-lg px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Code Editor</span>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-[11px] rounded px-2 py-1 pr-6 cursor-pointer focus:outline-hidden"
            >
              {allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetStarter}
            title="Reset to starter template"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-lg overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="320px"
          language={getMonacoLang(language)}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          onMount={(editor, monaco) => {
            editor.onKeyDown((e) => {
              if (
                (e.ctrlKey || e.metaKey) &&
                (e.keyCode === monaco.KeyCode.KeyV ||
                  e.keyCode === monaco.KeyCode.KeyC ||
                  e.keyCode === monaco.KeyCode.KeyX)
              ) {
                e.preventDefault();
                e.stopPropagation();
                onTelemetryEvent(
                  e.keyCode === monaco.KeyCode.KeyV
                    ? 'PASTE_BLOCKED'
                    : e.keyCode === monaco.KeyCode.KeyC
                    ? 'COPY_BLOCKED'
                    : 'CUT_BLOCKED',
                  { questionId: question.id }
                );
              }
            });

            const domNode = editor.getDomNode();
            if (domNode) {
              domNode.addEventListener(
                'paste',
                (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTelemetryEvent('PASTE_BLOCKED', { questionId: question.id });
                },
                true
              );
              domNode.addEventListener(
                'copy',
                (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTelemetryEvent('COPY_BLOCKED', { questionId: question.id });
                },
                true
              );
              domNode.addEventListener(
                'cut',
                (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTelemetryEvent('CUT_BLOCKED', { questionId: question.id });
                },
                true
              );
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            contextmenu: false,
          }}
        />
      </div>

      {/* Execution Results & Console Output */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Test Results</span>
            {runResult && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  runResult.status === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {runResult.passedTests}/{runResult.totalTests} Passed
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`py-2 px-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Compiler / Console Output</span>
          </button>
        </div>

        <div className="p-4 text-xs">
          {activeTab === 'tests' ? (
            runResult?.testResults && runResult.testResults.length > 0 ? (
              <div className="space-y-2.5">
                {runResult.testResults.map((tc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border text-xs ${
                      tc.passed
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                        : 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        {tc.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>
                          Test Case {idx + 1} {tc.hidden ? '(Hidden)' : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tc.executionTimeMs || 0}ms
                      </span>
                    </div>

                    {!tc.hidden && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 text-slate-700 dark:text-slate-300">
                        <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400">Input: </span>
                          <span>{tc.input}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400">Expected: </span>
                          <span className="text-emerald-600">{tc.expectedOutput}</span>
                        </div>
                        <div className="col-span-2 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400">Actual Output: </span>
                          <span className={tc.passed ? 'text-emerald-600' : 'text-rose-600'}>
                            {tc.actualOutput || '(no output)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                Click "Run Tests" to execute your solution against the validation suite.
              </div>
            )
          ) : (
            <pre className="font-mono text-[11px] bg-slate-950 text-slate-200 p-3 rounded overflow-x-auto min-h-[80px]">
              {runResult?.compilerOutput || runResult?.runtimeOutput || 'No output stream logged yet.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
