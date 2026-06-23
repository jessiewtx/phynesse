import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { BarDragStep, StepDraft } from '../../types/lesson'
import { gradeNumeric, hintForNumeric } from '../../lib/grading'
import { PhysicsText } from '../../lib/physicsText'
import { EnergyReadout } from '../EnergyReadout'
import { Feedback } from '../Feedback'
import { StuckHelp, STUCK_THRESHOLD } from '../StuckHelp'

type Props = {
  step: BarDragStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: number, correct: boolean, hint?: string) => void
}

const TRACK_PX = 220

function initialValue(draft: StepDraft | null): number {
  if (typeof draft?.answer === 'number') return draft.answer
  return 0
}

export function BarDragStepView({ step, draft, onDraftChange, onCorrect, onAttempt }: Props) {
  const [value, setValue] = useState(() => initialValue(draft))
  const [attempt, setAttempt] = useState(() => draft?.attemptCount ?? 0)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    () =>
      draft?.showWrongFeedback && draft.feedbackText
        ? { variant: 'error', text: draft.feedbackText }
        : null,
  )
  const dragging = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastSnappedValue = useRef<number | null>(null)

  const heightPct = (value / step.maxValue) * 100

  const applyValue = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(step.maxValue, next))
      if (clamped !== lastSnappedValue.current) {
        lastSnappedValue.current = clamped
        navigator.vibrate?.(8)
      }
      setValue(clamped)
      onDraftChange({
        answer: clamped,
        showWrongFeedback: feedback?.variant === 'error',
        feedbackText: feedback?.variant === 'error' ? feedback.text : undefined,
        attemptCount: attempt,
      })
    },
    [step.maxValue, onDraftChange, feedback, attempt],
  )

  const setFromClientY = useCallback(
    (clientY: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const fromBottom = rect.bottom - clientY
      const ratio = Math.max(0, Math.min(1, fromBottom / TRACK_PX))
      applyValue(Math.round(ratio * step.maxValue))
    },
    [step.maxValue, applyValue],
  )

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClientY(e.clientY)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    setFromClientY(e.clientY)
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      applyValue(value + 1)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      applyValue(value - 1)
    }
  }

  const submit = () => {
    const result = gradeNumeric(value, step.correctValue, step.tolerance)
    if (result.correct) {
      onAttempt?.(value, true)
      onDraftChange(null)
      setFeedback({
        variant: 'success',
        text: `Nice! ${step.correctValue} ${step.unit}`,
      })
      setTimeout(onCorrect, 700)
    } else {
      const nextAttempt = attempt + 1
      const hint = hintForNumeric(step.hints, attempt)
      setAttempt(nextAttempt)
      onAttempt?.(value, false, hint)
      const errorText = hint ?? 'Adjust the bar and try again.'
      setFeedback({ variant: 'error', text: errorText })
      onDraftChange({
        answer: value,
        showWrongFeedback: true,
        feedbackText: errorText,
        attemptCount: nextAttempt,
      })
    }
  }

  return (
    <div className="step step--bar-drag">
      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

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

      <div className="bar-drag">
        <EnergyReadout
          label={step.barLabel}
          value={value}
          unit={step.unit}
          color={step.barColor}
          note={step.unit === 'J' ? 'Joule = N·m' : undefined}
        />

        <div className="bar-drag__track-row">
          <div className="bar-drag__steppers">
            <button
              type="button"
              className="bar-drag__step-btn"
              onClick={() => applyValue(value + 1)}
              aria-label="Increase"
            >
              +
            </button>
            <button
              type="button"
              className="bar-drag__step-btn"
              onClick={() => applyValue(value - 1)}
              aria-label="Decrease"
            >
              −
            </button>
          </div>

          <div
            ref={trackRef}
            className="bar-drag__track"
            style={{ height: TRACK_PX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={step.maxValue}
            aria-valuenow={value}
            aria-label={`Set ${step.barLabel}`}
          >
            {value > 0 && (
              <div
                className="bar-drag__fill"
                style={{ height: `${heightPct}%`, background: step.barColor }}
              />
            )}
            <div
              className="bar-drag__handle"
              style={{ bottom: `calc(${heightPct}% - 0.325rem)` }}
            />
          </div>

          <div className="bar-drag__ticks" style={{ height: TRACK_PX }}>
            {Array.from({ length: Math.floor(step.maxValue / 5) + 1 }, (_, i) => i * 5)
              .filter(v => v <= step.maxValue)
              .map(v => (
                <div
                  key={v}
                  className="bar-drag__tick"
                  style={{ bottom: `${(v / step.maxValue) * 100}%` }}
                >
                  <span className="bar-drag__tick-label">{v}</span>
                </div>
              ))}
          </div>
        </div>

        <p className="bar-drag__hint">Drag, use + / −, or arrow keys</p>
      </div>

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}

      {attempt >= STUCK_THRESHOLD && feedback?.variant === 'error' && (
        <StuckHelp
          answer={`${step.correctValue} ${step.unit}`}
          explanation={step.hints[step.hints.length - 1]}
          nudge="Set the bar to this value, then tap Check to continue."
        />
      )}

      <button type="button" className="btn btn--primary" onClick={submit}>
        {feedback?.variant === 'error' ? 'Try again' : 'Check'}
      </button>
    </div>
  )
}
