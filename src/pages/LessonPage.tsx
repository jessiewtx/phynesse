import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StepRenderer } from '../components/StepRenderer'
import { ProgressBar } from '../components/ProgressBar'
import { SignInPanel } from '../components/SignInPanel'
import { useAuth } from '../contexts/AuthContext'
import { getLesson } from '../lib/lessons'
import { loadProgress as loadLocalProgress, saveProgress as saveLocalProgress } from '../lib/progress'
import {
  fetchLessonProgress,
  logStepAttempt,
  saveLessonProgress,
  type LessonStatus,
} from '../lib/progressFirestore'
import type { PushBlockParams, SimStep, StepDraft } from '../types/lesson'
import { displayFirstName } from '../lib/displayName'

const DEFAULT_PARAMS: PushBlockParams = {
  force: 10,
  distance: 2,
  mass: 2,
  muK: 0,
}

export function LessonPage() {
  const { user, isSignedIn, authReady } = useAuth()
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined

  const [stepIndex, setStepIndex] = useState(0)
  const [simParams, setSimParams] = useState<PushBlockParams>(DEFAULT_PARAMS)
  const [stepDraft, setStepDraft] = useState<StepDraft | null>(null)
  const [, setStatus] = useState<LessonStatus>('not_started')
  const [ready, setReady] = useState(false)

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
            simParams: source.simParams,
            stepDraft: source.stepDraft ?? null,
            status:
              source.stepIndex >= lesson!.steps.length ? 'completed' : 'in_progress',
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
        setSimParams(source.simParams)
        setStepDraft(source.stepDraft ?? null)
        if (source.stepIndex >= lesson!.steps.length) setStatus('completed')
        else if (source.stepIndex > 0) setStatus('in_progress')
      }

      if (!cancelled) setReady(true)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [lesson, lessonId, user])

  const persist = useCallback(
    async (
      nextStep: number,
      nextParams: PushBlockParams,
      nextDraft: StepDraft | null,
      nextStatus: LessonStatus,
    ) => {
      if (!lessonId || !lesson) return

      saveLocalProgress(lessonId, nextStep, nextParams, nextDraft)

      if (user) {
        await saveLessonProgress(user.uid, lessonId, {
          stepIndex: nextStep,
          simParams: nextParams,
          stepDraft: nextDraft,
          status: nextStatus,
          totalSteps: lesson.steps.length,
        })
      }
    },
    [lessonId, lesson, user],
  )

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ready || !lessonId || !lesson) return

    const nextStatus: LessonStatus =
      stepIndex >= lesson.steps.length
        ? 'completed'
        : stepIndex > 0
          ? 'in_progress'
          : 'not_started'
    setStatus(nextStatus)

    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      void persist(stepIndex, simParams, stepDraft, nextStatus)
    }, 400)

    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [stepIndex, simParams, stepDraft, ready, lessonId, lesson, persist])

  const advance = useCallback(() => {
    if (!lesson) return
    setStepDraft(null)
    setStepIndex((i) => {
      const next = i + 1
      const nextStep = lesson.steps[next]
      if (nextStep?.type === 'sim') {
        setSimParams((nextStep as SimStep).defaultParams)
      }
      return next
    })
  }, [lesson])

  const handleDraftChange = useCallback(
    (draft: StepDraft | null) => {
      setStepDraft(draft)
      if (draft?.showWrongFeedback && lessonId && lesson) {
        const nextStatus: LessonStatus =
          stepIndex >= lesson.steps.length
            ? 'completed'
            : stepIndex > 0
              ? 'in_progress'
              : 'not_started'
        saveLocalProgress(lessonId, stepIndex, simParams, draft)
        if (user) {
          void saveLessonProgress(user.uid, lessonId, {
            stepIndex,
            simParams,
            stepDraft: draft,
            status: nextStatus,
            totalSteps: lesson.steps.length,
          })
        }
      }
    },
    [lessonId, lesson, user, stepIndex, simParams],
  )

  const handleComplete = useCallback(() => {
    if (!lessonId || !lesson) return
    const done = lesson.steps.length
    setStepIndex(done)
    setStepDraft(null)
    setStatus('completed')
    void persist(done, simParams, null, 'completed')
  }, [lessonId, lesson, simParams, persist])

  const handleAttempt = useCallback(
    (stepType: string, answer: string | number, correct: boolean, hint?: string) => {
      if (!user || !lessonId) return
      void logStepAttempt(user.uid, {
        lessonId,
        stepIndex,
        stepType,
        answer,
        correct,
        hintShown: hint,
      })
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
        <header className="lesson-header">
          <Link to="/" className="lesson-header__back">← Lessons</Link>
          <div className="lesson-header__center">
            <div className="lesson-header__title">{lesson.title}</div>
            <ProgressBar current={lesson.steps.length} total={lesson.steps.length} />
          </div>
          <div className="lesson-header__right" />
        </header>
        <main className="lesson-main">
          <p style={{ color: 'var(--text-2)', marginBottom: '1rem' }}>Lesson complete.</p>
          <Link to="/" className="btn btn--primary">Back to course</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="lesson-page">
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
        <StepRenderer
          key={stepIndex}
          step={step}
          stepDraft={stepDraft}
          onDraftChange={handleDraftChange}
          simParams={simParams}
          onSimChange={setSimParams}
          onAdvance={advance}
          onComplete={handleComplete}
          onAttempt={handleAttempt}
        />
      </main>
    </div>
  )
}
