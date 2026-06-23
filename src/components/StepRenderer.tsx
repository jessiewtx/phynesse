import type { Step, PushBlockParams, StepDraft } from '../types/lesson'
import { ConceptStepView } from './steps/ConceptStepView'
import { BarDragStepView } from './steps/BarDragStepView'
import { PredictMCStepView } from './steps/PredictMCStepView'
import { PredictNumericStepView } from './steps/PredictNumericStepView'
import { SimStepView } from './steps/SimStepView'
import { CompleteStepView } from './steps/CompleteStepView'

type AttemptHandler = (
  stepType: string,
  answer: string | number,
  correct: boolean,
  hint?: string,
) => void

type Props = {
  step: Step
  stepDraft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  simParams: PushBlockParams
  onSimChange: (params: PushBlockParams) => void
  onAdvance: () => void
  onComplete: () => void
  onAttempt: AttemptHandler
}

export function StepRenderer({
  step,
  stepDraft,
  onDraftChange,
  simParams,
  onSimChange,
  onAdvance,
  onComplete,
  onAttempt,
}: Props) {
  const log = (answer: string | number, correct: boolean, hint?: string) => {
    onAttempt(step.type, answer, correct, hint)
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
    case 'predict_mc':
      return (
        <PredictMCStepView
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
          onAttempt={(answer, correct, hint) => log(answer, correct, hint)}
        />
      )
    case 'sim':
      return (
        <SimStepView
          step={step}
          params={simParams}
          onChange={onSimChange}
          onContinue={onAdvance}
        />
      )
    case 'complete':
      return <CompleteStepView step={step} onFinish={onComplete} />
    default:
      return null
  }
}
