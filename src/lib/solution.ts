import type { BarDragStep, PredictNumericStep } from '../types/lesson'

type QuestionStep = BarDragStep | PredictNumericStep

/**
 * Returns the full worked solution for a question. Uses an authored `solution`
 * field when present, otherwise composes a walkthrough from the step's formulas,
 * givens, and answer. Supports `\n\n` paragraph breaks and **bold**.
 */
export function buildSolution(step: QuestionStep): string {
  if (step.solution && step.solution.trim()) return step.solution.trim()

  // Note: we deliberately do NOT fall back to the `hints` array here — those are
  // written as wrong-answer nudges ("Not quite…", "You're close…") and would
  // leak attempt-flavoured tone into a neutral solution.
  if (step.type === 'predict_numeric') {
    return `**The answer is ${step.correctValue} ${step.unit}.**`
  }

  const parts: string[] = []
  if (step.formulas?.length) parts.push(step.formulas.join('    '))
  if (step.givens?.length) {
    parts.push('Given: ' + step.givens.map((g) => `${g.label} = ${g.value}`).join(', '))
  }
  parts.push(`**So ${step.barLabel} = ${step.correctValue} ${step.unit}.**`)
  return parts.join('\n\n')
}
