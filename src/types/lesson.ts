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
}

export type ConceptStep = {
  type: 'concept'
  title?: string
  body: string
  equation?: string
  visual?:
    | 'work_energy_intro'
    | 'kinetic_energy'
    | 'gravitational_pe'
    | 'elastic_pe'
    | 'conservation'
    | 'power'
  demo?:
    | 'push_work'
    | 'ke_explorer'
    | 'gravity_explorer'
    | 'elastic_explorer'
    | 'conservation_explorer'
    | 'power_explorer'
}

export type EquationFillSegment = { text: string } | { slot: string }

export type EquationFillStep = {
  type: 'equation_fill'
  prompt: string
  template: EquationFillSegment[]
  slots: Record<string, number>
  slotLabels?: Record<string, string>
  tokens: number[]
  result: { value: number; unit: string; tolerance: number }
  fillHint?: string
  computeHints: string[]
}

export type PredictMCStep = {
  type: 'predict_mc'
  prompt: string
  choices: string[]
  correctIndex: number
  hints: string[]
}

export type PredictNumericStep = {
  type: 'predict_numeric'
  prompt: string
  correctValue: number
  unit: string
  tolerance: number
  hints: string[]
}

export type SimStep = {
  type: 'sim'
  labId: 'push_block'
  prompt?: string
  defaultParams: {
    force: number
    distance: number
    mass: number
    muK: number
  }
  requirePrediction?: boolean
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
  | EquationFillStep
  | PredictMCStep
  | PredictNumericStep
  | SimStep
  | CompleteStep

export type Lesson = {
  id: string
  title: string
  order: number
  steps: Step[]
}

export type PushBlockParams = {
  force: number
  distance: number
  mass: number
  muK: number
}

export type StepDraft = {
  answer?: string | number
  selectedIndex?: number
  showWrongFeedback: boolean
  feedbackText?: string
  attemptCount: number
}

export type LessonProgress = {
  lessonId: string
  stepIndex: number
  simParams: PushBlockParams
  stepDraft?: StepDraft | null
  updatedAt: string
}

export type GradeResult = {
  correct: boolean
  hint?: string
}
