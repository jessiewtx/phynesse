import type { GradeResult } from '../types/lesson'

export function gradeNumeric(
  answer: number,
  correct: number,
  tolerance: number,
): GradeResult {
  if (!Number.isFinite(answer)) {
    return { correct: false, hint: 'Enter a number.' }
  }
  const margin = Math.max(Math.abs(correct * tolerance), 0.01)
  const correctAnswer = Math.abs(answer - correct) <= margin
  return { correct: correctAnswer }
}

export function hintForNumeric(
  hints: string[],
  attempt: number,
): string | undefined {
  return hints[Math.min(attempt, hints.length - 1)]
}
