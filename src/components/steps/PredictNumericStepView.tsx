import { useState } from 'react'
import type { PredictNumericStep, StepDraft } from '../../types/lesson'
import { gradeNumeric, hintForNumeric } from '../../lib/grading'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'
import { SixSevenPopup } from '../SixSevenPopup'
import { StuckHelp, STUCK_THRESHOLD } from '../StuckHelp'
import { WhyPanel } from '../WhyPanel'
import { buildSolution } from '../../lib/solution'
import { aiEnabled } from '../../lib/ai'
import { useEnterAdvance } from '../../lib/useEnterAdvance'
import { ProblemVisualView } from '../diagrams/ProblemVisualView'

type Props = {
  step: PredictNumericStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: number, correct: boolean, hint?: string) => void
}

/** True when a value's significant digits are "67" — i.e. 6.7 × 10ⁿ
 *  (6.7, 67, 670, 0.67, 0.067, …). Powers the "six seven" easter egg. */
function isSixSeven(value: number): boolean {
  if (!Number.isFinite(value) || value === 0) return false
  let m = Math.abs(value)
  while (m >= 10) m /= 10
  while (m < 1) m *= 10
  return Math.abs(m - 6.7) < 1e-3
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
  const [sixSeven, setSixSeven] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    () =>
      draft?.showWrongFeedback && draft.feedbackText
        ? { variant: 'error', text: draft.feedbackText }
        : null,
  )
  const solution = buildSolution(step)

  useEnterAdvance(onCorrect, solved)

  const submit = () => {
    const num = Number(value)
    const result = gradeNumeric(num, step.correctValue, step.tolerance)
    if (result.correct) {
      onAttempt?.(num, true)
      onDraftChange(null)
      setSolved(true)
      setFeedback({ variant: 'success', text: `Correct! ${step.correctValue} ${step.unit}` })
      if (isSixSeven(step.correctValue)) setSixSeven(true)
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
      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

      {step.visual && <ProblemVisualView visual={step.visual} />}

      {step.formulas && step.formulas.length > 0 && (
        <div className="bar-drag__formulas">
          {step.formulas.map((f) => (
            <span key={f} className="bar-drag__formula">
              <PhysicsText text={f} />
            </span>
          ))}
        </div>
      )}

      {step.givens && step.givens.length > 0 && attempt > 0 && (
        <div className="bar-drag__givens-reveal">
          <span className="bar-drag__givens-label">First hint · here's what you're given</span>
          <div className="bar-drag__givens">
            {step.givens.map(({ label, value }) => (
              <span key={label} className="bar-drag__given">
                <PhysicsText text={label} /> = {value}
              </span>
            ))}
          </div>
        </div>
      )}

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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.repeat) {
              e.preventDefault()
              if (solved) onCorrect()
              else submit()
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Your answer"
          aria-label="Numeric answer"
        />
        <span className="numeric-input__unit">{step.unit}</span>
      </div>
      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}
      {sixSeven && <SixSevenPopup onClose={() => setSixSeven(false)} />}
      {!solved && !aiEnabled && attempt >= STUCK_THRESHOLD && feedback?.variant === 'error' && (
        <StuckHelp
          answer={`${step.correctValue} ${step.unit}`}
          solution={solution}
          formulas={step.formulas}
        />
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
