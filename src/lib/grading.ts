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

export function gradeMC(
  selected: number,
  correctIndex: number,
  hints: string[],
  attempt: number,
): GradeResult {
  if (selected === correctIndex) {
    return { correct: true }
  }
  const hint = hints[Math.min(attempt, hints.length - 1)]
  return { correct: false, hint }
}

export function hintForNumeric(
  hints: string[],
  attempt: number,
): string | undefined {
  return hints[Math.min(attempt, hints.length - 1)]
}
