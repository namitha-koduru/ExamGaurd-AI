/**
 * ExamGuard AI - Descriptive Question Workspace
 * Rich descriptive answer editor with live word count and rubric guidance
 */

import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DescriptiveWorkspaceProps {
  question: Question;
  savedAnswer?: string;
  onAnswerChange: (answer: string) => void;
  onTelemetryEvent: (eventType: string, metadata?: Record<string, any>) => void;
}

export const DescriptiveWorkspace: React.FC<DescriptiveWorkspaceProps> = ({
  question,
  savedAnswer = '',
  onAnswerChange,
  onTelemetryEvent,
}) => {
  const [text, setText] = useState<string>(savedAnswer);

  useEffect(() => {
    setText(savedAnswer);
  }, [question.id]);

  const countWords = (str: string): number => {
    const trimmed = str.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const wordCount = countWords(text);
  const minWords = question.minWords || 50;
  const maxWords = question.maxWords || 500;
  const isWithinBounds = wordCount >= minWords && wordCount <= maxWords;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onAnswerChange(newText);

    onTelemetryEvent('ANSWER_STARTED', {
      questionId: question.id,
      charCount: newText.length,
      wordCount: countWords(newText),
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Prompt */}
      <div className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
        {question.questionText}
      </div>

      {/* Rubric Guidance Card */}
      {question.rubric && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Grading Rubric Guidance</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            {question.rubric}
          </p>
        </div>
      )}

      {/* Textarea Editor */}
      <div className="space-y-2">
        <textarea
          rows={10}
          value={text}
          onChange={handleChange}
          placeholder="Type your structured explanation and analysis here..."
          className="w-full p-4 text-xs font-sans rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-y shadow-xs"
        />

        {/* Counter & Guidelines */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">
              {wordCount} words / {text.length} characters
            </span>
            {wordCount > 0 && (
              <span
                className={`text-[11px] flex items-center gap-1 ${
                  isWithinBounds
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {isWithinBounds ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Meets guidelines
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />{' '}
                    {wordCount < minWords ? `Min ${minWords} words recommended` : `Exceeds ${maxWords} words`}
                  </>
                )}
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Target: {minWords}–{maxWords} words
          </div>
        </div>
      </div>
    </div>
  );
};
