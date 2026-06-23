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
import type { LessonProgress, PushBlockParams, StepDraft } from '../types/lesson'

export type LessonStatus = 'not_started' | 'in_progress' | 'completed'

export type StoredLessonProgress = {
  lessonId: string
  stepIndex: number
  simParams: PushBlockParams
  stepDraft?: StepDraft | null
  status: LessonStatus
  updatedAt: string
}

export type StepAttemptRecord = {
  lessonId: string
  stepIndex: number
  stepType: string
  answer: string | number
  correct: boolean
  hintShown?: string
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
  data: Pick<LessonProgress, 'stepIndex' | 'simParams' | 'stepDraft'> & {
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

  await setDoc(
    progressRef(uid, lessonId),
    {
      lessonId,
      stepIndex: data.stepIndex,
      simParams: data.simParams,
      stepDraft: data.stepDraft ?? null,
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
  record: Omit<StepAttemptRecord, 'createdAt'>,
): Promise<void> {
  if (!db) return
  const id = crypto.randomUUID()
  await setDoc(doc(db, 'users', uid, 'attempts', id), {
    ...record,
    createdAt: new Date().toISOString(),
  })
}

export async function fetchAttempts(uid: string): Promise<StepAttemptRecord[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'users', uid, 'attempts')))
  return snap.docs.map((d) => d.data() as StepAttemptRecord)
}
