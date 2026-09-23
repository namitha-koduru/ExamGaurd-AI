/**
 * ExamGuard AI - Create Examination Modal
 * Supports mixed question formats: Multiple Choice, Coding, and Descriptive
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import { Exam, QuestionType } from '../../types';
import { Plus, Trash2, X, Code, FileText, ListChecks, Shield } from 'lucide-react';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newExam: Exam) => void;
}

interface QuestionDraft {
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
  testCases?: { input: string; expectedOutput: string; hidden: boolean }[];
  rubric?: string;
  minWords?: number;
  maxWords?: number;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS 350');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [fullscreenRequired, setFullscreenRequired] = useState(true);
  const [clipboardMonitoring, setClipboardMonitoring] = useState(true);
  const [typingDynamics, setTypingDynamics] = useState(true);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      questionType: 'MULTIPLE_CHOICE',
      title: 'Time Complexity',
      questionText: 'What is the time complexity of quicksort in the worst case?',
      options: ['O(N log N)', 'O(N^2)', 'O(log N)', 'O(N)'],
      correctAnswer: 1,
      marks: 5,
    },
    {
      questionType: 'CODING',
      title: 'Reverse Linked List or Array',
      questionText: 'Reverse an array of integers in place.',
      problemStatement: 'Given an array of integers `nums`, reverse it and print comma-separated values.',
      constraints: '1 <= nums.length <= 1000',
      allowedLanguages: ['javascript', 'python', 'typescript'],
      starterCode: {
        javascript: `function reverse(nums) {\n  return nums.reverse().join(', ');\n}\nconst nums = input.trim().split(',').map(x => parseInt(x.trim(), 10));\nconsole.log(reverse(nums));`,
        python: `def reverse(nums):\n    return ', '.join(map(str, nums[::-1]))\nimport sys\nnums = [int(x.strip()) for x in sys.stdin.read().strip().split(',')]\nprint(reverse(nums))`,
      },
      testCases: [
        { input: '1, 2, 3, 4', expectedOutput: '4, 3, 2, 1', hidden: false },
        { input: '10, 20, 30', expectedOutput: '30, 20, 10', hidden: true },
      ],
      marks: 20,
      options: [],
      correctAnswer: 0,
    },
    {
      questionType: 'DESCRIPTIVE',
      title: 'Architectural Analysis',
      questionText: 'Discuss the CAP Theorem in the context of distributed datastore design.',
      rubric: 'Evaluate trade-offs between consistency and availability during network partitions.',
      minWords: 40,
      maxWords: 300,
      marks: 10,
      options: [],
      correctAnswer: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddQuestion = (type: QuestionType) => {
    if (type === 'CODING') {
      setQuestions([
        ...questions,
        {
          questionType: 'CODING',
          title: 'Coding Task',
          questionText: 'Implement the requested algorithm.',
          problemStatement: 'Problem description here...',
          allowedLanguages: ['javascript', 'python'],
          testCases: [{ input: '1\n2', expectedOutput: '3', hidden: false }],
          marks: 20,
          options: [],
          correctAnswer: 0,
        },
      ]);
    } else if (type === 'DESCRIPTIVE') {
      setQuestions([
        ...questions,
        {
          questionType: 'DESCRIPTIVE',
          title: 'Descriptive Question',
          questionText: 'Provide detailed architectural analysis...',
          rubric: 'Evaluate depth of technical justification and precision.',
          minWords: 50,
          maxWords: 400,
          marks: 10,
          options: [],
          correctAnswer: 0,
        },
      ]);
    } else {
      setQuestions([
        ...questions,
        {
          questionType: 'MULTIPLE_CHOICE',
          title: 'Multiple Choice Question',
          questionText: 'Enter question text...',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          marks: 5,
        },
      ]);
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createExam({
        title,
        courseCode,
        description,
        durationMinutes,
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
      onCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create exam:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-3xl w-full p-6 shadow-xl my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Create New Examination
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure exam parameters and define mixed questions (MCQ, Coding, Descriptive)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Exam Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Systems Midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="240"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Description / Instructions
              </label>
              <input
                type="text"
                placeholder="Brief guidelines for candidates"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Monitoring Controls */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-md border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Behavioral Telemetry Policies</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fullscreenRequired}
                  onChange={(e) => setFullscreenRequired(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Enforce Fullscreen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clipboardMonitoring}
                  onChange={(e) => setClipboardMonitoring(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Clipboard Telemetry</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={typingDynamics}
                  onChange={(e) => setTypingDynamics(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Typing & Mouse Dynamics</span>
              </label>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                Exam Questions ({questions.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <ListChecks className="w-3 h-3" /> +MCQ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('CODING')}
                  className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                >
                  <Code className="w-3 h-3" /> +Coding
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('DESCRIPTIVE')}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                >
                  <FileText className="w-3 h-3" /> +Descriptive
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {q.questionType === 'CODING'
                          ? 'Coding Question'
                          : q.questionType === 'DESCRIPTIVE'
                          ? 'Descriptive Question'
                          : 'Multiple Choice Question'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>Marks:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.marks}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].marks = parseInt(e.target.value, 10) || 5;
                            setQuestions(updated);
                          }}
                          className="w-12 p-1 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Question prompt or title"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].questionText = e.target.value;
                        setQuestions(updated);
                      }}
                      className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* MCQ Options */}
                  {q.questionType === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-300 dark:border-slate-700">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={q.correctAnswer === optIdx}
                            onChange={() => {
                              const updated = [...questions];
                              updated[idx].correctAnswer = optIdx;
                              setQuestions(updated);
                            }}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].options[optIdx] = e.target.value;
                              setQuestions(updated);
                            }}
                            className="flex-1 p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coding Specifications */}
                  {q.questionType === 'CODING' && (
                    <div className="space-y-2 pl-2 border-l-2 border-purple-400">
                      <textarea
                        rows={2}
                        placeholder="Detailed problem statement and constraints"
                        value={q.problemStatement || ''}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].problemStatement = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                      <div className="text-[11px] text-slate-500">
                        Configured with sample & hidden test validation suite.
                      </div>
                    </div>
                  )}

                  {/* Descriptive Specifications */}
                  {q.questionType === 'DESCRIPTIVE' && (
                    <div className="space-y-2 pl-2 border-l-2 border-blue-400">
                      <input
                        type="text"
                        placeholder="Grading rubric criteria (e.g. Depth of architectural trade-offs)"
                        value={q.rubric || ''}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].rubric = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Publish Examination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
