import type { Lesson } from '../types/lesson'
import { isLessonUnlocked, lessonCompletionIndex } from './lessons'
import type { StepAttemptRecord, StoredLessonProgress } from './progressFirestore'

/**
 * A lightweight mastery model in the spirit of Khan Academy / Brilliant.
 *
 * Mastery is NOT just "did you finish". It blends:
 *   • completion        — did you reach the end of the lesson
 *   • accuracy          — how often your answers were right
 *   • first-try rate    — getting it right without burning hints/retries
 *   • recency (decay)   — skills fade over time, which drives spaced review
 *
 * Everything here is pure: feed it lessons + progress + attempts and it returns
 * a fully-derived snapshot the UI can render.
 */

export type MasteryLevel =
  | 'locked'
  | 'not_started'
  | 'learning'
  | 'proficient'
  | 'skilled'
  | 'mastered'

export type LessonMastery = {
  lessonId: string
  title: string
  order: number
  status: 'not_started' | 'in_progress' | 'completed'
  locked: boolean
  /** Current mastery 0–100 after recency decay. */
  score: number
  /** Peak mastery 0–100 the learner has demonstrated (no decay). */
  peak: number
  level: MasteryLevel
  accuracy: number | null
  firstTryRate: number | null
  attempts: number
  correct: number
  lastPracticed: number | null
  daysSince: number | null
  /** 0–1 estimated retention right now (1 = fresh). */
  retention: number
  dueForReview: boolean
  /** 0–1 how far through the lesson's steps the learner is. */
  progressFraction: number
}

export type MasterySnapshot = {
  lessons: LessonMastery[]
  byId: Record<string, LessonMastery>
  overall: number
  level: MasteryLevel
  counts: Record<MasteryLevel, number>
  accuracy: number | null
  firstTryRate: number | null
  totalAttempts: number
  totalCorrect: number
  completedCount: number
  totalLessons: number
  reviewQueue: LessonMastery[]
  next: LessonMastery | null
  recommendation: Recommendation
  strengths: LessonMastery[]
  focus: LessonMastery[]
}

export type Recommendation = {
  kind: 'resume' | 'review' | 'start' | 'done'
  lesson: LessonMastery | null
  reason: string
}

export type Strand = {
  id: string
  name: string
  blurb: string
  lessonIds: string[]
}

/** High-level concept strands the six lessons roll up into. */
export const STRANDS: Strand[] = [
  { id: 'transfer', name: 'Energy transfer', blurb: 'Move energy with forces — work & power', lessonIds: ['L1', 'L6'] },
  { id: 'storage', name: 'Storage & motion', blurb: 'Kinetic and potential energy', lessonIds: ['L2', 'L3', 'L4'] },
  { id: 'conservation', name: 'Conservation', blurb: 'The big picture — energy is never lost', lessonIds: ['L5'] },
]

const DAY_MS = 86_400_000
// Memory half-life: retention reaches ~0.5 after ~10 days without practice.
const TAU_DAYS = 14
const REVIEW_RETENTION = 0.55

const LEVEL_ORDER: MasteryLevel[] = [
  'locked',
  'not_started',
  'learning',
  'proficient',
  'skilled',
  'mastered',
]

function emptyCounts(): Record<MasteryLevel, number> {
  return { locked: 0, not_started: 0, learning: 0, proficient: 0, skilled: 0, mastered: 0 }
}

function scoreToLevel(score: number): MasteryLevel {
  if (score >= 85) return 'mastered'
  if (score >= 65) return 'skilled'
  if (score >= 40) return 'proficient'
  return 'learning'
}

export function levelMeta(level: MasteryLevel): { label: string; color: string; blurb: string } {
  switch (level) {
    case 'mastered':
      return { label: 'Mastered', color: 'var(--done)', blurb: 'Strong and fresh — you own this.' }
    case 'skilled':
      return { label: 'Skilled', color: 'var(--teal)', blurb: 'Solid. A little polish away from mastery.' }
    case 'proficient':
      return { label: 'Proficient', color: 'var(--gold)', blurb: 'You can do this — keep reinforcing it.' }
    case 'learning':
      return { label: 'Learning', color: 'var(--accent)', blurb: 'Getting the hang of it.' }
    case 'not_started':
      return { label: 'Not started', color: 'var(--text-3)', blurb: 'Ready when you are.' }
    case 'locked':
      return { label: 'Locked', color: 'var(--border-mid)', blurb: 'Finish the previous lesson to unlock.' }
  }
}

function parseTime(iso: string | undefined | null): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

function computeLessonMastery(
  lesson: Lesson,
  progress: StoredLessonProgress | undefined,
  attempts: StepAttemptRecord[],
  progressMap: Record<string, StoredLessonProgress>,
  now: number,
): LessonMastery {
  const locked = !isLessonUnlocked(lesson, progressMap)
  const status = progress?.status ?? 'not_started'
  const completed = status === 'completed'

  const total = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const accuracy = total > 0 ? correct / total : null

  // First-try rate: the earliest attempt on each step, was it correct?
  const byStep = new Map<number, StepAttemptRecord[]>()
  for (const a of attempts) {
    const arr = byStep.get(a.stepIndex) ?? []
    arr.push(a)
    byStep.set(a.stepIndex, arr)
  }
  let firstTryCorrect = 0
  let stepsTried = 0
  for (const arr of byStep.values()) {
    arr.sort((x, y) => Date.parse(x.createdAt) - Date.parse(y.createdAt))
    stepsTried += 1
    if (arr[0]?.correct) firstTryCorrect += 1
  }
  const firstTryRate = stepsTried > 0 ? firstTryCorrect / stepsTried : null

  const completionIndex = lessonCompletionIndex(lesson)
  const progressFraction = completed
    ? 1
    : Math.max(0, Math.min(1, (progress?.stepIndex ?? 0) / Math.max(1, completionIndex)))

  // Peak mastery the learner has demonstrated.
  let peak = 0
  if (completed) {
    const acc = accuracy ?? 0.85
    const ft = firstTryRate ?? acc
    const quality = 0.55 * acc + 0.45 * ft
    peak = 60 + 40 * quality // completed lessons land in 60–100
  } else if (status === 'in_progress') {
    peak = 8 + 32 * progressFraction // 8–40 while working through it
  }

  // Recency / decay.
  const attemptTimes = attempts.map((a) => Date.parse(a.createdAt)).filter((t) => !Number.isNaN(t))
  const lastPracticed = Math.max(
    attemptTimes.length ? Math.max(...attemptTimes) : 0,
    parseTime(progress?.updatedAt) ?? 0,
  ) || null
  const daysSince = lastPracticed != null ? (now - lastPracticed) / DAY_MS : null
  const retention = completed && daysSince != null ? Math.exp(-daysSince / TAU_DAYS) : 1

  const score = completed
    ? Math.round(peak * (0.55 + 0.45 * retention))
    : Math.round(peak)

  const level: MasteryLevel = locked
    ? 'locked'
    : status === 'not_started'
      ? 'not_started'
      : scoreToLevel(score)

  return {
    lessonId: lesson.id,
    title: lesson.title,
    order: lesson.order,
    status,
    locked,
    score,
    peak: Math.round(peak),
    level,
    accuracy,
    firstTryRate,
    attempts: total,
    correct,
    lastPracticed,
    daysSince,
    retention,
    dueForReview: completed && retention < REVIEW_RETENTION,
    progressFraction,
  }
}

export function buildMastery(
  lessons: Lesson[],
  progressMap: Record<string, StoredLessonProgress>,
  attempts: StepAttemptRecord[],
  now: number = Date.now(),
): MasterySnapshot {
  const attemptsByLesson: Record<string, StepAttemptRecord[]> = {}
  for (const a of attempts) {
    ;(attemptsByLesson[a.lessonId] ??= []).push(a)
  }

  const list = lessons.map((lesson) =>
    computeLessonMastery(lesson, progressMap[lesson.id], attemptsByLesson[lesson.id] ?? [], progressMap, now),
  )

  const byId: Record<string, LessonMastery> = {}
  const counts = emptyCounts()
  for (const m of list) {
    byId[m.lessonId] = m
    counts[m.level] += 1
  }

  const totalAttempts = attempts.length
  const totalCorrect = attempts.filter((a) => a.correct).length
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : null

  let ftCorrect = 0
  let ftSteps = 0
  for (const m of list) {
    if (m.firstTryRate != null) {
      // Reconstruct counts from rate is lossy; approximate with attempts present.
      ftSteps += 1
      ftCorrect += m.firstTryRate
    }
  }
  const firstTryRate = ftSteps > 0 ? ftCorrect / ftSteps : null

  const overall = Math.round(list.reduce((s, m) => s + m.score, 0) / Math.max(1, list.length))
  const completedCount = list.filter((m) => m.status === 'completed').length

  const reviewQueue = list
    .filter((m) => m.dueForReview)
    .sort((a, b) => a.retention - b.retention)

  const next = list.find((m) => !m.locked && m.status !== 'completed') ?? null

  const completed = list.filter((m) => m.status === 'completed')

  // What should the learner do next? The path "knows where they are":
  // resume an unfinished lesson → review a fading one → start the next → all done.
  const inProgress = [...list]
    .filter((m) => m.status === 'in_progress')
    .sort((a, b) => (b.lastPracticed ?? 0) - (a.lastPracticed ?? 0))[0]
  let recommendation: Recommendation
  if (inProgress) {
    recommendation = {
      kind: 'resume',
      lesson: inProgress,
      reason: `You're ${Math.round(inProgress.progressFraction * 100)}% through — pick up where you left off.`,
    }
  } else if (reviewQueue.length) {
    recommendation = {
      kind: 'review',
      lesson: reviewQueue[0],
      reason: `${reviewQueue[0].title} is fading from memory — a quick review locks it back in.`,
    }
  } else if (next) {
    recommendation = { kind: 'start', lesson: next, reason: 'Next stop on your path.' }
  } else {
    recommendation = {
      kind: 'done',
      lesson: [...completed].sort((a, b) => a.score - b.score)[0] ?? null,
      reason: "You've finished the unit — keep your mastery sharp with a review.",
    }
  }
  const strengths = [...completed].sort((a, b) => b.score - a.score).slice(0, 3)
  const focus = [...list]
    .filter((m) => !m.locked && (m.status !== 'completed' || m.dueForReview))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  return {
    lessons: list,
    byId,
    overall,
    level: scoreToLevel(overall),
    counts,
    accuracy,
    firstTryRate,
    totalAttempts,
    totalCorrect,
    completedCount,
    totalLessons: lessons.length,
    reviewQueue,
    next,
    recommendation,
    strengths,
    focus,
  }
}

export function strandScore(strand: Strand, byId: Record<string, LessonMastery>): number {
  const members = strand.lessonIds.map((id) => byId[id]).filter(Boolean)
  if (!members.length) return 0
  return Math.round(members.reduce((s, m) => s + m.score, 0) / members.length)
}

/** Compact relative time, e.g. "just now", "3d ago", "2w ago". */
export function relativeTime(ms: number | null, now: number = Date.now()): string {
  if (ms == null) return 'never'
  const diff = Math.max(0, now - ms)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export { LEVEL_ORDER }
