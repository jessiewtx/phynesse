import type { Confidence, Step, StepDraft } from '../types/lesson'
import { ConceptStepView } from './steps/ConceptStepView'
import { BarDragStepView } from './steps/BarDragStepView'
import { PredictNumericStepView } from './steps/PredictNumericStepView'
import { CompareSliderStepView } from './steps/CompareSliderStepView'
import { WorkedExampleStepView } from './steps/WorkedExampleStepView'
import { CompletionStepView } from './steps/CompletionStepView'
import { FillBlanksStepView } from './steps/FillBlanksStepView'
import { CompleteStepView } from './steps/CompleteStepView'

type AttemptHandler = (
  stepType: string,
  answer: string | number,
  correct: boolean,
  hint?: string,
  confidence?: Confidence,
) => void

type Props = {
  step: Step
  lessonId?: string
  stepDraft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onAdvance: () => void
  onComplete: () => void
  onRestart: () => void
  onAttempt: AttemptHandler
}

export function StepRenderer({
  step,
  lessonId,
  stepDraft,
  onDraftChange,
  onAdvance,
  onComplete,
  onRestart,
  onAttempt,
}: Props) {
  const log = (
    answer: string | number,
    correct: boolean,
    hint?: string,
    confidence?: Confidence,
  ) => {
    onAttempt(step.type, answer, correct, hint, confidence)
  }

  switch (step.type) {
    case 'concept':
      return <ConceptStepView step={step} onContinue={onAdvance} />
    case 'bar_drag':
      return (
        <BarDragStepView
          step={step}
          draft={stepDraft}
          onDraftChange={onDraftChange}
          onCorrect={onAdvance}
          onAttempt={(answer, correct, hint) => log(answer, correct, hint)}
        />
      )
    case 'predict_numeric':
      return (
        <PredictNumericStepView
          step={step}
          draft={stepDraft}
          onDraftChange={onDraftChange}
          onCorrect={onAdvance}
          onAttempt={(answer, correct, hint, confidence) =>
            log(answer, correct, hint, confidence)
          }
        />
      )
    case 'worked_example':
      return <WorkedExampleStepView step={step} onContinue={onAdvance} />
    case 'completion':
      return (
        <CompletionStepView
          step={step}
          onCorrect={onAdvance}
          onAttempt={(answer, correct, hint, confidence) =>
            log(answer, correct, hint, confidence)
          }
        />
      )
    case 'fill_blanks':
      return (
        <FillBlanksStepView
          step={step}
          draft={stepDraft}
          onDraftChange={onDraftChange}
          onCorrect={onAdvance}
          onAttempt={(answer, correct, hint) => log(answer, correct, hint)}
        />
      )
    case 'compare_slider':
      return (
        <CompareSliderStepView
          step={step}
          draft={stepDraft}
          onDraftChange={onDraftChange}
          onCorrect={onAdvance}
          onAttempt={(answer, correct, hint) => log(answer, correct, hint)}
        />
      )
    case 'complete':
      return (
        <CompleteStepView
          step={step}
          lessonId={lessonId}
          onFinish={onComplete}
          onRestart={onRestart}
        />
      )
    default:
      return null
  }
}
