import { useState } from 'react'
import type { PredictMCStep, StepDraft } from '../../types/lesson'
import { gradeMC } from '../../lib/grading'
import { Feedback } from '../Feedback'
import { StuckHelp, STUCK_THRESHOLD } from '../StuckHelp'
import { WhyPanel } from '../WhyPanel'
import { buildSolution } from '../../lib/solution'

type Props = {
  step: PredictMCStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: string, correct: boolean, hint?: string) => void
}

export function PredictMCStepView({
  step,
  draft,
  onDraftChange,
  onCorrect,
  onAttempt,
}: Props) {
  const [selected, setSelected] = useState<number | null>(draft?.selectedIndex ?? null)
  const [attempt, setAttempt] = useState(draft?.attemptCount ?? 0)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    () =>
      draft?.showWrongFeedback && draft.feedbackText
        ? { variant: 'error', text: draft.feedbackText }
        : null,
  )
  const solution = buildSolution(step)

  const pick = (i: number) => {
    setSelected(i)
    onDraftChange({
      selectedIndex: i,
      answer: step.choices[i],
      showWrongFeedback: feedback?.variant === 'error',
      feedbackText: feedback?.variant === 'error' ? feedback.text : undefined,
      attemptCount: attempt,
    })
  }

  const submit = () => {
    if (selected === null) return
    const result = gradeMC(selected, step.correctIndex, step.hints, attempt)
    const choice = step.choices[selected] ?? String(selected)
    if (result.correct) {
      onAttempt?.(choice, true)
      onDraftChange(null)
      setSolved(true)
      setFeedback({ variant: 'success', text: 'Correct!' })
    } else {
      const nextAttempt = attempt + 1
      setAttempt(nextAttempt)
      onAttempt?.(choice, false, result.hint)
      const errorText = result.hint ?? 'Try again.'
      setFeedback({ variant: 'error', text: errorText })
      onDraftChange({
        selectedIndex: selected,
        answer: choice,
        showWrongFeedback: true,
        feedbackText: errorText,
        attemptCount: nextAttempt,
      })
    }
  }

  return (
    <div className="step step--mc">
      <p className="step__prompt">{step.prompt}</p>
      <div className="choices">
        {step.choices.map((choice, i) => (
          <button
            key={choice}
            type="button"
            disabled={solved}
            className={`choice ${selected === i ? 'choice--selected' : ''} ${feedback?.variant === 'error' && selected === i ? 'choice--wrong' : ''} ${solved && i === step.correctIndex ? 'choice--correct' : ''}`}
            onClick={() => pick(i)}
          >
            {choice}
          </button>
        ))}
      </div>
      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}
      {!solved && attempt >= STUCK_THRESHOLD && feedback?.variant === 'error' && (
        <StuckHelp answer={step.choices[step.correctIndex]} solution={solution} />
      )}

      <WhyPanel solved={solved} solution={solution} />

      {solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--primary"
          disabled={selected === null}
          onClick={submit}
        >
          {feedback?.variant === 'error' ? 'Try again' : 'Check'}
        </button>
      )}
    </div>
  )
}
