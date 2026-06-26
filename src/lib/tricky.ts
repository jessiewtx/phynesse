import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { BarDragStep, PredictNumericStep } from '../types/lesson'
import type { ConceptId } from './physics'

/**
 * The "tricky problems" notebook.
 *
 * Learning-science basis: spaced retrieval. Problems a learner struggles with are
 * captured and then resurfaced at *expanding* intervals (a Leitner box schedule).
 * Re-retrieving something just as it starts to fade is far stickier than re-reading
 * it, so each successful recall pushes the item further out; a miss snaps it back to
 * the start. Items "graduate" out of the notebook once recalled enough times.
 *
 * Storage mirrors the rest of the app: localStorage for guests, a per-user Firestore
 * subcollection for signed-in learners. The physics engine remains the source of
 * truth — we only ever store/replay the same renderable step the learner saw.
 */

export type TrickyStep = BarDragStep | PredictNumericStep

export type TrickyItem = {
  /** Stable id so the same problem dedupes: `lessonId:stepIndex` for lessons. */
  id: string
  source: 'lesson' | 'practice'
  /** Short label for cards (lesson title or concept name). */
  title: string
  conceptId?: ConceptId
  lessonId?: string
  stepIndex?: number
  /** The exact renderable step, replayed verbatim on review. */
  step: TrickyStep
  /** Leitner box (1 = just missed / shortest interval). */
  box: number
  /** ISO timestamp when this item is next due for review. */
  dueAt: string
  addedAt: string
  lastSeenAt?: string
  timesWrong: number
  timesSeen: number
}

const LS_KEY = 'phynesse_tricky'
const MAX_BOX = 4
/** Days to wait after a correct recall in box N (1-indexed), before it's due again. */
const INTERVALS = [1, 3, 7, 16]
const DAY_MS = 86_400_000

function nowIso(): string {
  return new Date().toISOString()
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

/* ── local (guest) storage ── */

function loadLocal(): TrickyItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as TrickyItem[]) : []
  } catch {
    return []
  }
}

function saveLocal(items: TrickyItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {
    // storage full / unavailable — review simply won't persist for this guest.
  }
}

/* ── Firestore (signed-in) storage ── */

function trickyCol(uid: string) {
  if (!db) throw new Error('Firestore not configured')
  return collection(db, 'users', uid, 'tricky')
}

/** Firestore doc ids can't contain "/". Our ids use ":" which is safe. */
function safeDocId(id: string): string {
  return id.replace(/\//g, '_')
}

/** Strips `undefined` (which Firestore rejects) via a JSON round-trip. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/* ── unified API (uid === null → guest) ── */

export async function loadTricky(uid: string | null): Promise<TrickyItem[]> {
  if (!uid || !db) return loadLocal()
  try {
    const snap = await getDocs(trickyCol(uid))
    return snap.docs.map((d) => d.data() as TrickyItem)
  } catch {
    return []
  }
}

async function putItem(uid: string | null, item: TrickyItem): Promise<void> {
  if (!uid || !db) {
    const items = loadLocal().filter((i) => i.id !== item.id)
    items.push(item)
    saveLocal(items)
    return
  }
  await setDoc(doc(trickyCol(uid), safeDocId(item.id)), clean(item))
}

async function dropItem(uid: string | null, id: string): Promise<void> {
  if (!uid || !db) {
    saveLocal(loadLocal().filter((i) => i.id !== id))
    return
  }
  await deleteDoc(doc(trickyCol(uid), safeDocId(id)))
}

export type CaptureInput = {
  id: string
  source: TrickyItem['source']
  title: string
  step: TrickyStep
  conceptId?: ConceptId
  lessonId?: string
  stepIndex?: number
}

/**
 * Records (or re-flags) a problem the learner struggled with. If it already
 * exists, it snaps back to box 1 and becomes due immediately — they missed it
 * again, so it needs more practice.
 */
export async function captureTricky(uid: string | null, input: CaptureInput): Promise<void> {
  const items = await loadTricky(uid)
  const existing = items.find((i) => i.id === input.id)
  const now = nowIso()

  if (existing) {
    await putItem(uid, {
      ...existing,
      box: 1,
      dueAt: now,
      timesWrong: existing.timesWrong + 1,
      lastSeenAt: now,
      // refresh the snapshot in case the step changed
      step: input.step,
      title: input.title,
    })
    return
  }

  await putItem(uid, {
    id: input.id,
    source: input.source,
    title: input.title,
    conceptId: input.conceptId,
    lessonId: input.lessonId,
    stepIndex: input.stepIndex,
    step: input.step,
    box: 1,
    dueAt: now,
    addedAt: now,
    timesWrong: 1,
    timesSeen: 0,
  })
}

export type GradeOutcome = 'promoted' | 'graduated' | 'reset'

/**
 * Records the result of a review. A clean first-try recall promotes the item to
 * the next box (longer interval) — or graduates it out once mastered. A miss
 * resets it to box 1, due again tomorrow.
 */
export async function gradeTricky(
  uid: string | null,
  id: string,
  solvedFirstTry: boolean,
): Promise<GradeOutcome> {
  const items = await loadTricky(uid)
  const item = items.find((i) => i.id === id)
  if (!item) return 'reset'

  const base: TrickyItem = {
    ...item,
    timesSeen: item.timesSeen + 1,
    lastSeenAt: nowIso(),
  }

  if (solvedFirstTry) {
    if (item.box >= MAX_BOX) {
      await dropItem(uid, id)
      return 'graduated'
    }
    const interval = INTERVALS[item.box - 1] ?? 7
    await putItem(uid, { ...base, box: item.box + 1, dueAt: plusDaysIso(interval) })
    return 'promoted'
  }

  await putItem(uid, {
    ...base,
    box: 1,
    timesWrong: item.timesWrong + 1,
    dueAt: plusDaysIso(1),
  })
  return 'reset'
}

export async function removeTricky(uid: string | null, id: string): Promise<void> {
  await dropItem(uid, id)
}

/** Items that are due now (or overdue), soonest-due first. */
export function dueItems(items: TrickyItem[]): TrickyItem[] {
  const now = Date.now()
  return items
    .filter((i) => new Date(i.dueAt).getTime() <= now)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}

/** Items not yet due (waiting to resurface), soonest-due first. */
export function upcomingItems(items: TrickyItem[]): TrickyItem[] {
  const now = Date.now()
  return items
    .filter((i) => new Date(i.dueAt).getTime() > now)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}
