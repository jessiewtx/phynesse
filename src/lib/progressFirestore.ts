import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { LessonProgress, StepDraft } from '../types/lesson'

export type LessonStatus = 'not_started' | 'in_progress' | 'completed'

export type StoredLessonProgress = {
  lessonId: string
  stepIndex: number
  stepDraft?: StepDraft | null
  drafts?: Record<string, StepDraft>
  status: LessonStatus
  updatedAt: string
}

/** Firestore rejects documents containing `undefined`, so drop undefined fields
 *  from each draft before persisting the per-step draft map. */
function sanitizeDrafts(
  drafts?: Record<number, StepDraft>,
): Record<string, StepDraft> | undefined {
  if (!drafts) return undefined
  const out: Record<string, StepDraft> = {}
  for (const [key, draft] of Object.entries(drafts)) {
    if (!draft) continue
    const clean: StepDraft = {
      showWrongFeedback: draft.showWrongFeedback,
      attemptCount: draft.attemptCount,
    }
    if (draft.answer !== undefined) clean.answer = draft.answer
    if (draft.feedbackText !== undefined) clean.feedbackText = draft.feedbackText
    if (draft.solved !== undefined) clean.solved = draft.solved
    out[key] = clean
  }
  return out
}

export type StepAttemptRecord = {
  lessonId: string
  stepIndex: number
  stepType: string
  answer: string | number
  correct: boolean
  hintShown?: string
  /** Learner's self-rated confidence at submit time (calibration). */
  confidence?: 'guess' | 'think' | 'sure'
  createdAt: string
}

function progressRef(uid: string, lessonId: string) {
  if (!db) throw new Error('Firestore not configured')
  return doc(db, 'users', uid, 'progress', lessonId)
}

export async function fetchLessonProgress(
  uid: string,
  lessonId: string,
): Promise<StoredLessonProgress | null> {
  const snap = await getDoc(progressRef(uid, lessonId))
  if (!snap.exists()) return null
  return snap.data() as StoredLessonProgress
}

export async function fetchAllLessonProgress(
  uid: string,
): Promise<Record<string, StoredLessonProgress>> {
  if (!db) return {}
  const q = query(collection(db, 'users', uid, 'progress'))
  const snap = await getDocs(q)
  const out: Record<string, StoredLessonProgress> = {}
  snap.forEach((d) => {
    out[d.id] = d.data() as StoredLessonProgress
  })
  return out
}

export async function saveLessonProgress(
  uid: string,
  lessonId: string,
  data: Pick<LessonProgress, 'stepIndex' | 'stepDraft' | 'drafts'> & {
    status: LessonStatus
    totalSteps: number
  },
): Promise<void> {
  const status =
    data.status === 'completed'
      ? 'completed'
      : data.stepIndex > 0
        ? 'in_progress'
        : 'not_started'

  const drafts = sanitizeDrafts(data.drafts)

  await setDoc(
    progressRef(uid, lessonId),
    {
      lessonId,
      stepIndex: data.stepIndex,
      stepDraft: data.stepDraft ?? null,
      ...(drafts ? { drafts } : {}),
      status: data.stepIndex >= data.totalSteps ? 'completed' : status,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )

  await setDoc(
    doc(db!, 'users', uid),
    { lastActiveAt: serverTimestamp() },
    { merge: true },
  )
}

export async function logStepAttempt(
  uid: string,
  record: Omit<StepAttemptRecord, 'createdAt'> & { createdAt?: string },
): Promise<void> {
  if (!db) return
  const id = crypto.randomUUID()
  const { createdAt, hintShown, confidence, ...rest } = record
  // Firestore rejects documents containing `undefined` field values, which
  // would silently drop the write. Correct answers carry no hint, so we must
  // omit `hintShown` entirely rather than set it to undefined — otherwise every
  // correct attempt fails to save and mastery never registers.
  const data: Record<string, unknown> = {
    ...rest,
    createdAt: createdAt ?? new Date().toISOString(),
  }
  if (hintShown !== undefined) data.hintShown = hintShown
  if (confidence !== undefined) data.confidence = confidence
  await setDoc(doc(db, 'users', uid, 'attempts', id), data)
}

export async function fetchAttempts(uid: string): Promise<StepAttemptRecord[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'users', uid, 'attempts')))
  return snap.docs.map((d) => d.data() as StepAttemptRecord)
}
