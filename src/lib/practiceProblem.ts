import type { GeneratedProblem } from './ai'
import { CONCEPTS } from './physics'
import { CONCEPT_COLOR } from './practiceConcepts'
import type { BarDragStep } from '../types/lesson'

/** Turns an engine-verified generated problem into a renderable bar_drag step. */
export function toBarDragStep(p: GeneratedProblem): BarDragStep {
  const c = CONCEPTS[p.conceptId]
  const givens = c.vars.map((v) => ({
    label: v.symbol,
    value: `${p.params[v.symbol]} ${v.unit}`,
  }))
  const maxValue = Math.max(5, Math.ceil((p.value * 1.4) / 5) * 5)
  const givensText = givens.map((g) => `${g.label} = ${g.value}`).join(', ')
  return {
    type: 'bar_drag',
    prompt: p.scenario,
    barLabel: c.resultSymbol,
    barColor: CONCEPT_COLOR[p.conceptId],
    maxValue,
    correctValue: p.value,
    unit: c.unit,
    tolerance: 0.03,
    hints: [
      `Use ${c.display}.`,
      `Substitute the given values into ${c.display}, then compute.`,
    ],
    givens,
    formulas: [c.display],
    solution: `${c.display}\n\nGiven: ${givensText}\n\n**So ${c.resultSymbol} = ${p.value} ${c.unit}.**`,
  }
}
