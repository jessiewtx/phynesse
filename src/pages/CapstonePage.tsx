import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  buildInterleavedConcepts,
  CAPSTONE_PASS,
  recordCapstoneAttempt,
  type CapstoneResult,
} from '../lib/capstone'
import { notifyCapstoneChanged } from '../lib/useCapstone'
import { generatePractice, aiEnabled, AI_HELP_AFTER, type GeneratedProblem } from '../lib/ai'
import { toBarDragStep } from '../lib/practiceProblem'
import { classifyMiss, recordMiss } from '../lib/bosses'
import { notifyBossesChanged } from '../lib/useBosses'
import { tutorContextForStep } from '../lib/tutorContext'
import { CONCEPTS } from '../lib/physics'
import { BarDragStepView } from '../components/steps/BarDragStepView'
import { AiTutorSidebar } from '../components/AiTutorSidebar'
import type { StepDraft } from '../types/lesson'

/**
 * Mixed Practice — the open, repeatable interleaving session.
 *
 * Learning-science basis: **interleaving** + **retrieval practice**. Instead of
 * blocking (drilling one concept at a time, where the learner coasts on "the last
 * formula I saw"), the session mixes concepts so consecutive problems differ. That
 * forces the harder, more durable skill: first decide *which* idea applies, then
 * apply it. It's open to everyone, anytime — no mastery gate.
 */
export function CapstonePage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [order, setOrder] = useState(() => buildInterleavedConcepts())
  const [problems, setProblems] = useState<GeneratedProblem[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<StepDraft | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [sessionScore, setSessionScore] = useState<number | null>(null)
  const [finalResult, setFinalResult] = useState<CapstoneResult | null>(null)
  // Whether the learner missed the CURRENT problem at least once before solving.
  const missed = useRef(false)
  // Brock, the AI study buddy — always available via a button, and auto-opens
  // after a couple of misses on the current problem (same behavior as lessons).
  const [tutorOpen, setTutorOpen] = useState(false)
  const wrongCount = useRef(0)

  useEffect(() => {
    let alive = true
    setProblems(null)
    void Promise.all(order.map((c) => generatePractice(c, 'medium'))).then((ps) => {
      if (alive) setProblems(ps)
    })
    return () => {
      alive = false
    }
  }, [order])

  const restart = () => {
    missed.current = false
    wrongCount.current = 0
    setTutorOpen(false)
    setIdx(0)
    setResults([])
    setSessionScore(null)
    setFinalResult(null)
    setDraft(null)
    setOrder(buildInterleavedConcepts())
  }

  if (!problems) {
    return (
      <div className="practice">
        <div className="practice__loading">
          <span className="practice__spinner" />
          <span>Assembling your mixed challenge…</span>
        </div>
      </div>
    )
  }

  const total = problems.length

  // ── Result screen ──
  if (idx >= total) {
    const score = sessionScore ?? results.filter(Boolean).length / total
    const pct = Math.round(score * 100)
    const passed = score >= CAPSTONE_PASS
    return (
      <div className="practice practice--empty">
        <div className="review-done">
          <div className="review-done__icon">{passed ? '🏆' : '💪'}</div>
          <h1 className="review-done__title">
            {passed ? 'Mixed challenge cleared!' : 'Nice work — go again'}
          </h1>
          <p className="capstone-score">
            <span className="capstone-score__num" style={{ color: passed ? 'var(--done)' : 'var(--accent)' }}>
              {pct}%
            </span>
            <span className="capstone-score__label">first-try accuracy</span>
          </p>
          <p className="review-done__note">
            {passed
              ? `You handled a mixed bag of problems and picked the right idea each time. Switching between concepts like that is exactly what makes the learning stick.`
              : `${Math.round(CAPSTONE_PASS * 100)}% first-try clears it. The misses point straight at the concepts to firm up — a quick review and another run will get you there.`}
          </p>
          {finalResult && finalResult.attempts > 1 && (
            <p className="capstone-best">Best so far: {Math.round(finalResult.bestScore * 100)}%</p>
          )}
          <div className="review-done__actions">
            <button type="button" className="btn btn--primary" onClick={restart}>
              New mix
            </button>
            <Link to="/progress" className="btn btn--ghost">
              View mastery
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const problem = problems[idx]
  // Interleaving + retrieval: no formula shown up front — the learner must recall
  // which idea applies. The authored hint (the formula) only appears after a miss,
  // so support fades in only when it's actually needed (desirable difficulty).
  const fullStep = toBarDragStep(problem)
  const step = { ...fullStep, formulas: undefined }
  // Brock gets the FULL step (formulas + worked solution) as ground truth so it can
  // guide without the learner seeing the formula up front.
  const tutorContext = tutorContextForStep(fullStep)
  const liveScore = results.filter(Boolean).length

  const handleAttempt = (answer: number, correct: boolean) => {
    if (correct) return
    missed.current = true
    wrongCount.current += 1
    const slip = classifyMiss(problem.value, answer, Object.values(problem.params))
    if (slip) {
      void recordMiss(uid, problem.conceptId, slip).then(() => notifyBossesChanged())
    }
    // After a couple of misses on this problem, auto-open Brock — just like lessons.
    if (aiEnabled && wrongCount.current >= AI_HELP_AFTER) setTutorOpen(true)
  }

  const handleSolved = () => {
    const firstTry = !missed.current
    const nextResults = [...results, firstTry]
    setResults(nextResults)
    missed.current = false
    wrongCount.current = 0
    setTutorOpen(false)
    setDraft(null)
    if (nextResults.length >= total) {
      const score = nextResults.filter(Boolean).length / total
      setSessionScore(score)
      void recordCapstoneAttempt(uid, score).then((r) => {
        setFinalResult(r)
        notifyCapstoneChanged()
      })
    }
    setIdx((i) => i + 1)
  }

  return (
    <div className="practice">
      <header className="practice__header">
        <Link to="/" className="practice__back">
          ← Exit
        </Link>
        <div className="practice__title-block">
          <span className="practice__eyebrow">Mixed practice · interleaved</span>
          <h1 className="practice__title">Name the idea, then solve it</h1>
        </div>
        <span className="practice__count" title="Position in the session">
          {idx + 1} / {total}
        </span>
      </header>

      <div className="capstone-track">
        {problems.map((_, i) => (
          <span
            key={i}
            className={`capstone-track__pip${
              i < idx ? (results[i] ? ' is-correct' : ' is-missed') : i === idx ? ' is-current' : ''
            }`}
          />
        ))}
      </div>

      <p className="review-context">
        {liveScore} of {idx} clean so far · figure out which concept this problem is testing.
      </p>

      {!aiEnabled && (
        <p className="practice__note">Running offline — problems are generated by the physics engine.</p>
      )}

      <div className="practice__card">
        <BarDragStepView
          key={idx}
          step={step}
          draft={draft}
          onDraftChange={setDraft}
          onCorrect={handleSolved}
          onAttempt={handleAttempt}
        />
      </div>

      {aiEnabled && tutorContext && !tutorOpen && (
        <button type="button" className="tutor-fab" onClick={() => setTutorOpen(true)}>
          <span className="tutor-fab__avatar">
            <img src="/brock.png" alt="" />
          </span>
          Ask Brock
        </button>
      )}

      {aiEnabled && tutorOpen && tutorContext && (
        <AiTutorSidebar
          key={idx}
          lessonTitle={`Mixed practice · ${CONCEPTS[problem.conceptId].name}`}
          conceptId={problem.conceptId}
          question={tutorContext}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  )
}
