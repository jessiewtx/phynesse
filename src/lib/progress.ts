import type { LessonProgress, StepDraft } from '../types/lesson'
import type { StepAttemptRecord } from './progressFirestore'

const PREFIX = 'phynesse_progress_'
const ATTEMPTS_KEY = 'phynesse_attempts'

export function loadProgress(lessonId: string): LessonProgress | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${lessonId}`)
    if (!raw) return null
    return JSON.parse(raw) as LessonProgress
  } catch {
    return null
  }
}

export function saveProgress(
  lessonId: string,
  stepIndex: number,
  stepDraft?: StepDraft | null,
  drafts?: Record<number, StepDraft>,
): void {
  const data: LessonProgress = {
    lessonId,
    stepIndex,
    stepDraft: stepDraft ?? null,
    ...(drafts ? { drafts } : {}),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(`${PREFIX}${lessonId}`, JSON.stringify(data))
}

/** Remove a single lesson's guest progress (used after migrating to Firestore). */
export function clearProgress(lessonId: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${lessonId}`)
  } catch {
    // ignore
  }
}

/**
 * Guest attempt log. Mirrors the Firestore `attempts` collection so guests get
 * the same per-problem mastery scoring as signed-in learners.
 */
export function loadGuestAttempts(): StepAttemptRecord[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StepAttemptRecord[]) : []
  } catch {
    return []
  }
}

export function logGuestAttempt(record: Omit<StepAttemptRecord, 'createdAt'>): void {
  try {
    const all = loadGuestAttempts()
    all.push({ ...record, createdAt: new Date().toISOString() })
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all))
  } catch {
    // Storage full / unavailable — scoring simply falls back to no history.
  }
}

export function clearGuestAttempts(): void {
  try {
    localStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    // ignore
  }
}
