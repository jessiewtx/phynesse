import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StepRenderer } from '../components/StepRenderer'
import { ProgressBar } from '../components/ProgressBar'
import { SignInPanel } from '../components/SignInPanel'
import { useAuth } from '../contexts/AuthContext'
import { getLesson, statusForStepIndex } from '../lib/lessons'
import { loadProgress as loadLocalProgress, saveProgress as saveLocalProgress, logGuestAttempt } from '../lib/progress'
import {
  fetchLessonProgress,
  logStepAttempt,
  saveLessonProgress,
  type LessonStatus,
} from '../lib/progressFirestore'
import type { StepDraft } from '../types/lesson'
import { displayFirstName } from '../lib/displayName'
import { completeLesson, type CompletionResult } from '../lib/streak'
import { StreakCelebrationOverlay } from '../components/StreakCelebrationOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { notifyLearnerDataChanged } from '../lib/useLearnerData'
import { AiTutorSidebar } from '../components/AiTutorSidebar'
import { LESSON_CONCEPT } from '../lib/practiceConcepts'
import { aiEnabled, AI_HELP_AFTER } from '../lib/ai'
import { tutorContextForStep } from '../lib/tutorContext'
import { captureTricky } from '../lib/tricky'
import { notifyTrickyChanged } from '../lib/useTricky'
import { classifyMiss, givenNumbers, recordMiss } from '../lib/bosses'
import { notifyBossesChanged } from '../lib/useBosses'

/** Misses on the same problem before it's filed into the tricky-problems notebook. */
const CAPTURE_AFTER = 2

export function LessonPage() {
  const { user, isSignedIn, authReady } = useAuth()
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined

  const [stepIndex, setStepIndex] = useState(0)
  const [stepDraft, setStepDraft] = useState<StepDraft | null>(null)
  const [, setStatus] = useState<LessonStatus>('not_started')
  const [ready, setReady] = useState(false)
  const [celebration, setCelebration] = useState<CompletionResult | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  // AI study helper. It is always available via a button and is grounded in
  // WHATEVER step the learner is currently on. It also auto-opens after a couple
  // of misses on a numeric problem.
  const [tutorOpen, setTutorOpen] = useState(false)
  const wrongCounts = useRef<Record<number, number>>({})
  const triggeredSteps = useRef<Set<number>>(new Set())
  const capturedSteps = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!lesson || !lessonId) return

    let cancelled = false

    async function hydrate() {
      let source = loadLocalProgress(lessonId!)

      if (user) {
        const remote = await fetchLessonProgress(user.uid, lessonId!)
        if (remote) source = remote
        else if (source) {
          await saveLessonProgress(user.uid, lessonId!, {
            stepIndex: source.stepIndex,
            stepDraft: source.stepDraft ?? null,
            status: statusForStepIndex(lesson!, source.stepIndex),
            totalSteps: lesson!.steps.length,
          })
        }
      }

      if (source && !cancelled) {
        const idx =
          source.stepIndex >= lesson!.steps.length
            ? lesson!.steps.length
            : source.stepIndex
        setStepIndex(idx)
        setStepDraft(source.stepDraft ?? null)
        setStatus(statusForStepIndex(lesson!, source.stepIndex))
      }

      if (!cancelled) setReady(true)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [lesson, lessonId, user])

  const celebratedRef = useRef(false)

  useEffect(() => {
    if (!ready || !lesson || !lessonId) return
    if (lesson.steps[stepIndex]?.type !== 'complete') return
    if (celebratedRef.current) return
    celebratedRef.current = true
    void completeLesson(user?.uid ?? null, lessonId).then((result) => {
      setCelebration(result)
      notifyLearnerDataChanged()
      // Only celebrate on the FIRST completion of the day (when the streak
      // actually starts or advances) — or when a new milestone is earned.
      // Later lessons the same day finish quietly.
      const worthCelebrating =
        result.streakStarted || result.streakIncreased || result.milestones.length > 0
      setShowCelebration(worthCelebrating)
    })
  }, [ready, lesson, lessonId, stepIndex, user])

  const persist = useCallback(
    async (
      nextStep: number,
      nextDraft: StepDraft | null,
      nextStatus: LessonStatus,
    ) => {
      if (!lessonId || !lesson) return

      saveLocalProgress(lessonId, nextStep, nextDraft)

      if (user) {
        await saveLessonProgress(user.uid, lessonId, {
          stepIndex: nextStep,
          stepDraft: nextDraft,
          status: nextStatus,
          totalSteps: lesson.steps.length,
        })
      }
      notifyLearnerDataChanged()
    },
    [lessonId, lesson, user],
  )

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ready || !lessonId || !lesson) return

    const nextStatus: LessonStatus = statusForStepIndex(lesson, stepIndex)
    setStatus(nextStatus)

    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      void persist(stepIndex, stepDraft, nextStatus)
    }, 400)

    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [stepIndex, stepDraft, ready, lessonId, lesson, persist])

  const advance = useCallback(() => {
    if (!lesson) return
    setStepDraft(null)
    setTutorOpen(false)
    setStepIndex((i) => i + 1)
  }, [lesson])

  const handleDraftChange = useCallback(
    (draft: StepDraft | null) => {
      setStepDraft(draft)
      if (draft?.showWrongFeedback && lessonId && lesson) {
        const nextStatus: LessonStatus = statusForStepIndex(lesson, stepIndex)
        saveLocalProgress(lessonId, stepIndex, draft)
        if (user) {
          void saveLessonProgress(user.uid, lessonId, {
            stepIndex,
            stepDraft: draft,
            status: nextStatus,
            totalSteps: lesson.steps.length,
          })
        }
      }
    },
    [lessonId, lesson, user, stepIndex],
  )

  const handleComplete = useCallback(() => {
    if (!lessonId || !lesson) return
    const done = lesson.steps.length
    setStepIndex(done)
    setStepDraft(null)
    setStatus('completed')
    void persist(done, null, 'completed')
  }, [lessonId, lesson, persist])

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) return
    setTutorOpen(false)
    setStepIndex(stepIndex - 1)
    setStepDraft(null)
  }, [stepIndex])

  const handleRestart = useCallback(() => {
    setShowRestartConfirm(true)
  }, [])

  const confirmRestart = useCallback(() => {
    setShowRestartConfirm(false)
    setStepIndex(0)
    setStepDraft(null)
    wrongCounts.current = {}
    triggeredSteps.current = new Set()
    capturedSteps.current = new Set()
    setTutorOpen(false)
  }, [])

  const handleAttempt = useCallback(
    (stepType: string, answer: string | number, correct: boolean, hint?: string) => {
      if (!lessonId) return
      const record = { lessonId, stepIndex, stepType, answer, correct, hintShown: hint }
      if (user) {
        void logStepAttempt(user.uid, record)
      } else {
        logGuestAttempt(record)
      }

      if (correct) return
      const n = (wrongCounts.current[stepIndex] ?? 0) + 1
      wrongCounts.current[stepIndex] = n

      // File the problem into the spaced-review notebook after a couple of misses,
      // so it resurfaces later (retrieval practice) right as it starts to fade.
      const current = lesson?.steps[stepIndex]
      if (
        lesson &&
        lessonId &&
        n >= CAPTURE_AFTER &&
        !capturedSteps.current.has(stepIndex) &&
        current &&
        (current.type === 'bar_drag' || current.type === 'predict_numeric')
      ) {
        capturedSteps.current.add(stepIndex)
        void captureTricky(user?.uid ?? null, {
          id: `${lessonId}:${stepIndex}`,
          source: 'lesson',
          title: lesson.title,
          conceptId: LESSON_CONCEPT[lessonId],
          lessonId,
          stepIndex,
          step: current,
        }).then(() => notifyTrickyChanged())
      }

      // Watch for a *repeated* error pattern across problems. Classify this miss
      // against the engine's correct value; if it's a recognizable slip on a
      // concept-backed problem, log it so a targeted boss can spawn.
      const conceptId = LESSON_CONCEPT[lessonId]
      if (
        conceptId &&
        current &&
        (current.type === 'bar_drag' || current.type === 'predict_numeric') &&
        typeof answer === 'number'
      ) {
        const slip = classifyMiss(current.correctValue, answer, givenNumbers(current.givens))
        if (slip) {
          void recordMiss(user?.uid ?? null, conceptId, slip).then(() => notifyBossesChanged())
        }
      }

      // After a couple of misses on this question, auto-open the study helper.
      if (!aiEnabled) return
      if (n < AI_HELP_AFTER || triggeredSteps.current.has(stepIndex)) return
      triggeredSteps.current.add(stepIndex)
      setTutorOpen(true)
    },
    [user, lessonId, stepIndex, lesson],
  )

  if (!lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-2)' }}>Lesson not found.</p>
          <Link to="/" className="btn btn--ghost" style={{ alignSelf: 'flex-start' }}>← Back to lessons</Link>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="lesson-page">
        <div className="page--loading">Loading your progress…</div>
      </div>
    )
  }

  const step = lesson.steps[stepIndex]
  const tutorContext = tutorContextForStep(step)
  if (!step) {
    return (
      <div className="lesson-page">
        <ConfirmDialog
          open={showRestartConfirm}
          title="Start over?"
          body="This takes you back to the first step of the lesson. Your saved progress for this lesson will reset."
          confirmLabel="Start over"
          cancelLabel="Keep going"
          destructive
          onConfirm={confirmRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />
        <header className="lesson-header">
          <Link to="/" className="lesson-header__back">← Lessons</Link>
          <div className="lesson-header__center">
            <div className="lesson-header__title">{lesson.title}</div>
            <ProgressBar current={lesson.steps.length} total={lesson.steps.length} />
          </div>
          <div className="lesson-header__right" />
        </header>
        <main className="lesson-main">
          <div className="lesson-nav">
            <button type="button" className="lesson-nav__btn" onClick={handleBack}>
              ← Previous
            </button>
            <button type="button" className="lesson-nav__btn lesson-nav__btn--restart" onClick={handleRestart}>
              ↺ Start over
            </button>
          </div>
          <div className="lesson-complete-splash">
            <div className="lesson-complete-splash__icon">🎉</div>
            <h2 className="lesson-complete-splash__title">Lesson complete!</h2>
            <p className="lesson-complete-splash__body">
              {lesson.title} — all done. Review any step or head back to choose your next lesson.
            </p>
            <div className="lesson-complete-splash__actions">
              <Link to="/" className="btn btn--primary">Back to course →</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="lesson-page">
      {showCelebration && celebration && (
        <StreakCelebrationOverlay
          result={celebration}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
      <ConfirmDialog
        open={showRestartConfirm}
        title="Start over?"
        body="This takes you back to the first step of the lesson. Your saved progress for this lesson will reset."
        confirmLabel="Start over"
        cancelLabel="Keep going"
        destructive
        onConfirm={confirmRestart}
        onCancel={() => setShowRestartConfirm(false)}
      />
      <header className="lesson-header">
        <Link to="/" className="lesson-header__back">← Lessons</Link>
        <div className="lesson-header__center">
          <div className="lesson-header__title">{lesson.title}</div>
          <ProgressBar current={stepIndex} total={lesson.steps.length} />
        </div>
        <div className="lesson-header__right">
          {isSignedIn && user ? displayFirstName(user) : ''}
        </div>
      </header>

      {!isSignedIn && authReady && (
        <div className="lesson-guest-auth">
          <SignInPanel compact />
        </div>
      )}

      <main className="lesson-main">
        <div className="lesson-nav">
          {stepIndex > 0 ? (
            <button type="button" className="lesson-nav__btn" onClick={handleBack}>
              ← Previous
            </button>
          ) : (
            <span />
          )}
          {step.type === 'complete' ? (
            <Link to="/progress" className="lesson-nav__btn lesson-nav__btn--mastery">
              View mastery →
            </Link>
          ) : (
            <button type="button" className="lesson-nav__btn lesson-nav__btn--restart" onClick={handleRestart}>
              ↺ Start over
            </button>
          )}
        </div>

        <StepRenderer
          key={stepIndex}
          step={step}
          lessonId={lessonId}
          stepDraft={stepDraft}
          onDraftChange={handleDraftChange}
          onAdvance={advance}
          onComplete={handleComplete}
          onRestart={handleRestart}
          onAttempt={handleAttempt}
        />
      </main>

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
          key={stepIndex}
          lessonTitle={lesson.title}
          conceptId={lessonId ? LESSON_CONCEPT[lessonId] : undefined}
          question={tutorContext}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  )
}
