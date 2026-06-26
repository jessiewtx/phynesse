import { evaluate } from 'mathjs'

/**
 * The deterministic physics core. This is the single source of truth for every
 * answer in the app. The AI never computes or grades anything — it only proposes
 * wording and parameters, which are always recomputed and verified here.
 */

export type ConceptId = 'work' | 'kinetic' | 'grav_pe' | 'elastic_pe' | 'power'

export type VarSpec = {
  symbol: string
  label: string
  unit: string
  min: number
  max: number
  step: number
}

export type Mistake = {
  id: string
  /** Plain-language description of the slip, fed to the AI to phrase kindly. */
  label: string
  /** The wrong expression a learner who made this slip would compute. */
  expr: string
}

export type Concept = {
  id: ConceptId
  name: string
  /** math.js expression evaluated against constants + params. */
  expr: string
  /** Human-readable formula for prompts/UI. */
  display: string
  resultSymbol: string
  unit: string
  vars: VarSpec[]
  constants?: Record<string, number>
  mistakes: Mistake[]
}

export const CONCEPTS: Record<ConceptId, Concept> = {
  work: {
    id: 'work',
    name: 'Work',
    expr: 'F * d',
    display: 'W = F · d',
    resultSymbol: 'W',
    unit: 'J',
    vars: [
      { symbol: 'F', label: 'force', unit: 'N', min: 2, max: 20, step: 1 },
      { symbol: 'd', label: 'distance', unit: 'm', min: 1, max: 10, step: 1 },
    ],
    mistakes: [
      { id: 'added', label: 'added force and distance instead of multiplying', expr: 'F + d' },
    ],
  },
  kinetic: {
    id: 'kinetic',
    name: 'Kinetic Energy',
    expr: '0.5 * m * v^2',
    display: 'KE = ½mv²',
    resultSymbol: 'KE',
    unit: 'J',
    vars: [
      { symbol: 'm', label: 'mass', unit: 'kg', min: 1, max: 5, step: 1 },
      { symbol: 'v', label: 'speed', unit: 'm/s', min: 1, max: 8, step: 1 },
    ],
    mistakes: [
      { id: 'forgot_square', label: 'used the speed without squaring it', expr: '0.5 * m * v' },
      { id: 'forgot_half', label: 'left out the ½ factor', expr: 'm * v^2' },
      { id: 'swapped', label: 'swapped mass and speed', expr: '0.5 * v * m^2' },
    ],
  },
  grav_pe: {
    id: 'grav_pe',
    name: 'Gravitational Potential Energy',
    expr: 'm * g * h',
    display: 'U_g = mgh',
    resultSymbol: 'U_g',
    unit: 'J',
    constants: { g: 9.8 },
    vars: [
      { symbol: 'm', label: 'mass', unit: 'kg', min: 1, max: 5, step: 1 },
      { symbol: 'h', label: 'height', unit: 'm', min: 0.5, max: 5, step: 0.5 },
    ],
    mistakes: [
      { id: 'used_g10', label: 'used g = 10 instead of 9.8', expr: 'm * 10 * h' },
      { id: 'forgot_g', label: 'left out gravity (g)', expr: 'm * h' },
    ],
  },
  elastic_pe: {
    id: 'elastic_pe',
    name: 'Elastic Potential Energy',
    expr: '0.5 * k * x^2',
    display: 'U_s = ½kx²',
    resultSymbol: 'U_s',
    unit: 'J',
    vars: [
      { symbol: 'k', label: 'spring constant', unit: 'N/m', min: 50, max: 400, step: 50 },
      { symbol: 'x', label: 'stretch', unit: 'm', min: 0.1, max: 1, step: 0.1 },
    ],
    mistakes: [
      { id: 'forgot_square', label: 'used the stretch without squaring it', expr: '0.5 * k * x' },
      { id: 'forgot_half', label: 'left out the ½ factor', expr: 'k * x^2' },
    ],
  },
  power: {
    id: 'power',
    name: 'Power',
    expr: 'W / t',
    display: 'P = W / Δt',
    resultSymbol: 'P',
    unit: 'W',
    vars: [
      { symbol: 'W', label: 'work', unit: 'J', min: 20, max: 500, step: 20 },
      { symbol: 't', label: 'time', unit: 's', min: 1, max: 10, step: 1 },
    ],
    mistakes: [
      { id: 'multiplied', label: 'multiplied work by time instead of dividing', expr: 'W * t' },
      { id: 'inverted', label: 'divided time by work (upside down)', expr: 't / W' },
    ],
  },
}

export function getConcept(id: ConceptId): Concept {
  return CONCEPTS[id]
}

function scopeFor(concept: Concept, params: Record<string, number>): Record<string, number> {
  return { ...(concept.constants ?? {}), ...params }
}

/** The authoritative answer. Always computed here, never by the AI. */
export function compute(conceptId: ConceptId, params: Record<string, number>): number {
  const concept = CONCEPTS[conceptId]
  const raw = evaluate(concept.expr, scopeFor(concept, params)) as number
  return Math.round(raw * 1000) / 1000
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

export type ValidationResult =
  | { ok: true; params: Record<string, number>; value: number }
  | { ok: false; reason: string }

/**
 * Verifies AI-proposed parameters: every variable snapped to its step and in
 * range, and the resulting answer is positive, finite, and "nice" to read.
 */
export function validateProblem(
  conceptId: ConceptId,
  rawParams: Record<string, number>,
): ValidationResult {
  const concept = CONCEPTS[conceptId]
  const params: Record<string, number> = {}

  for (const v of concept.vars) {
    const incoming = rawParams[v.symbol]
    if (typeof incoming !== 'number' || !Number.isFinite(incoming)) {
      return { ok: false, reason: `missing ${v.symbol}` }
    }
    const snapped = Number(roundToStep(incoming, v.step).toFixed(4))
    if (snapped < v.min || snapped > v.max) {
      return { ok: false, reason: `${v.symbol} out of range` }
    }
    params[v.symbol] = snapped
  }

  const value = compute(conceptId, params)
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: 'non-positive answer' }
  }
  // "Nice" = at most one decimal place, so learners can read it off a bar.
  if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-6) {
    return { ok: false, reason: 'answer not clean' }
  }
  return { ok: true, params, value }
}

/** Picks valid random parameters deterministically (the AI-off fallback). */
export function randomProblem(conceptId: ConceptId): { params: Record<string, number>; value: number } {
  const concept = CONCEPTS[conceptId]
  for (let attempt = 0; attempt < 40; attempt++) {
    const params: Record<string, number> = {}
    for (const v of concept.vars) {
      const steps = Math.floor((v.max - v.min) / v.step) + 1
      const pick = v.min + Math.floor(Math.random() * steps) * v.step
      params[v.symbol] = Number(pick.toFixed(4))
    }
    const result = validateProblem(conceptId, params)
    if (result.ok) return { params: result.params, value: result.value }
  }
  // Guaranteed-valid fallback using minimums.
  const params = Object.fromEntries(concept.vars.map((v) => [v.symbol, v.min]))
  return { params, value: compute(conceptId, params) }
}

/**
 * Matches a learner's wrong answer against known misconceptions for the concept.
 * Returns the misconception so the AI can explain it — tuned to what they did.
 */
export function diagnose(
  conceptId: ConceptId,
  params: Record<string, number>,
  learnerAnswer: number,
  tolerance = 0.05,
): Mistake | null {
  const concept = CONCEPTS[conceptId]
  for (const mistake of concept.mistakes) {
    const wrong = evaluate(mistake.expr, scopeFor(concept, params)) as number
    const margin = Math.max(Math.abs(wrong * tolerance), 0.5)
    if (Math.abs(learnerAnswer - wrong) <= margin) return mistake
  }
  return null
}

/** Pulls the leading number out of a given like "20 kg" or "7200 N". */
export function parseGivenNumber(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

/**
 * Concept-agnostic misconception check for authored multi-step problems that
 * don't carry a single formula. Looks at the ratio between the learner's answer
 * and the true answer (and whether they just echoed a given) to name the likely
 * slip. Returns a plain-language label, or null if nothing recognizable.
 */
export function diagnoseGeneric(
  correctValue: number,
  learnerAnswer: number,
  givenValues: number[] = [],
): string | null {
  if (!Number.isFinite(learnerAnswer) || correctValue === 0) return null

  const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(Math.abs(b) * 0.03, 0.01)

  for (const g of givenValues) {
    if (near(learnerAnswer, g)) {
      return 'used one of the given numbers as the final answer instead of combining them'
    }
  }

  const ratio = learnerAnswer / correctValue
  if (near(ratio, 2)) return 'got an answer twice too large — likely dropped a factor of ½'
  if (near(ratio, 0.5)) return 'got an answer half the right size — likely missing a factor of 2'
  if (near(ratio, 4)) return 'got an answer 4× too large — watch a squared term or a doubled value'
  if (near(ratio, 0.25)) return 'got an answer 4× too small — a squared term may be missing'
  if (near(ratio, 10 / 9.8) || near(ratio, 9.8 / 10)) return 'likely used g = 10 instead of 9.8'
  return null
}
