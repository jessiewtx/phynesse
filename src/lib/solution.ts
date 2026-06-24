import type {
  BarDragStep,
  EquationFillStep,
  PredictMCStep,
  PredictNumericStep,
} from '../types/lesson'

type QuestionStep = BarDragStep | EquationFillStep | PredictMCStep | PredictNumericStep

/**
 * Returns the full worked solution for a question. Uses an authored `solution`
 * field when present, otherwise composes a walkthrough from the step's formulas,
 * givens, hints, and answer. Supports `\n\n` paragraph breaks and **bold**.
 */
export function buildSolution(step: QuestionStep): string {
  if (step.solution && step.solution.trim()) return step.solution.trim()

  // Note: we deliberately do NOT fall back to the `hints`/`computeHints` arrays
  // here — those are written as wrong-answer nudges ("Not quite…", "You're
  // close…") and would leak attempt-flavoured tone into a neutral solution.
  switch (step.type) {
    case 'predict_mc': {
      const correct = step.choices[step.correctIndex]
      return `**The answer is "${correct}".**`
    }
    case 'predict_numeric': {
      return `**The answer is ${step.correctValue} ${step.unit}.**`
    }
    case 'bar_drag': {
      const parts: string[] = []
      if (step.formulas?.length) parts.push(step.formulas.join('    '))
      if (step.givens?.length) {
        parts.push('Given: ' + step.givens.map((g) => `${g.label} = ${g.value}`).join(', '))
      }
      parts.push(`**So ${step.barLabel} = ${step.correctValue} ${step.unit}.**`)
      return parts.join('\n\n')
    }
    case 'equation_fill': {
      const eq = step.template
        .map((seg) => ('text' in seg ? seg.text : String(step.slots[seg.slot])))
        .join('')
        .trim()
      return `Plug the values in:\n\n${eq} = ${step.result.value} ${step.result.unit}.`
    }
  }
}
