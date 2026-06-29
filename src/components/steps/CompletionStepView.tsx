import { useRef, useState } from 'react'
import type { CompletionStep, Confidence } from '../../types/lesson'
import { gradeNumeric } from '../../lib/grading'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'
import { WhyPanel } from '../WhyPanel'
import { ConfidencePicker } from '../ConfidencePicker'
import { calibrationMessage } from '../../lib/calibration'
import { useEnterAdvance } from '../../lib/useEnterAdvance'
import { useAutoFocus } from '../../lib/useAutoFocus'
import { ProblemVisualView } from '../diagrams/ProblemVisualView'

type Props = {
  step: CompletionStep
  onCorrect: () => void
  onAttempt?: (
    answer: number,
    correct: boolean,
    hint?: string,
    confidence?: Confidence,
  ) => void
}

/**
 * Middle rung of worked-example fading: the setup is done for the learner and
 * they finish only the final step. Pairs the completion with a confidence rating
 * so the metacognitive habit rides along with the fading scaffold.
 */
export function CompletionStepView({ step, onCorrect, onAttempt }: Props) {
  const [value, setValue] = useState('')
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [calibNote, setCalibNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEnterAdvance(onCorrect, solved)
  useAutoFocus(inputRef, !solved)

  const calibrate = step.calibrate !== false
  const canSubmit = value.trim() !== '' && (!calibrate || confidence !== null)

  const submit = () => {
    if (!canSubmit) return
    const num = Number(value)
    const result = gradeNumeric(num, step.correctValue, step.tolerance)
    if (calibrate && confidence) setCalibNote(calibrationMessage(confidence, result.correct))
    if (result.correct) {
      onAttempt?.(num, true, undefined, confidence ?? undefined)
      setSolved(true)
      setFeedback({ variant: 'success', text: `Correct! ${step.correctValue} ${step.unit}` })
    } else {
      const nextAttempt = attempt + 1
      setAttempt(nextAttempt)
      onAttempt?.(num, false, step.hint, confidence ?? undefined)
      setFeedback({ variant: 'error', text: step.hint ?? 'Not quite — check your arithmetic.' })
      setConfidence(null)
    }
  }

  return (
    <div className="step step--completion">
      <div className="worked__tag worked__tag--completion">
        Completion problem · finish the last step
      </div>

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

      {step.givens && step.givens.length > 0 && (
        <div className="bar-drag__givens">
          {step.givens.map(({ label, value }) => (
            <span key={label} className="bar-drag__given">
              <PhysicsText text={label} /> = {value}
            </span>
          ))}
        </div>
      )}

      <ol className="worked__steps worked__steps--scaffold">
        {step.shownSteps.map((line, i) => (
          <li key={i} className="worked__step">
            <PhysicsText text={line} />
          </li>
        ))}
        <li className="worked__step worked__step--blank">
          <span className="worked__blank-label">You finish it:</span>
        </li>
      </ol>

      <div className="numeric-input">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          value={value}
          readOnly={solved}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.repeat) {
              e.preventDefault()
              if (solved) onCorrect()
              else submit()
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="Final value"
          aria-label="Final value"
        />
        <span className="numeric-input__unit">{step.unit}</span>
      </div>

      {calibrate && !solved && (
        <ConfidencePicker value={confidence} onChange={setConfidence} />
      )}

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}
      {calibNote && <p className="calib-note">{calibNote}</p>}

      {step.solution && <WhyPanel solved={solved} solution={step.solution} />}

      {solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--primary"
          onClick={submit}
          disabled={!canSubmit}
        >
          {!canSubmit && calibrate && value.trim() !== ''
            ? 'Rate your confidence to check'
            : feedback?.variant === 'error'
              ? 'Try again'
              : 'Check'}
        </button>
      )}
    </div>
  )
}
