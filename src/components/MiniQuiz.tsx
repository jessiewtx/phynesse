import { useEffect, useRef, useState } from 'react'
import type { ConceptId } from '../lib/physics'
import { generatePractice, type GeneratedProblem } from '../lib/ai'
import { toBarDragStep } from '../lib/practiceProblem'
import { BarDragStepView } from './steps/BarDragStepView'
import type { StepDraft } from '../types/lesson'

type Props = {
  /** One generated problem per concept, in this order (interleaved by the caller). */
  concepts: ConceptId[]
  /** Called when every problem is finished, with the first-try score. */
  onDone: (correctFirstTry: number, total: number) => void
  /** Called if the learner bails out — it's always optional, never a gate. */
  onSkip: () => void
  /** Hide the formula up front so the learner must recall which idea applies
   *  (desirable difficulty). The formula still appears as a post-miss hint. */
  hideFormula?: boolean
  skipLabel?: string
}

/**
 * A short, self-contained run of engine-generated problems — the shared engine
 * behind the retrieval warm-up (one problem from a prior concept) and the
 * end-of-lesson interleaved check (a few problems mixing concepts). Every problem
 * is minted and graded by the deterministic physics core, so it works AI-off.
 */
export function MiniQuiz({ concepts, onDone, onSkip, hideFormula = true, skipLabel = 'Skip for now' }: Props) {
  const key = concepts.join(',')
  const [problems, setProblems] = useState<GeneratedProblem[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<StepDraft | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  // Did the learner miss the CURRENT problem at least once before solving it?
  const missed = useRef(false)

  useEffect(() => {
    let alive = true
    setProblems(null)
    setIdx(0)
    setResults([])
    setDraft(null)
    missed.current = false
    void Promise.all(concepts.map((c) => generatePractice(c, 'medium'))).then((ps) => {
      if (alive) setProblems(ps)
    })
    return () => {
      alive = false
    }
    // key captures the concept list; regenerating only when it actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!problems) {
    return (
      <div className="miniquiz__loading">
        <span className="practice__spinner" />
        <span>Pulling a fresh problem…</span>
      </div>
    )
  }

  const total = problems.length
  const problem = problems[idx]
  const fullStep = toBarDragStep(problem)
  const step = hideFormula ? { ...fullStep, formulas: undefined } : fullStep

  const handleAttempt = (_answer: number, correct: boolean) => {
    if (!correct) missed.current = true
  }

  const handleSolved = () => {
    const next = [...results, !missed.current]
    setResults(next)
    missed.current = false
    setDraft(null)
    if (next.length >= total) {
      onDone(next.filter(Boolean).length, total)
    } else {
      setIdx((i) => i + 1)
    }
  }

  return (
    <div className="miniquiz">
      {total > 1 && (
        <div className="capstone-track miniquiz__track">
          {problems.map((_, i) => (
            <span
              key={i}
              className={`capstone-track__pip${
                i < idx ? (results[i] ? ' is-correct' : ' is-missed') : i === idx ? ' is-current' : ''
              }`}
            />
          ))}
        </div>
      )}
      <div className="miniquiz__card">
        <BarDragStepView
          key={idx}
          step={step}
          draft={draft}
          onDraftChange={setDraft}
          onCorrect={handleSolved}
          onAttempt={handleAttempt}
        />
      </div>
      <button type="button" className="miniquiz__skip" onClick={onSkip}>
        {skipLabel}
      </button>
    </div>
  )
}
