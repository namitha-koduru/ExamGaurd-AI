/**
 * ExamGuard AI - Exam Code Utility
 * Generates human-friendly, high-contrast access keys for exams (e.g. A7K9-XP2)
 */

const CHARSET_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateExamCode(): string {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += CHARSET_CHARS.charAt(Math.floor(Math.random() * CHARSET_CHARS.length));
  }
  for (let i = 0; i < 3; i++) {
    part2 += CHARSET_CHARS.charAt(Math.floor(Math.random() * CHARSET_CHARS.length));
  }
  return `${part1}-${part2}`;
}

export function normalizeExamCode(code: string): string {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function codesMatch(inputCode: string, targetCode: string): boolean {
  return normalizeExamCode(inputCode) === normalizeExamCode(targetCode);
}
