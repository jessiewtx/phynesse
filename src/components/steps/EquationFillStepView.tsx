import { useState, type DragEvent } from 'react'
import type { EquationFillStep, StepDraft } from '../../types/lesson'
import { gradeNumeric, hintForNumeric } from '../../lib/grading'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'
import { StuckHelp, STUCK_THRESHOLD } from '../StuckHelp'
import { WhyPanel } from '../WhyPanel'
import { buildSolution } from '../../lib/solution'

type Props = {
  step: EquationFillStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: string | number, correct: boolean, hint?: string) => void
}

function slotIdsOf(step: EquationFillStep): string[] {
  return step.template.flatMap((seg) => ('slot' in seg ? [seg.slot] : []))
}

export function EquationFillStepView({ step, draft, onDraftChange, onCorrect, onAttempt }: Props) {
  const slotIds = slotIdsOf(step)
  const startCompute = draft?.selectedIndex === 1

  // slotId -> token index placed there (or null)
  const [placed, setPlaced] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(slotIds.map((id) => [id, null])),
  )
  const [phase, setPhase] = useState<'fill' | 'compute'>(startCompute ? 'compute' : 'fill')
  const [answer, setAnswer] = useState<string>(
    startCompute && typeof draft?.answer === 'string' ? draft.answer : '',
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

  const usedTokens = new Set(Object.values(placed).filter((v): v is number => v !== null))
  const allFilled = slotIds.every((id) => placed[id] !== null)

  const place = (slotId: string, tokenIndex: number) => {
    setFeedback(null)
    setPlaced((prev) => {
      const next = { ...prev }
      // remove this token from any slot it already sits in
      for (const id of slotIds) if (next[id] === tokenIndex) next[id] = null
      next[slotId] = tokenIndex
      return next
    })
  }

  const placeNextEmpty = (tokenIndex: number) => {
    const target = slotIds.find((id) => placed[id] === null)
    if (target) place(target, tokenIndex)
  }

  const clearSlot = (slotId: string) => {
    setFeedback(null)
    setPlaced((prev) => ({ ...prev, [slotId]: null }))
  }

  const onDrop = (e: DragEvent<HTMLSpanElement>, slotId: string) => {
    e.preventDefault()
    const ti = Number(e.dataTransfer.getData('text/plain'))
    if (!Number.isNaN(ti)) place(slotId, ti)
  }

  const checkFill = () => {
    const correct = slotIds.every((id) => {
      const ti = placed[id]
      return ti !== null && step.tokens[ti] === step.slots[id]
    })
    if (correct) {
      setFeedback({ variant: 'success', text: 'Placed right — now compute it.' })
      onAttempt?.('fill', true)
      setPhase('compute')
      onDraftChange({ selectedIndex: 1, showWrongFeedback: false, attemptCount: attempt })
    } else {
      const hint = step.fillHint ?? 'Match each value to its variable.'
      setFeedback({ variant: 'error', text: hint })
      onAttempt?.('fill', false, hint)
    }
  }

  const checkCompute = () => {
    const num = Number(answer)
    const result = gradeNumeric(num, step.result.value, step.result.tolerance)
    if (result.correct) {
      onAttempt?.(num, true)
      onDraftChange(null)
      setSolved(true)
      setFeedback({ variant: 'success', text: `Correct! ${step.result.value} ${step.result.unit}` })
    } else {
      const nextAttempt = attempt + 1
      const hint = hintForNumeric(step.computeHints, attempt)
      setAttempt(nextAttempt)
      onAttempt?.(num, false, hint)
      const text = hint ?? 'Not quite — recompute.'
      setFeedback({ variant: 'error', text })
      onDraftChange({
        answer,
        selectedIndex: 1,
        showWrongFeedback: true,
        feedbackText: text,
        attemptCount: nextAttempt,
      })
    }
  }

  return (
    <div className="step step--eqfill">
      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

      <div className="eqfill__eq">
        {step.template.map((seg, i) =>
          'text' in seg ? (
            <span key={i} className="eqfill__text">
              {seg.text}
            </span>
          ) : phase === 'fill' ? (
            <span
              key={i}
              className={`eqfill__slot ${placed[seg.slot] !== null ? 'eqfill__slot--filled' : 'eqfill__slot--empty'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, seg.slot)}
              onClick={() => placed[seg.slot] !== null && clearSlot(seg.slot)}
              title={step.slotLabels?.[seg.slot]}
            >
              {placed[seg.slot] !== null ? step.tokens[placed[seg.slot]!] : seg.slot}
            </span>
          ) : (
            <span key={i} className="eqfill__slot eqfill__slot--locked">
              {step.slots[seg.slot]}
            </span>
          ),
        )}
        {phase === 'compute' && (
          <>
            <span className="eqfill__text"> = </span>
            <input
              className="eqfill__input"
              type="number"
              inputMode="decimal"
              value={answer}
              placeholder="?"
              readOnly={solved}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <span className="eqfill__text">{step.result.unit}</span>
          </>
        )}
      </div>

      {phase === 'fill' && (
        <div className="eqfill__tokens" aria-label="Values to place">
          {step.tokens.map((value, i) =>
            usedTokens.has(i) ? (
              <span key={i} className="eqfill__token eqfill__token--used" aria-hidden="true" />
            ) : (
              <button
                key={i}
                type="button"
                className="eqfill__token"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
                onClick={() => placeNextEmpty(i)}
              >
                {value}
              </button>
            ),
          )}
        </div>
      )}

      {phase === 'fill' && (
        <p className="eqfill__hint">Drag a value into each blank — or tap it. Tap a filled blank to clear.</p>
      )}

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}

      {phase === 'compute' && !solved && attempt >= STUCK_THRESHOLD && feedback?.variant === 'error' && (
        <StuckHelp answer={`${step.result.value} ${step.result.unit}`} solution={solution} />
      )}

      {phase === 'compute' && <WhyPanel solved={solved} solution={solution} />}

      {phase === 'fill' ? (
        <button type="button" className="btn btn--primary" onClick={checkFill} disabled={!allFilled}>
          Check placement
        </button>
      ) : solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--primary"
          onClick={checkCompute}
          disabled={answer.trim() === ''}
        >
          {feedback?.variant === 'error' ? 'Try again' : 'Check'}
        </button>
      )}
    </div>
  )
}
