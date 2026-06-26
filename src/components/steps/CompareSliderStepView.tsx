import { useMemo, useState } from 'react'
import type { CompareSliderStep, StepDraft } from '../../types/lesson'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'
import { WhyPanel } from '../WhyPanel'
import { CompareScene } from './CompareScene'
import { useEnterAdvance } from '../../lib/useEnterAdvance'

type Props = {
  step: CompareSliderStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: number, correct: boolean, hint?: string) => void
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function compute(coeff: number, power: number, v: number): number {
  return coeff * Math.pow(v, power)
}

export function CompareSliderStepView({ step, onDraftChange, onCorrect, onAttempt }: Props) {
  const [v, setV] = useState<number>(step.base)
  const [guess, setGuess] = useState('')
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)

  useEnterAdvance(onCorrect, solved)

  const baseResult = compute(step.result.coeff, step.result.power, step.base)
  const current = compute(step.result.coeff, step.result.power, v)
  const actualFactor = baseResult !== 0 ? current / baseResult : 1
  const moved = Math.abs(v - step.base) > step.stepSize / 2

  const constSymbols = useMemo(
    () => new Set((step.constants ?? []).map((c) => c.symbol)),
    [step.constants],
  )

  const formulaTokens = step.formula.split(' ').map((tok, i) => {
    if (tok === step.varSymbol) {
      return (
        <span key={i} className="cmp__tok cmp__tok--var">
          <PhysicsText text={tok} />
        </span>
      )
    }
    if (constSymbols.has(tok)) {
      return (
        <span key={i} className="cmp__tok cmp__tok--const">
          <PhysicsText text={tok} />
        </span>
      )
    }
    return (
      <span key={i} className="cmp__tok">
        <PhysicsText text={tok} />
      </span>
    )
  })

  const setValue = (next: number) => {
    const clamped = Math.max(step.min, Math.min(step.max, next))
    setV(clamped)
    if (feedback?.variant === 'error') setFeedback(null)
  }

  // Scale both bars to the larger result across the slider's range.
  const maxResult = Math.max(
    compute(step.result.coeff, step.result.power, step.max),
    compute(step.result.coeff, step.result.power, step.min),
    baseResult,
    current,
  )
  const basePct = maxResult > 0 ? (baseResult / maxResult) * 100 : 0
  const nowPct = maxResult > 0 ? (current / maxResult) * 100 : 0

  const submit = () => {
    const typed = Number(guess)
    if (guess.trim() === '' || !Number.isFinite(typed)) {
      setFeedback({ variant: 'error', text: 'Type how many times bigger the result got (e.g. 2 or 4).' })
      return
    }
    const tol = Math.max(0.1, actualFactor * 0.05)
    if (Math.abs(typed - actualFactor) <= tol) {
      setSolved(true)
      setFeedback({
        variant: 'success',
        text: `Exactly — ${fmt(current)} ÷ ${fmt(baseResult)} = ${fmt(Math.round(actualFactor * 100) / 100)}×.`,
      })
      onAttempt?.(typed, true)
      onDraftChange(null)
    } else {
      setFeedback({
        variant: 'error',
        text: 'Not quite — compare the two bars: divide the "now" value by the original.',
      })
      onAttempt?.(typed, false)
    }
  }

  return (
    <div className="step step--compare">
      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

      <div className="cmp__formula">{formulaTokens}</div>

      <div className="cmp__legend">
        <span className="cmp__legend-item cmp__legend-item--var">
          <PhysicsText text={step.varSymbol} /> = {step.varName} (you control)
        </span>
        {(step.constants ?? []).map((c) => (
          <span key={c.symbol} className="cmp__legend-item cmp__legend-item--const">
            <PhysicsText text={c.symbol} /> = {c.value} (fixed)
          </span>
        ))}
      </div>

      {/* the task — tells them what to do, not the answer */}
      <p className="cmp__task">
        <PhysicsText text={step.task} />
      </p>

      {/* the only movable thing: an interactive, draggable scene */}
      <CompareScene
        scene={step.scene ?? 'distance'}
        v={v}
        base={step.base}
        min={step.min}
        max={step.max}
        stepSize={step.stepSize}
        unit={step.varUnit}
        varName={step.varName}
        constLabel={step.constants?.[0]?.value}
        disabled={solved}
        moved={moved}
        onChange={setValue}
      />

      {/* original vs now — read the values, then find the ratio */}
      <div className="cmp__bars">
        <div className="cmp__bar-row">
          <span className="cmp__bar-tag">Original</span>
          <div className="cmp__bar-track">
            <div className="cmp__bar-fill cmp__bar-fill--base" style={{ width: `${basePct}%` }} />
          </div>
          <span className="cmp__bar-val">{fmt(baseResult)} {step.result.unit}</span>
        </div>
        <div className="cmp__bar-row">
          <span className="cmp__bar-tag">Now</span>
          <div className="cmp__bar-track">
            <div className="cmp__bar-fill cmp__bar-fill--now" style={{ width: `${nowPct}%` }} />
          </div>
          <span className="cmp__bar-val">{fmt(current)} {step.result.unit}</span>
        </div>
      </div>

      {/* fill in the blank */}
      <div className="cmp__blank">
        <span className="cmp__blank-pre">So <PhysicsText text={step.result.symbol} /> is now</span>
        <input
          type="number"
          inputMode="decimal"
          className="cmp__blank-input"
          value={guess}
          readOnly={solved}
          onChange={(e) => {
            setGuess(e.target.value)
            if (feedback?.variant === 'error') setFeedback(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.repeat) {
              e.preventDefault()
              if (solved) onCorrect()
              else submit()
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="?"
          aria-label="How many times the original"
        />
        <span className="cmp__blank-post">× the original.</span>
      </div>

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}

      {step.solution && <WhyPanel solved={solved} solution={step.solution} />}

      {solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button type="button" className="btn btn--primary" onClick={submit}>
          Check
        </button>
      )}
    </div>
  )
}
