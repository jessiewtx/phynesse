import { useState } from 'react'
import type { PredictNumericStep, StepDraft } from '../../types/lesson'
import { gradeNumeric, hintForNumeric } from '../../lib/grading'
import { Feedback } from '../Feedback'
import { StuckHelp, STUCK_THRESHOLD } from '../StuckHelp'
import { WhyPanel } from '../WhyPanel'
import { buildSolution } from '../../lib/solution'

type Props = {
  step: PredictNumericStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: number, correct: boolean, hint?: string) => void
}

export function PredictNumericStepView({
  step,
  draft,
  onDraftChange,
  onCorrect,
  onAttempt,
}: Props) {
  const [value, setValue] = useState(() =>
    draft?.answer !== undefined ? String(draft.answer) : '',
  )
  const [attempt, setAttempt] = useState(draft?.attemptCount ?? 0)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    () =>
      draft?.showWrongFeedback && draft.feedbackText
        ? { variant: 'error', text: draft.feedbackText }
        : null,
  )
  const solution = buildSolution(step)

  const submit = () => {
    const num = Number(value)
    const result = gradeNumeric(num, step.correctValue, step.tolerance)
    if (result.correct) {
      onAttempt?.(num, true)
      onDraftChange(null)
      setSolved(true)
      setFeedback({ variant: 'success', text: `Correct! ${step.correctValue} ${step.unit}` })
    } else {
      const nextAttempt = attempt + 1
      const hint = hintForNumeric(step.hints, attempt)
      setAttempt(nextAttempt)
      onAttempt?.(num, false, hint)
      const errorText = hint ?? 'Try again.'
      setFeedback({ variant: 'error', text: errorText })
      onDraftChange({
        answer: num,
        showWrongFeedback: true,
        feedbackText: errorText,
        attemptCount: nextAttempt,
      })
    }
  }

  return (
    <div className="step step--numeric">
      <p className="step__prompt">{step.prompt}</p>
      <div className="numeric-input">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          readOnly={solved}
          onChange={(e) => {
            setValue(e.target.value)
            onDraftChange({
              answer: e.target.value,
              showWrongFeedback: feedback?.variant === 'error',
              feedbackText: feedback?.variant === 'error' ? feedback.text : undefined,
              attemptCount: attempt,
            })
          }}
          placeholder="Your answer"
          aria-label="Numeric answer"
        />
        <span className="numeric-input__unit">{step.unit}</span>
      </div>
      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}
      {!solved && attempt >= STUCK_THRESHOLD && feedback?.variant === 'error' && (
        <StuckHelp answer={`${step.correctValue} ${step.unit}`} solution={solution} />
      )}

      <WhyPanel solved={solved} solution={solution} />

      {solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button type="button" className="btn btn--primary" onClick={submit}>
          {feedback?.variant === 'error' ? 'Try again' : 'Check'}
        </button>
      )}
    </div>
  )
}
