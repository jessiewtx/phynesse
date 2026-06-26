import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BarDragStepView } from '../components/steps/BarDragStepView'
import { PredictNumericStepView } from '../components/steps/PredictNumericStepView'
import { AiTutorSidebar } from '../components/AiTutorSidebar'
import { dueItems, gradeTricky, loadTricky, upcomingItems, type TrickyItem } from '../lib/tricky'
import { notifyTrickyChanged } from '../lib/useTricky'
import { aiEnabled, AI_HELP_AFTER } from '../lib/ai'
import { tutorContextForStep } from '../lib/tutorContext'
import type { StepDraft } from '../types/lesson'

type SessionState =
  | { kind: 'loading' }
  | { kind: 'empty'; upcoming: TrickyItem[] }
  | { kind: 'active'; queue: TrickyItem[] }

/**
 * Feature: the Tricky Problems notebook review session.
 *
 * Replays problems that are *due* (spaced retrieval) one at a time using the very
 * same step views the learner first saw. A first-try recall promotes the item to a
 * longer interval; a miss snaps it back. Items graduate out once mastered.
 */
export function ReviewPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [state, setState] = useState<SessionState>({ kind: 'loading' })
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<StepDraft | null>(null)
  const [result, setResult] = useState<{ reviewed: number; graduated: number }>({
    reviewed: 0,
    graduated: 0,
  })
  // Whether the learner missed the CURRENT item at least once before solving.
  const missed = useRef(false)
  // AI study helper (Brock) — same behavior as in lessons: always available via a
  // button, and auto-opens after a couple of misses on the current problem.
  const [tutorOpen, setTutorOpen] = useState(false)
  const wrongCount = useRef(0)

  useEffect(() => {
    let alive = true
    void loadTricky(uid).then((items) => {
      if (!alive) return
      const due = dueItems(items)
      if (due.length === 0) {
        setState({ kind: 'empty', upcoming: upcomingItems(items) })
      } else {
        setState({ kind: 'active', queue: due })
      }
    })
    return () => {
      alive = false
    }
  }, [uid])

  if (state.kind === 'loading') {
    return (
      <div className="practice">
        <div className="practice__loading">
          <span className="practice__spinner" />
          <span>Opening your notebook…</span>
        </div>
      </div>
    )
  }

  if (state.kind === 'empty') {
    return (
      <div className="practice practice--empty">
        <div className="review-done">
          <div className="review-done__icon">🧠</div>
          <h1 className="review-done__title">Nothing due right now</h1>
          <p className="review-done__note">
            {state.upcoming.length > 0
              ? `${state.upcoming.length} problem${state.upcoming.length === 1 ? '' : 's'} you missed ${state.upcoming.length === 1 ? 'is' : 'are'} resting — they'll resurface here right as they start to fade.`
              : 'When you miss a problem in a lesson, it lands here and comes back at the perfect moment to make it stick.'}
          </p>
          <Link to="/" className="btn btn--primary">
            Back to course
          </Link>
        </div>
      </div>
    )
  }

  const { queue } = state

  if (idx >= queue.length) {
    return (
      <div className="practice practice--empty">
        <div className="review-done">
          <div className="review-done__icon">🎉</div>
          <h1 className="review-done__title">Review complete!</h1>
          <p className="review-done__note">
            You retried {result.reviewed} tricky problem{result.reviewed === 1 ? '' : 's'}
            {result.graduated > 0
              ? ` and mastered ${result.graduated} for good — ${result.graduated === 1 ? "it's" : "they're"} out of your notebook.`
              : '. The ones you nailed will come back later, spaced out so they really stick.'}
          </p>
          <div className="review-done__actions">
            <Link to="/" className="btn btn--primary">
              Back to course
            </Link>
            <Link to="/progress" className="btn btn--ghost">
              View mastery
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const item = queue[idx]
  const tutorContext = tutorContextForStep(item.step)

  const handleAttempt = (_answer: number, correct: boolean) => {
    if (correct) return
    missed.current = true
    wrongCount.current += 1
    // After a couple of misses on this problem, auto-open Brock — just like lessons.
    if (aiEnabled && wrongCount.current >= AI_HELP_AFTER) setTutorOpen(true)
  }

  const handleSolved = () => {
    const solvedFirstTry = !missed.current
    void gradeTricky(uid, item.id, solvedFirstTry).then((outcome) => {
      notifyTrickyChanged()
      setResult((r) => ({
        reviewed: r.reviewed + 1,
        graduated: r.graduated + (outcome === 'graduated' ? 1 : 0),
      }))
    })
    missed.current = false
    wrongCount.current = 0
    setTutorOpen(false)
    setDraft(null)
    setIdx((i) => i + 1)
  }

  return (
    <div className="practice">
      <header className="practice__header">
        <Link to="/" className="practice__back">
          ← Done
        </Link>
        <div className="practice__title-block">
          <span className="practice__eyebrow">Tricky problems · spaced review</span>
          <h1 className="practice__title">Bring it back</h1>
        </div>
        <span className="practice__count" title="Position in today's review">
          {idx + 1} / {queue.length}
        </span>
      </header>

      <p className="review-context">
        From <strong>{item.title}</strong> — you missed this before. Try it fresh.
      </p>

      <div className="practice__card">
        {item.step.type === 'bar_drag' ? (
          <BarDragStepView
            key={item.id}
            step={item.step}
            draft={draft}
            onDraftChange={setDraft}
            onCorrect={handleSolved}
            onAttempt={handleAttempt}
          />
        ) : (
          <PredictNumericStepView
            key={item.id}
            step={item.step}
            draft={draft}
            onDraftChange={setDraft}
            onCorrect={handleSolved}
            onAttempt={handleAttempt}
          />
        )}
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
          key={item.id}
          lessonTitle={item.title}
          conceptId={item.conceptId}
          question={tutorContext}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  )
}
