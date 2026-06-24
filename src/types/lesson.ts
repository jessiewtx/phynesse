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
    | 'energy_chain'
    | 'friction_energy'
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
  formulas?: string[]
  solution?: string
  visual?: ProblemVisual
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
}

export type LessonProgress = {
  lessonId: string
  stepIndex: number
  stepDraft?: StepDraft | null
  updatedAt: string
}

export type GradeResult = {
  correct: boolean
  hint?: string
}
