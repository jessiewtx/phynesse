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
    },
    [user, lessonId, stepIndex],
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
    </div>
  )
}
