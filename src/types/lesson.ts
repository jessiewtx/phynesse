export type BarDragStep = {
  type: 'bar_drag'
  prompt: string
  barLabel: string
  barColor: string
  maxValue: number
  correctValue: number
  unit: string
  tolerance: number
  hints: string[]
  givens?: { label: string; value: string }[]
  /** When true, givens are shown up front (for multi-part problems that carry
   *  values across parts). Otherwise they stay hidden until the first hint. */
  showGivens?: boolean
  formulas?: string[]
  solution?: string
}

export type ConceptStep = {
  type: 'concept'
  title?: string
  body: string
  equation?: string
  visual?:
    | 'work_angle'
    | 'zero_work'
    | 'work_sign'
    | 'net_work'
    | 'ke_tool'
    | 'ramp_height'
    | 'pe_zero'
    | 'pe_ke_trade'
    | 'energy_chain'
    | 'v_derivation'
    | 'friction_energy'
    | 'braking_energy'
    | 'power_speed'
    | 'kinetic_energy'
    | 'gravitational_pe'
    | 'elastic_pe'
    | 'conservation'
    | 'power'
  demo?:
    | 'work_or_not'
    | 'work_drag'
    | 'work_energy_race'
    | 'angle_explorer'
    | 'ke_explorer'
    | 'gravity_explorer'
    | 'elastic_explorer'
    | 'conservation_explorer'
    | 'coaster_explorer'
    | 'power_explorer'
}

export type ProblemVisual =
  | 'push'
  | 'angle_pull'
  | 'push_friction'
  | 'force_distance'
  | 'braking'
  | 'ramp'
  | 'ramp_friction'
  | 'spring_launch'
  | 'power_car'
  | 'stairs'

export type PredictNumericStep = {
  type: 'predict_numeric'
  prompt: string
  correctValue: number
  unit: string
  tolerance: number
  hints: string[]
  givens?: { label: string; value: string }[]
  /** When true, givens are shown up front (for multi-part problems that carry
   *  values across parts). Otherwise they stay hidden until the first hint. */
  showGivens?: boolean
  formulas?: string[]
  solution?: string
  visual?: ProblemVisual
  /** When true, the learner rates confidence before checking (metacognition). */
  calibrate?: boolean
}

/** How sure the learner felt about an answer, captured for calibration. */
export type Confidence = 'guess' | 'think' | 'sure'

/**
 * A fully worked example the learner studies before solving on their own — the
 * first rung of worked-example fading. Steps reveal one at a time so the learner
 * predicts each move (active study, not passive reading).
 */
export type WorkedExampleStep = {
  type: 'worked_example'
  title?: string
  prompt: string
  formulas?: string[]
  givens?: { label: string; value: string }[]
  /** Worked lines, revealed progressively. */
  steps: string[]
  /** Final answer, e.g. "9 J". */
  answer: string
  /** One-line takeaway shown at the end. */
  takeaway?: string
  visual?: ProblemVisual
}

/**
 * A completion problem — the middle rung of fading. The setup is worked for the
 * learner; they compute only the final step. Graded like a numeric problem.
 */
export type CompletionStep = {
  type: 'completion'
  prompt: string
  formulas?: string[]
  givens?: { label: string; value: string }[]
  /** Pre-worked lines shown to the learner (the scaffold). */
  shownSteps: string[]
  /** The final value the learner must compute. */
  correctValue: number
  unit: string
  tolerance: number
  hint?: string
  solution?: string
  visual?: ProblemVisual
  calibrate?: boolean
}

/**
 * A scaling/relationship explorer: the learner moves ONE variable and watches the
 * result (and its ratio vs. the original) update live, with the formula colour-coded.
 * Result is computed as `coeff * var^power` (power 1 = linear, 2 = squared, -1 = inverse).
 */
export type CompareSliderStep = {
  type: 'compare_slider'
  prompt: string
  formula: string
  varSymbol: string
  varName: string
  varUnit: string
  min: number
  max: number
  stepSize: number
  base: number
  constants?: { symbol: string; value: string }[]
  result: { symbol: string; unit: string; coeff: number; power: number }
  /** Which interactive scene to draw for the draggable variable. */
  scene?: 'distance' | 'speed' | 'height' | 'spring' | 'time'
  /** What the learner should do with the slider — does NOT reveal the answer. */
  task: string
  solution?: string
  /** Height scene only: this represents a free-fall drop, so show a "Drop" button
   *  that animates the critter falling and the speed climbing to the result. */
  drop?: boolean
}

/**
 * A drag-the-words classification: the learner fills blanks in one or more
 * sentences from a shared word bank. Built for qualitative reasoning checks
 * (e.g. is the work positive, negative, or zero?) where a number wouldn't
 * capture the idea. Each bank entry is a unique string and is used at most once.
 */
export type FillBlanksStep = {
  type: 'fill_blanks'
  prompt: string
  visual?: ProblemVisual
  /** Sentence templates; `{id}` marks where a blank goes. */
  lines: string[]
  /** The correct word for each blank id (must match a bank entry). */
  blanks: { id: string; answer: string }[]
  /** The shared word bank (unique strings; may include distractors). */
  bank: string[]
  /** Worked justification, revealed once solved. */
  solution: string
  /** Optional nudge shown after a wrong check. */
  hint?: string
}

export type CompleteStep = {
  type: 'complete'
  title: string
  body: string
  nextLessonId: string
  nextLessonTitle: string
}

export type Step =
  | ConceptStep
  | BarDragStep
  | PredictNumericStep
  | CompareSliderStep
  | WorkedExampleStep
  | CompletionStep
  | FillBlanksStep
  | CompleteStep

export type Lesson = {
  id: string
  title: string
  order: number
  summary?: string
  steps: Step[]
}

export type StepDraft = {
  answer?: string | number
  showWrongFeedback: boolean
  feedbackText?: string
  attemptCount: number
  /** Set once the learner has answered this step correctly, so revisiting it
   *  shows the answered state instead of forcing a re-answer (and re-attempt). */
  solved?: boolean
}

export type LessonProgress = {
  lessonId: string
  stepIndex: number
  stepDraft?: StepDraft | null
  /** Per-step drafts keyed by step index, so answered/in-progress steps survive
   *  back-navigation and reloads. */
  drafts?: Record<number, StepDraft>
  updatedAt: string
}

export type GradeResult = {
  correct: boolean
  hint?: string
}
