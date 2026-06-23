import { useCallback, useRef, useState, type PointerEvent } from 'react'
import type { BarDragStep, StepDraft } from '../../types/lesson'
import { gradeNumeric, hintForNumeric } from '../../lib/grading'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'

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

  const setFromClientY = useCallback(
    (clientY: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const fromBottom = rect.bottom - clientY
      const ratio = Math.max(0, Math.min(1, fromBottom / TRACK_PX))
      const next = Math.round(ratio * step.maxValue)
      if (next !== lastSnappedValue.current) {
        lastSnappedValue.current = next
        navigator.vibrate?.(8)
      }
      setValue(next)
      onDraftChange({
        answer: next,
        showWrongFeedback: feedback?.variant === 'error',
        feedbackText: feedback?.variant === 'error' ? feedback.text : undefined,
        attemptCount: attempt,
      })
    },
    [step.maxValue, onDraftChange, feedback, attempt],
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

  const submit = () => {
    const result = gradeNumeric(value, step.correctValue, step.tolerance)
    if (result.correct) {
      onAttempt?.(value, true)
      onDraftChange(null)
      setFeedback({
        variant: 'success',
        text: `Nice! ${step.barLabel} = ${step.correctValue} ${step.unit}`,
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

      <div className="bar-drag">
        <div className="bar-drag__readout">
          <span className="bar-drag__label">
            <PhysicsText text={step.barLabel} />
          </span>
          <span className="bar-drag__value">
            {value} {step.unit}
            {step.unit === 'J' && (
              <span className="bar-drag__unit-note">Joule = N·m</span>
            )}
          </span>
        </div>

        <div className="bar-drag__track-row">
          <div
            ref={trackRef}
            className="bar-drag__track"
            style={{ height: TRACK_PX }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={step.maxValue}
            aria-valuenow={value}
            aria-label={`Drag to set ${step.barLabel}`}
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

        <p className="bar-drag__hint">Drag the bar — snaps to whole numbers</p>
      </div>

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}

      <button type="button" className="btn btn--primary" onClick={submit}>
        {feedback?.variant === 'error' ? 'Try again' : 'Check'}
      </button>
    </div>
  )
}
