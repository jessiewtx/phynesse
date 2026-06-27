import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { parseGivenNumber, type ConceptId } from './physics'

/**
 * "Boss battles" — targeted misconception confrontation.
 *
 * Learning-science basis: a repeated *error pattern* (not random misses) is the
 * thing worth attacking. Generic practice rarely fixes a specific slip; problems
 * engineered to provoke the exact mistake — solved cleanly, in a row — do. So we
 * watch every miss, classify the *kind* of slip from the engine's ground truth
 * (ratio of the learner's answer to the correct one, plus given-echo / g checks),
 * and once the same slip recurs enough we spawn a themed "boss": a short streak of
 * that-concept problems the learner must clear in a row to "defeat" the habit.
 *
 * The physics engine stays the source of truth — bosses only decide WHICH concept
 * to drill and how to phrase the fix. Storage mirrors the rest of the app:
 * localStorage for guests, a per-user Firestore subcollection for signed-in users.
 */

export type MisconceptionId =
  | 'dropped_half'
  | 'missing_double'
  | 'forgot_square'
  | 'over_square'
  | 'g_mixup'
  | 'echoed_given'

export type BossMeta = {
  /** Playful boss name shown in the UI. */
  name: string
  /** One-line description of the slip it represents. */
  tagline: string
  /** Brock's targeted tip, shown going into the battle. */
  tip: string
  emoji: string
}

export const BOSS_CATALOG: Record<MisconceptionId, BossMeta> = {
  dropped_half: {
    name: 'The Half-Off Bug',
    tagline: 'Your answers keep coming out twice too big — the ½ is going missing.',
    tip: 'For energies like KE = ½mv² and U_s = ½kx², the ½ is part of the formula. Multiply by 0.5 every time.',
    emoji: '🐛',
  },
  missing_double: {
    name: 'The Halve-Truth',
    tagline: 'Your answers keep coming out half the right size — a factor of 2 is slipping away.',
    tip: 'Re-check every coefficient in the formula. Did a 2 (or a doubled quantity) get dropped?',
    emoji: '🪤',
  },
  forgot_square: {
    name: 'The Missing Square',
    tagline: 'Answers landing way too small — a squared term is being left un-squared.',
    tip: 'In KE = ½mv² and U_s = ½kx², the speed/stretch is SQUARED. Square it before multiplying.',
    emoji: '🔲',
  },
  over_square: {
    name: 'The Over-Square',
    tagline: 'Answers blowing up too large — something is getting squared (or doubled) that shouldn’t be.',
    tip: 'Only ONE quantity is squared in these formulas. Mass and the spring constant are NOT squared.',
    emoji: '💥',
  },
  g_mixup: {
    name: 'The Gravity Gremlin',
    tagline: 'Your gravity answers are drifting — mixing up g = 9.8 and g = 10.',
    tip: 'AP Physics 1 accepts g = 9.8 or g = 10 m/s². Pick one and use it consistently in U_g = mgh.',
    emoji: '👾',
  },
  echoed_given: {
    name: 'The Copy-Paste',
    tagline: 'A given number is being handed back as the final answer instead of combined.',
    tip: 'The answer almost never equals one of the givens. Plug ALL the givens into the formula, then compute.',
    emoji: '📋',
  },
}

/** Misses of the same slip before a boss is spawned. */
export const SPAWN_AFTER = 3
/** Clean-in-a-row solves needed to defeat a boss. */
export const BOSS_HP = 3

/**
 * Classifies a single miss into a misconception, using the engine's correct value
 * as ground truth. Returns null when the slip isn't a recognizable pattern (a
 * one-off arithmetic typo shouldn't feed a boss).
 */
export function classifyMiss(
  correctValue: number,
  learnerAnswer: number,
  givenValues: number[] = [],
): MisconceptionId | null {
  if (!Number.isFinite(learnerAnswer) || correctValue === 0) return null

  const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(Math.abs(b) * 0.03, 0.01)

  for (const g of givenValues) {
    if (g !== correctValue && near(learnerAnswer, g)) return 'echoed_given'
  }

  const ratio = learnerAnswer / correctValue
  if (near(ratio, 10 / 9.8) || near(ratio, 9.8 / 10)) return 'g_mixup'
  if (near(ratio, 2)) return 'dropped_half'
  if (near(ratio, 0.5)) return 'missing_double'
  if (near(ratio, 4)) return 'over_square'
  if (near(ratio, 0.25)) return 'forgot_square'
  return null
}

/** Pulls numeric values out of a step's givens (e.g. "5.0 N" → 5). */
export function givenNumbers(givens?: { label: string; value: string }[]): number[] {
  if (!givens) return []
  return givens
    .map((g) => parseGivenNumber(g.value))
    .filter((n): n is number => n !== null)
}

export type BossStatus = 'tracking' | 'active' | 'defeated'

export type BossRecord = {
  /** `${conceptId}:${misconceptionId}` — one boss per concept+slip pairing. */
  id: string
  conceptId: ConceptId
  misconceptionId: MisconceptionId
  /** How many times this slip has been seen since it last (re)started tracking. */
  hits: number
  status: BossStatus
  firstSeenAt: string
  updatedAt: string
  timesDefeated: number
}

const LS_KEY = 'phynesse_bosses'

function nowIso(): string {
  return new Date().toISOString()
}

/* ── local (guest) storage ── */

function loadLocal(): BossRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BossRecord[]) : []
  } catch {
    return []
  }
}

function saveLocal(items: BossRecord[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {
    // storage full / unavailable — bosses just won't persist for this guest.
  }
}

/* ── Firestore (signed-in) storage ── */

function bossCol(uid: string) {
  if (!db) throw new Error('Firestore not configured')
  return collection(db, 'users', uid, 'bosses')
}

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/* ── unified API (uid === null → guest) ── */

export async function loadBosses(uid: string | null): Promise<BossRecord[]> {
  if (!uid || !db) return loadLocal()
  try {
    const snap = await getDocs(bossCol(uid))
    return snap.docs.map((d) => d.data() as BossRecord)
  } catch {
    return []
  }
}

async function putBoss(uid: string | null, item: BossRecord): Promise<void> {
  if (!uid || !db) {
    const items = loadLocal().filter((i) => i.id !== item.id)
    items.push(item)
    saveLocal(items)
    return
  }
  await setDoc(doc(bossCol(uid), item.id), clean(item))
}

export async function removeBoss(uid: string | null, id: string): Promise<void> {
  if (!uid || !db) {
    saveLocal(loadLocal().filter((i) => i.id !== id))
    return
  }
  await deleteDoc(doc(bossCol(uid), id))
}

/**
 * Records one classified miss. Bumps the hit counter; once it crosses the spawn
 * threshold the boss becomes `active`. A slip that recurs after being defeated
 * starts tracking again from scratch.
 */
export async function recordMiss(
  uid: string | null,
  conceptId: ConceptId,
  misconceptionId: MisconceptionId,
): Promise<void> {
  const id = `${conceptId}:${misconceptionId}`
  const items = await loadBosses(uid)
  const existing = items.find((i) => i.id === id)
  const now = nowIso()

  if (!existing) {
    await putBoss(uid, {
      id,
      conceptId,
      misconceptionId,
      hits: 1,
      status: 'tracking',
      firstSeenAt: now,
      updatedAt: now,
      timesDefeated: 0,
    })
    return
  }

  // A defeated slip that comes back restarts the count (don't re-spawn instantly).
  const baseHits = existing.status === 'defeated' ? 0 : existing.hits
  const hits = baseHits + 1
  const status: BossStatus = hits >= SPAWN_AFTER ? 'active' : 'tracking'
  await putBoss(uid, { ...existing, hits, status, updatedAt: now })
}

/** Marks a boss beaten: it leaves the active list and resets its counter. */
export async function defeatBoss(uid: string | null, id: string): Promise<void> {
  const items = await loadBosses(uid)
  const item = items.find((i) => i.id === id)
  if (!item) return
  await putBoss(uid, {
    ...item,
    hits: 0,
    status: 'defeated',
    updatedAt: nowIso(),
    timesDefeated: item.timesDefeated + 1,
  })
}

/** Bosses that have crossed the spawn threshold and are waiting to be fought. */
export function activeBosses(items: BossRecord[]): BossRecord[] {
  return items
    .filter((i) => i.status === 'active')
    .sort((a, b) => b.hits - a.hits || a.firstSeenAt.localeCompare(b.firstSeenAt))
}
