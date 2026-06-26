import type { Step } from '../types/lesson'
import { buildSolution } from './solution'
import type { StruggleContext } from './ai'

/**
 * Builds the AI helper's context from whatever step the learner is on, so Brock
 * always knows the current material (not a stale earlier problem). Shared by the
 * lesson flow and the tricky-problems review session.
 */
export function tutorContextForStep(step: Step | undefined): StruggleContext | null {
  if (!step) return null
  if (step.type === 'bar_drag' || step.type === 'predict_numeric') {
    return {
      kind: 'problem',
      prompt: step.prompt,
      formulas: step.formulas,
      givens: step.givens,
      correctValue: step.correctValue,
      unit: step.unit,
      solution: buildSolution(step),
    }
  }
  if (step.type === 'concept') {
    const head = step.title ? `${step.title}. ` : ''
    return {
      kind: 'concept',
      prompt: `${head}${step.body}`,
      formulas: step.equation ? [step.equation] : undefined,
    }
  }
  if (step.type === 'compare_slider') {
    return {
      kind: 'explore',
      prompt: `${step.prompt} ${step.task}`,
      formulas: [step.formula],
    }
  }
  return null
}
