/**
 * ExamGuard AI - Create & Publish Examination Modal
 * Supports mixed question formats (MCQ, Coding with Test Cases, Descriptive),
 * locked schedule (Start Time, End Time Deadline, Duration per student),
 * Paper Generation Preview, and Access Code Distribution.
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import { Exam, QuestionType } from '../../types';
import { generateExamCode } from '../../utils/codeGenerator';
import {
  Plus,
  Trash2,
  X,
  Code,
  FileText,
  ListChecks,
  Shield,
  Key,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Eye,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newExam: Exam) => void;
}

interface QuestionDraft {
  id?: string;
  questionType: QuestionType;
  title: string;
  questionText: string;
  marks: number;
  options: string[];
  correctAnswer: number;
  problemStatement?: string;
  constraints?: string;
  allowedLanguages?: string[];
  starterCode?: Record<string, string>;
  testCases?: { id?: string; input: string; expectedOutput: string; hidden: boolean }[];
  rubric?: string;
  minWords?: number;
  maxWords?: number;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState<'EDIT' | 'PREVIEW' | 'PUBLISHED'>('EDIT');

  // Exam Details
  const [title, setTitle] = useState('Operating Systems & Concurrency Finals');
  const [courseCode, setCourseCode] = useState('CS 350');
  const [description, setDescription] = useState('Final assessment covering concurrency, synchronization primitives, thread-safety, and critical section algorithms.');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Locked Schedule: Start Time & End Time
  const now = new Date();
  const formatForInput = (d: Date) => d.toISOString().slice(0, 16);
  const [startTime, setStartTime] = useState(formatForInput(now));
  const [endTime, setEndTime] = useState(formatForInput(new Date(Date.now() + 86400000 * 7)));

  // Custom or auto-generated Access Code
  const [customAccessCode, setCustomAccessCode] = useState('');
  const [publishedExam, setPublishedExam] = useState<Exam | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Behavioral & Integrity Settings
  const [fullscreenRequired, setFullscreenRequired] = useState(true);
  const [clipboardMonitoring, setClipboardMonitoring] = useState(true);
  const [typingDynamics, setTypingDynamics] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      questionType: 'MULTIPLE_CHOICE',
      title: 'Mutual Exclusion & Deadlock',
      questionText: 'Which of the following conditions is NOT one of Coffman’s four necessary conditions for deadlock?',
      options: [
        'Mutual Exclusion',
        'Hold and Wait',
        'Preemption Allowed',
        'Circular Wait',
      ],
      correctAnswer: 2,
      marks: 10,
    },
    {
      questionType: 'CODING',
      title: 'Bounded Buffer Producer-Consumer',
      questionText: 'Implement a thread-safe item buffer verification check that calculates remaining buffer capacity.',
      problemStatement: 'Given initial capacity C and a list of operations (P for produce, C for consume), print the final buffer count, or print "OVERFLOW" / "UNDERFLOW" if bounds are violated.',
      constraints: '1 <= initial capacity <= 1000, 1 <= operations <= 5000',
      allowedLanguages: ['javascript', 'python', 'typescript'],
      starterCode: {
        javascript: `function solve(input) {\n  const lines = input.trim().split('\\n');\n  const capacity = parseInt(lines[0], 10);\n  const ops = lines[1] ? lines[1].trim().split(' ') : [];\n  let count = 0;\n  for (const op of ops) {\n    if (op === 'P') {\n      count++;\n      if (count > capacity) return 'OVERFLOW';\n    } else if (op === 'C') {\n      count--;\n      if (count < 0) return 'UNDERFLOW';\n    }\n  }\n  return count;\n}\nconsole.log(solve(input));`,
        python: `def solve():\n    import sys\n    lines = sys.stdin.read().strip().split('\\n')\n    capacity = int(lines[0])\n    ops = lines[1].split() if len(lines) > 1 else []\n    count = 0\n    for op in ops:\n        if op == 'P':\n            count += 1\n            if count > capacity: return 'OVERFLOW'\n        elif op == 'C':\n            count -= 1\n            if count < 0: return 'UNDERFLOW'\n    return count\nprint(solve())`,
      },
      testCases: [
        { input: '5\nP P P C', expectedOutput: '2', hidden: false },
        { input: '2\nP P P', expectedOutput: 'OVERFLOW', hidden: false },
        { input: '1\nC', expectedOutput: 'UNDERFLOW', hidden: true },
        { input: '10\nP P P P P C C', expectedOutput: '3', hidden: true },
      ],
      marks: 25,
      options: [],
      correctAnswer: 0,
    },
    {
      questionType: 'DESCRIPTIVE',
      title: 'Architectural Analysis: Semaphores vs Mutexes',
      questionText: 'Explain the fundamental distinction between a binary semaphore and a mutex in modern POSIX operating systems. Describe the priority inversion problem and how priority inheritance mitigates it.',
      rubric: 'Examine understanding of ownership semantics, signaling mechanisms, and priority inversion mitigation techniques.',
      minWords: 40,
      maxWords: 350,
      marks: 15,
      options: [],
      correctAnswer: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  if (!isOpen) return null;

  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  const handleAddQuestion = (type: QuestionType) => {
    let newQ: QuestionDraft;
    if (type === 'CODING') {
      newQ = {
        questionType: 'CODING',
        title: 'New Coding Challenge',
        questionText: 'Implement the algorithm as specified below.',
        problemStatement: 'Problem description and I/O specifications...',
        constraints: '1 <= N <= 10^5',
        allowedLanguages: ['javascript', 'python', 'typescript'],
        starterCode: {
          javascript: `// Write your solution here\nconst lines = input.trim().split('\\n');\nconsole.log(lines[0]);`,
        },
        testCases: [
          { input: '10', expectedOutput: '10', hidden: false },
          { input: '42', expectedOutput: '42', hidden: true },
        ],
        marks: 20,
        options: [],
        correctAnswer: 0,
      };
    } else if (type === 'DESCRIPTIVE') {
      newQ = {
        questionType: 'DESCRIPTIVE',
        title: 'Descriptive Technical Question',
        questionText: 'Discuss the design trade-offs and theoretical principles...',
        rubric: 'Evaluate depth of technical argument, precision of terminology, and rationale.',
        minWords: 30,
        maxWords: 300,
        marks: 15,
        options: [],
        correctAnswer: 0,
      };
    } else {
      newQ = {
        questionType: 'MULTIPLE_CHOICE',
        title: 'Multiple Choice Concept',
        questionText: 'Enter the concept question statement here...',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 0,
        marks: 5,
      };
    }

    setQuestions([...questions, newQ]);
    setActiveQuestionIdx(questions.length);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    setActiveQuestionIdx(Math.max(0, idx - 1));
  };

  const updateActiveQuestion = (patch: Partial<QuestionDraft>) => {
    setQuestions(
      questions.map((q, i) => (i === activeQuestionIdx ? { ...q, ...patch } : q))
    );
  };

  const handleAddTestCase = () => {
    const active = questions[activeQuestionIdx];
    if (active.questionType !== 'CODING') return;
    const tcs = active.testCases || [];
    updateActiveQuestion({
      testCases: [...tcs, { input: 'sample_input', expectedOutput: 'sample_output', hidden: false }],
    });
  };

  const handleRemoveTestCase = (tcIdx: number) => {
    const active = questions[activeQuestionIdx];
    if (active.questionType !== 'CODING') return;
    const tcs = (active.testCases || []).filter((_, i) => i !== tcIdx);
    updateActiveQuestion({ testCases: tcs });
  };

  const handleUpdateTestCase = (tcIdx: number, field: string, value: any) => {
    const active = questions[activeQuestionIdx];
    if (active.questionType !== 'CODING') return;
    const tcs = (active.testCases || []).map((tc, i) =>
      i === tcIdx ? { ...tc, [field]: value } : tc
    );
    updateActiveQuestion({ testCases: tcs });
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const generatedKey = customAccessCode.trim() ? customAccessCode.trim().toUpperCase() : generateExamCode();

      const created = await api.createExam({
        title,
        courseCode,
        description,
        durationMinutes,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        accessCode: generatedKey,
        totalMarks,
        questions: questions.map((q, idx) => ({
          ...q,
          orderIndex: idx,
        })),
        settings: {
          fullscreenRequired,
          clipboardMonitoring,
          typingDynamics,
        },
      });

      setPublishedExam(created);
      setStep('PUBLISHED');
    } catch (err: any) {
      console.error('Failed to publish exam:', err);
      alert(err.message || 'Failed to publish examination');
    } finally {
      setSaving(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!publishedExam?.accessCode) return;
    navigator.clipboard.writeText(publishedExam.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const activeQ = questions[activeQuestionIdx] || questions[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-mono">
                {courseCode || 'EXAM-SETUP'}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 'EDIT' && 'Create Examination Paper'}
                {step === 'PREVIEW' && 'Generate Paper — Examination Preview'}
                {step === 'PUBLISHED' && 'Examination Published & Locked'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {step === 'EDIT' && 'Define MCQs, Coding tasks with test cases, and Descriptive questions.'}
              {step === 'PREVIEW' && 'Review final paper layout, time bounds, and marks before locking schedule.'}
              {step === 'PUBLISHED' && 'Provide the generated access code to students to take the exam within deadline.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {step === 'EDIT' && (
              <button
                type="button"
                onClick={() => setStep('PREVIEW')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                Generate Paper (Preview)
              </button>
            )}
            {step === 'PREVIEW' && (
              <button
                type="button"
                onClick={() => setStep('EDIT')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Back to Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: EDIT MODE */}
          {step === 'EDIT' && (
            <div className="space-y-6">
              {/* Section 1: Exam Basic Details & Locked Schedule */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    1. Examination Schedule & Availability Window
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total Marks: <strong className="text-indigo-600 dark:text-indigo-400">{totalMarks}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Exam Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Distributed Systems Final Exam"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Course Code
                    </label>
                    <input
                      type="text"
                      required
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g. CS 350"
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Duration per Student
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 45)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden pr-14"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-xs">mins</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Available From (Start Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-red-600 dark:text-red-400 font-semibold">
                      Deadline (End Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-red-300 dark:border-red-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Candidate Instructions & Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="General instructions for candidates..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Section 2: Questions Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-indigo-500" />
                    2. Examination Question Paper Structure
                  </h3>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">Add Question:</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md text-xs font-medium hover:bg-sky-100"
                    >
                      <Plus className="w-3 h-3" /> MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('CODING')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-medium hover:bg-emerald-100"
                    >
                      <Code className="w-3 h-3" /> Coding + Tests
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('DESCRIPTIVE')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md text-xs font-medium hover:bg-purple-100"
                    >
                      <FileText className="w-3 h-3" /> Descriptive
                    </button>
                  </div>
                </div>

                {/* Question Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
                  {questions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeQuestionIdx === idx
                          ? 'bg-white dark:bg-slate-800 border-t-2 border-x border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-900/50'
                      }`}
                    >
                      {q.questionType === 'MULTIPLE_CHOICE' && <ListChecks className="w-3 h-3 text-sky-500" />}
                      {q.questionType === 'CODING' && <Code className="w-3 h-3 text-emerald-500" />}
                      {q.questionType === 'DESCRIPTIVE' && <FileText className="w-3 h-3 text-purple-500" />}
                      <span>Q{idx + 1}: {q.title ? q.title.slice(0, 16) : 'Untitled'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({q.marks}m)</span>
                    </button>
                  ))}
                </div>

                {/* Active Question Editor Card */}
                {activeQ && (
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Question {activeQuestionIdx + 1} of {questions.length}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {activeQ.questionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 font-medium">Marks:</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={activeQ.marks}
                            onChange={(e) =>
                              updateActiveQuestion({ marks: parseInt(e.target.value, 10) || 5 })
                            }
                            className="w-16 p-1.5 text-center font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(activeQuestionIdx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                            title="Delete this question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                          Question Title
                        </label>
                        <input
                          type="text"
                          value={activeQ.title}
                          onChange={(e) => updateActiveQuestion({ title: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                          Question Prompt / Problem Summary
                        </label>
                        <input
                          type="text"
                          value={activeQ.questionText}
                          onChange={(e) => updateActiveQuestion({ questionText: e.target.value })}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* MULTIPLE CHOICE FIELDS */}
                    {activeQ.questionType === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-slate-700 dark:text-slate-300 font-medium">
                          Options & Correct Answer (Select radio button for the correct key):
                        </label>
                        <div className="space-y-2">
                          {(activeQ.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${activeQuestionIdx}`}
                                checked={activeQ.correctAnswer === optIdx}
                                onChange={() => updateActiveQuestion({ correctAnswer: optIdx })}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...activeQ.options];
                                  newOpts[optIdx] = e.target.value;
                                  updateActiveQuestion({ options: newOpts });
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                              />
                              {activeQ.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = activeQ.options.filter((_, i) => i !== optIdx);
                                    updateActiveQuestion({
                                      options: newOpts,
                                      correctAnswer: Math.min(activeQ.correctAnswer, newOpts.length - 1),
                                    });
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {activeQ.options.length < 6 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateActiveQuestion({
                                options: [...activeQ.options, `Option ${activeQ.options.length + 1}`],
                              })
                            }
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        )}
                      </div>
                    )}

                    {/* CODING FIELDS */}
                    {activeQ.questionType === 'CODING' && (
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                            Problem Statement & Full Specifications
                          </label>
                          <textarea
                            rows={3}
                            value={activeQ.problemStatement || ''}
                            onChange={(e) => updateActiveQuestion({ problemStatement: e.target.value })}
                            placeholder="Detailed input/output constraints, edge cases..."
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                          />
                        </div>

                        {/* Test Cases Editor */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5 text-emerald-500" />
                              Automated Test Cases
                            </span>
                            <button
                              type="button"
                              onClick={handleAddTestCase}
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Test Case
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Hidden test cases evaluate student submissions without exposing expected inputs to candidates.
                          </p>

                          <div className="space-y-2 mt-2">
                            {(activeQ.testCases || []).map((tc, tcIdx) => (
                              <div
                                key={tcIdx}
                                className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700"
                              >
                                <div className="col-span-4">
                                  <label className="text-[10px] text-slate-400 block">Input (stdin):</label>
                                  <input
                                    type="text"
                                    value={tc.input}
                                    onChange={(e) => handleUpdateTestCase(tcIdx, 'input', e.target.value)}
                                    className="w-full p-1.5 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <label className="text-[10px] text-slate-400 block">Expected Output:</label>
                                  <input
                                    type="text"
                                    value={tc.expectedOutput}
                                    onChange={(e) =>
                                      handleUpdateTestCase(tcIdx, 'expectedOutput', e.target.value)
                                    }
                                    className="w-full p-1.5 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                  />
                                </div>
                                <div className="col-span-3 flex items-center gap-2 pt-3">
                                  <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tc.hidden}
                                      onChange={(e) =>
                                        handleUpdateTestCase(tcIdx, 'hidden', e.target.checked)
                                      }
                                      className="rounded text-indigo-600"
                                    />
                                    <span>Hidden Test</span>
                                  </label>
                                </div>
                                <div className="col-span-1 pt-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTestCase(tcIdx)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DESCRIPTIVE FIELDS */}
                    {activeQ.questionType === 'DESCRIPTIVE' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                            Grading Rubric & Evaluation Criteria
                          </label>
                          <textarea
                            rows={2}
                            value={activeQ.rubric || ''}
                            onChange={(e) => updateActiveQuestion({ rubric: e.target.value })}
                            placeholder="Criteria for scoring answers (depth, precision, edge analysis)..."
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                              Minimum Words
                            </label>
                            <input
                              type="number"
                              min="10"
                              max="1000"
                              value={activeQ.minWords || 30}
                              onChange={(e) =>
                                updateActiveQuestion({ minWords: parseInt(e.target.value, 10) || 30 })
                              }
                              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                              Maximum Words
                            </label>
                            <input
                              type="number"
                              min="50"
                              max="5000"
                              value={activeQ.maxWords || 350}
                              onChange={(e) =>
                                updateActiveQuestion({ maxWords: parseInt(e.target.value, 10) || 350 })
                              }
                              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW MODE (GENERATE PAPER) */}
          {step === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Review Generated Examination Paper Before Publishing & Locking Schedule
                  </p>
                  <p className="text-amber-800/80 dark:text-amber-300/80">
                    Once published, the examination schedule window and duration will be locked. An authoritative student access key will be generated for you to share with candidates.
                  </p>
                </div>
              </div>

              {/* Formatted Paper Preview Document */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                    INSTITUTIONAL EXAMINATION PAPER
                  </span>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {title}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Course Code: <strong>{courseCode}</strong> | Total Marks: <strong>{totalMarks}</strong> | Duration: <strong>{durationMinutes} Minutes</strong>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 mt-2">
                    <span>
                      Window Opens: <strong className="text-slate-800 dark:text-slate-200">{new Date(startTime).toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Deadline: <strong className="text-red-600 dark:text-red-400">{new Date(endTime).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions to Candidates:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                    <li>Each student is permitted exactly <strong>one single attempt</strong> within the deadline window.</li>
                    <li>The countdown timer begins immediately upon entering the valid exam access key.</li>
                    <li>Non-invasive behavioral integrity monitoring is active (focus continuity, clipboard auditing).</li>
                    <li>Ensure all coding test cases pass before final submission.</li>
                  </ul>
                </div>

                {/* Questions List */}
                <div className="space-y-5">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Question {idx + 1}: {q.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-mono">
                            {q.questionType}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            [{q.marks} Marks]
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300">{q.questionText}</p>

                      {q.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded border text-[11px] ${
                                q.correctAnswer === oIdx
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <span className="font-mono mr-1.5">({String.fromCharCode(65 + oIdx)})</span>
                              {opt}
                              {q.correctAnswer === oIdx && ' (Correct Key)'}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === 'CODING' && (
                        <div className="space-y-1.5 pt-1 text-[11px]">
                          {q.problemStatement && (
                            <p className="text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                              {q.problemStatement}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-slate-500">
                            <span>Test Cases: <strong>{(q.testCases || []).length} configured</strong></span>
                            <span>•</span>
                            <span>Public: {(q.testCases || []).filter(t => !t.hidden).length}</span>
                            <span>•</span>
                            <span>Hidden: {(q.testCases || []).filter(t => t.hidden).length}</span>
                          </div>
                        </div>
                      )}

                      {q.questionType === 'DESCRIPTIVE' && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          <span>Recommended Length: {q.minWords} - {q.maxWords} words</span>
                          {q.rubric && <p className="italic mt-0.5">Rubric: {q.rubric}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PUBLISHED MODE */}
          {step === 'PUBLISHED' && publishedExam && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Examination Paper Generated & Published!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The schedule and parameters have been locked. Announce the access code below to candidates. Students must enter this code to begin.
                </p>
              </div>

              {/* Large Access Code Banner */}
              <div className="max-w-md mx-auto bg-indigo-50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-5 rounded-2xl space-y-3">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  Student Access Code
                </span>
                <div className="flex items-center justify-center gap-2">
                  <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
                    {publishedExam.accessCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      Code Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code for Students
                    </>
                  )}
                </button>
              </div>

              {/* Summary Details */}
              <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-left text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] block">Duration per Candidate:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {publishedExam.durationMinutes} Minutes
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Questions / Marks:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {publishedExam.totalQuestions} Questions ({publishedExam.totalMarks} Marks)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Available From:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {new Date(publishedExam.startTime).toLocaleDateString()} {new Date(publishedExam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Deadline (End Time):</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold text-[11px]">
                    {new Date(publishedExam.endTime).toLocaleDateString()} {new Date(publishedExam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          {step === 'EDIT' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('PREVIEW')}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Generate Paper Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'PREVIEW' && (
            <>
              <button
                type="button"
                onClick={() => setStep('EDIT')}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                Edit Questions
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handlePublish}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                {saving ? 'Publishing & Locking...' : 'Publish Examination & Generate Code'}
              </button>
            </>
          )}

          {step === 'PUBLISHED' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (publishedExam) onCreated(publishedExam);
                  onClose();
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Done — Return to Examiner Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
