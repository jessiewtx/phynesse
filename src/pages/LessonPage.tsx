import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StepRenderer } from '../components/StepRenderer'
import { ProgressBar } from '../components/ProgressBar'
import { SignInPanel } from '../components/SignInPanel'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, getLesson, statusForStepIndex } from '../lib/lessons'
import { buildMastery } from '../lib/mastery'
import { loadProgress as loadLocalProgress, saveProgress as saveLocalProgress, logGuestAttempt } from '../lib/progress'
import {
  fetchLessonProgress,
  logStepAttempt,
  saveLessonProgress,
  type LessonStatus,
  type StoredLessonProgress,
} from '../lib/progressFirestore'
import type { Confidence, StepDraft } from '../types/lesson'
import { displayFirstName } from '../lib/displayName'
import { completeLesson, type CompletionResult } from '../lib/streak'
import { StreakCelebrationOverlay } from '../components/StreakCelebrationOverlay'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { notifyLearnerDataChanged, useLearnerData } from '../lib/useLearnerData'
import { AiTutorSidebar } from '../components/AiTutorSidebar'
import { MiniQuiz } from '../components/MiniQuiz'
import { LESSON_CONCEPT } from '../lib/practiceConcepts'
import type { ConceptId } from '../lib/physics'
import { aiEnabled, AI_HELP_AFTER } from '../lib/ai'
import { tutorContextForStep } from '../lib/tutorContext'
import { captureTricky } from '../lib/tricky'
import { notifyTrickyChanged } from '../lib/useTricky'
import { classifyMiss, givenNumbers, recordMiss } from '../lib/bosses'
import { notifyBossesChanged } from '../lib/useBosses'

/** Misses on the same problem before it's filed into the tricky-problems notebook. */
const CAPTURE_AFTER = 2

type ProgressLike = {
  stepIndex: number
  stepDraft?: StepDraft | null
  drafts?: Record<string | number, StepDraft>
}

/** When two sources hold a draft for the same step, keep the one that proves
 *  the most work: a solved answer wins, otherwise the higher attempt count. */
function pickDraft(a: StepDraft | undefined, b: StepDraft | undefined): StepDraft | undefined {
  if (!a) return b
  if (!b) return a
  if (a.solved && !b.solved) return a
  if (b.solved && !a.solved) return b
  return (b.attemptCount ?? 0) > (a.attemptCount ?? 0) ? b : a
}

/** Fold every progress source (in-memory cache, local storage, Firestore) into
 *  one view. Drafts are unioned per step so a stale or pre-drafts remote can
 *  never erase answers another source still has, and the resume point is the
 *  furthest any source reached — never backwards. */
function mergeProgress(
  sources: (ProgressLike | null | undefined)[],
  totalSteps: number,
): { stepIndex: number; drafts: Record<number, StepDraft>; stepDraft: StepDraft | null } | null {
  const drafts: Record<number, StepDraft> = {}
  let stepIndex = 0
  let any = false

  for (const s of sources) {
    if (!s) continue
    any = true
    if (s.drafts) {
      for (const [k, v] of Object.entries(s.drafts)) {
        if (!v) continue
        const idx = Number(k)
        drafts[idx] = pickDraft(drafts[idx], v)!
      }
    }
    const sIdx = s.stepIndex >= totalSteps ? totalSteps : s.stepIndex
    // Older saves only kept a single stepDraft at the resume step — fold it in.
    if (s.stepDraft) drafts[sIdx] = pickDraft(drafts[sIdx], s.stepDraft)!
    if (sIdx > stepIndex) stepIndex = sIdx
  }

  if (!any) return null
  return { stepIndex, drafts, stepDraft: drafts[stepIndex] ?? null }
}

export function LessonPage() {
  const { user, isSignedIn, authReady } = useAuth()
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined

  const [stepIndex, setStepIndex] = useState(0)
  const [stepDraft, setStepDraft] = useState<StepDraft | null>(null)
  // Per-step drafts (answers + solved flags) so navigating back to an earlier
  // step shows what the learner already did instead of forcing a re-answer.
  const draftsRef = useRef<Record<number, StepDraft>>({})
  // Furthest step reached — the resume point. Reviewing earlier steps must never
  // drag saved progress backwards.
  const furthestRef = useRef(0)
  // Bumped on "Redo" to force the step view to remount fresh.
  const [redoNonce, setRedoNonce] = useState(0)
  // The hydrate effect runs more than once (auth resolves after first paint).
  // Track whether we've already placed the learner so a late remote fetch can
  // refresh the cache without yanking the step they're currently viewing.
  const hydratedOnceRef = useRef(false)
  const [, setStatus] = useState<LessonStatus>('not_started')
  const [ready, setReady] = useState(false)
  const [celebration, setCelebration] = useState<CompletionResult | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [gateDismissed, setGateDismissed] = useState(false)
  // Retrieval warm-up (recall a prior concept before starting) and end-of-lesson
  // interleaved check — both skippable, both reset per lesson (LessonPage is keyed).
  const [warmupDone, setWarmupDone] = useState(false)
  const [endMixDone, setEndMixDone] = useState(false)

  // Cross-lesson mastery readiness for the advisory "build the prerequisite first"
  // checkpoint. Sourced from the shared learner data so it reflects every lesson.
  const { progressMap, attempts } = useLearnerData()
  const allLessons = useMemo(() => getAllLessons(), [])
  const mastery = useMemo(
    () => buildMastery(allLessons, progressMap, attempts),
    [allLessons, progressMap, attempts],
  )
  const me = lessonId ? mastery.byId[lessonId] : undefined

  // Warm-up recalls the most recent EARLIER lesson that has a generated-practice
  // concept (retrieval practice + light interleaving). End-of-lesson check mixes
  // every concept learned up to and including this one.
  const orderIdx = allLessons.findIndex((l) => l.id === lessonId)
  const warmup = useMemo(() => {
    for (let i = orderIdx - 1; i >= 0; i--) {
      const c = LESSON_CONCEPT[allLessons[i].id]
      if (c) return { concept: c, title: allLessons[i].title }
    }
    return null
  }, [allLessons, orderIdx])
  const endMixConcepts = useMemo<ConceptId[]>(() => {
    const pool: ConceptId[] = []
    for (let i = 0; i <= orderIdx; i++) {
      const c = LESSON_CONCEPT[allLessons[i]?.id]
      if (c && !pool.includes(c)) pool.push(c)
    }
    if (pool.length < 2) return []
    // Always include this lesson's own concept (if any), then fill with earlier
    // ones, shuffled — true interleaving, capped at 3 so it stays a quick check.
    const own = lessonId ? LESSON_CONCEPT[lessonId] : undefined
    const rest = pool.filter((c) => c !== own)
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }
    const picked = (own ? [own, ...rest] : rest).slice(0, 3)
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[picked[i], picked[j]] = [picked[j], picked[i]]
    }
    return picked
    // Built once per lesson mount (LessonPage is keyed by lessonId).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const local = loadLocalProgress(lessonId!)
      let remote: StoredLessonProgress | null = null

      if (user) {
        remote = await fetchLessonProgress(user.uid, lessonId!)
        // First time signing in on this device: push local up to the cloud —
        // including the per-step drafts, so previously-solved answers survive.
        if (!remote && local) {
          await saveLessonProgress(user.uid, lessonId!, {
            stepIndex: local.stepIndex,
            stepDraft: local.stepDraft ?? null,
            drafts: local.drafts,
            status: statusForStepIndex(lesson!, local.stepIndex),
            totalSteps: lesson!.steps.length,
          })
        }
      }

      if (cancelled) return

      // Include whatever is already in memory so a late/stale remote fetch can
      // never wipe answers solved earlier in this session.
      const inMemory: ProgressLike | null = hydratedOnceRef.current
        ? { stepIndex: furthestRef.current, drafts: draftsRef.current }
        : null

      const merged = mergeProgress([inMemory, local, remote], lesson!.steps.length)
      if (merged) {
        draftsRef.current = merged.drafts
        furthestRef.current = Math.max(furthestRef.current, merged.stepIndex)
        // Only place the learner on the first hydrate; later runs just refresh
        // the draft cache so we don't snatch them away from a step they opened.
        if (!hydratedOnceRef.current) {
          setStepIndex(merged.stepIndex)
          setStepDraft(merged.drafts[merged.stepIndex] ?? merged.stepDraft ?? null)
        }
        setStatus(statusForStepIndex(lesson!, furthestRef.current))
      }

      hydratedOnceRef.current = true
      setReady(true)
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
    // Hold the celebration until the end-of-lesson interleaved check is done
    // (or skipped) — it sits between the last step and the finish line.
    if (endMixConcepts.length >= 2 && !endMixDone) return
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
  }, [ready, lesson, lessonId, stepIndex, user, endMixConcepts, endMixDone])

  const persist = useCallback(
    async (resumeStep: number, nextStatus: LessonStatus) => {
      if (!lessonId || !lesson) return

      const drafts = draftsRef.current
      const resumeDraft = drafts[resumeStep] ?? null

      saveLocalProgress(lessonId, resumeStep, resumeDraft, drafts)

      if (user) {
        await saveLessonProgress(user.uid, lessonId, {
          stepIndex: resumeStep,
          stepDraft: resumeDraft,
          drafts,
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

    const resume = furthestRef.current
    const nextStatus: LessonStatus = statusForStepIndex(lesson, resume)
    setStatus(nextStatus)

    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      void persist(resume, nextStatus)
    }, 400)

    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [stepIndex, stepDraft, redoNonce, ready, lessonId, lesson, persist])

  const advance = useCallback(() => {
    if (!lesson) return
    setTutorOpen(false)
    const next = stepIndex + 1
    furthestRef.current = Math.max(furthestRef.current, next)
    setStepIndex(next)
    setStepDraft(draftsRef.current[next] ?? null)
  }, [lesson, stepIndex])

  const handleDraftChange = useCallback(
    (draft: StepDraft | null) => {
      setStepDraft(draft)
      if (draft) draftsRef.current[stepIndex] = draft
      else delete draftsRef.current[stepIndex]

      // Save immediately when an attempt is recorded or a step is solved, so a
      // hard refresh mid-problem keeps the attempt count and answered state.
      if ((draft?.showWrongFeedback || draft?.solved) && lessonId && lesson) {
        furthestRef.current = Math.max(furthestRef.current, stepIndex)
        const resume = furthestRef.current
        const nextStatus: LessonStatus = statusForStepIndex(lesson, resume)
        saveLocalProgress(lessonId, resume, draftsRef.current[resume] ?? null, draftsRef.current)
        if (user) {
          void saveLessonProgress(user.uid, lessonId, {
            stepIndex: resume,
            stepDraft: draftsRef.current[resume] ?? null,
            drafts: draftsRef.current,
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
    furthestRef.current = Math.max(furthestRef.current, done)
    setStepIndex(done)
    setStepDraft(null)
    setStatus('completed')
    void persist(done, 'completed')
  }, [lessonId, lesson, persist])

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) return
    setTutorOpen(false)
    const prev = stepIndex - 1
    setStepIndex(prev)
    setStepDraft(draftsRef.current[prev] ?? null)
  }, [stepIndex])

  // Deliberately clear an answered step so the learner can re-solve it.
  const handleRedo = useCallback(() => {
    delete draftsRef.current[stepIndex]
    setStepDraft(null)
    wrongCounts.current[stepIndex] = 0
    triggeredSteps.current.delete(stepIndex)
    setRedoNonce((n) => n + 1)
  }, [stepIndex])

  const handleRestart = useCallback(() => {
    setShowRestartConfirm(true)
  }, [])

  const confirmRestart = useCallback(() => {
    setShowRestartConfirm(false)
    setStepIndex(0)
    setStepDraft(null)
    draftsRef.current = {}
    furthestRef.current = 0
    wrongCounts.current = {}
    triggeredSteps.current = new Set()
    capturedSteps.current = new Set()
    setRedoNonce((n) => n + 1)
    setTutorOpen(false)
  }, [])

  const handleAttempt = useCallback(
    (
      stepType: string,
      answer: string | number,
      correct: boolean,
      hint?: string,
      confidence?: Confidence,
    ) => {
      if (!lessonId) return
      const record = { lessonId, stepIndex, stepType, answer, correct, hintShown: hint, confidence }
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

  // Retrieval warm-up: only at a genuinely fresh start of a later lesson the
  // learner hasn't completed — never when resuming mid-lesson or reviewing.
  const showWarmup =
    !!warmup &&
    !warmupDone &&
    stepIndex === 0 &&
    furthestRef.current === 0 &&
    me?.status !== 'completed'
  // End-of-lesson interleaved check: sits on the 'complete' step until done/skipped.
  const showEndMix = step.type === 'complete' && endMixConcepts.length >= 2 && !endMixDone

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

      {me && !me.ready && me.status !== 'completed' && stepIndex === 0 && !gateDismissed && me.prereqId && !showWarmup && (
        <div className="lesson-gate">
          <span className="lesson-gate__icon" aria-hidden>🔑</span>
          <div className="lesson-gate__body">
            <strong className="lesson-gate__title">Master the basics first</strong>
            <p className="lesson-gate__note">
              This builds on <strong>{me.prereqTitle}</strong>, where you're at {me.prereqScore}%. Getting it
              to 70%+ first makes this lesson click — but it's your call.
            </p>
          </div>
          <div className="lesson-gate__actions">
            <Link to={`/lesson/${me.prereqId}`} className="btn btn--primary">
              Review {me.prereqTitle} →
            </Link>
            <button type="button" className="lesson-gate__dismiss" onClick={() => setGateDismissed(true)}>
              Continue anyway
            </button>
          </div>
        </div>
      )}

      <main className="lesson-main">
        {showWarmup ? (
          <div className="lesson-interlude">
            <div className="lesson-interlude__head">
              <span className="lesson-interlude__eyebrow">🔁 Quick recall</span>
              <h2 className="lesson-interlude__title">First, one from {warmup!.title}</h2>
              <p className="lesson-interlude__sub">
                Pulling an idea back out of memory is what locks it in. No formula shown — see if you can
                recall it before diving into something new.
              </p>
            </div>
            <MiniQuiz
              concepts={[warmup!.concept]}
              onDone={() => setWarmupDone(true)}
              onSkip={() => setWarmupDone(true)}
              skipLabel="Skip warm-up →"
            />
          </div>
        ) : showEndMix ? (
          <div className="lesson-interlude">
            <div className="lesson-interlude__head">
              <span className="lesson-interlude__eyebrow">🔀 Mixed check</span>
              <h2 className="lesson-interlude__title">Before you finish: a quick mixed set</h2>
              <p className="lesson-interlude__sub">
                A few problems jumping between concepts — so you practice picking the right idea, not just
                repeating this lesson's. Skip anytime.
              </p>
            </div>
            <MiniQuiz
              concepts={endMixConcepts}
              onDone={() => setEndMixDone(true)}
              onSkip={() => setEndMixDone(true)}
              skipLabel="Skip & finish →"
            />
          </div>
        ) : (
          <>
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
              ) : stepDraft?.solved ? (
                <button type="button" className="lesson-nav__btn lesson-nav__btn--restart" onClick={handleRedo}>
                  ↻ Redo question
                </button>
              ) : (
                <button type="button" className="lesson-nav__btn lesson-nav__btn--restart" onClick={handleRestart}>
                  ↺ Start over
                </button>
              )}
            </div>

            <StepRenderer
              key={`${stepIndex}-${redoNonce}`}
              step={step}
              lessonId={lessonId}
              stepDraft={stepDraft}
              onDraftChange={handleDraftChange}
              onAdvance={advance}
              onComplete={handleComplete}
              onRestart={handleRestart}
              onAttempt={handleAttempt}
            />
          </>
        )}
      </main>

      {aiEnabled && tutorContext && !tutorOpen && !showWarmup && !showEndMix && (
        <button type="button" className="tutor-fab" onClick={() => setTutorOpen(true)}>
          <span className="tutor-fab__avatar">
            <img src="/brock.png" alt="" />
          </span>
          Ask Brock
        </button>
      )}

      {aiEnabled && tutorOpen && tutorContext && !showWarmup && !showEndMix && (
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
