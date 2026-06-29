import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { ConceptId } from './physics'
import type { MasterySnapshot } from './mastery'

/**
 * The interleaved Capstone — the unit's culminating mastery check.
 *
 * Learning-science basis: **interleaving** + **mastery learning**.
 *
 *   • Interleaving — instead of *blocking* (drilling one concept at a time, which
 *     lets the learner coast on "the last formula I saw"), the capstone *mixes*
 *     problem types so consecutive problems pull from different concepts. That
 *     forces the harder, more durable skill: first deciding *which* idea applies,
 *     then applying it. Blocked practice feels easier; interleaved practice
 *     transfers.
 *
 *   • Mastery learning — the capstone only unlocks once the learner has reached a
 *     real, demonstrated bar (Skilled, ≥80) on *every* lesson in the unit. There's
 *     a clear mastery signal to advance, not just "you clicked through."
 *
 * Every problem is minted and verified by the deterministic physics core (the same
 * generator the practice page uses), so the capstone needs no AI to be correct.
 */

/** Demonstrated mastery score required on every lesson to unlock the capstone. */
export const CAPSTONE_GATE_SCORE = 80 // "Skilled"
/** Concepts the capstone interleaves (the closed-form, generator-backed ones). */
export const CAPSTONE_CONCEPTS: ConceptId[] = ['work', 'kinetic', 'grav_pe', 'elastic_pe', 'power']
/** How many problems per concept the session draws. */
export const CAPSTONE_PER_CONCEPT = 2
/** First-try accuracy needed to pass and complete the unit. */
export const CAPSTONE_PASS = 0.7

export type GateProgress = {
  unlocked: boolean
  /** Lessons currently at or above the gate score. */
  met: number
  /** Total lessons in the unit. */
  total: number
  /** Lessons still short of the bar, weakest first (what to shore up next). */
  remaining: { lessonId: string; title: string; score: number }[]
}

/**
 * Has the learner earned the capstone? Every lesson must be completed AND sit at
 * the gate score — a unit-wide mastery signal, not a single good lesson.
 */
export function capstoneGate(m: MasterySnapshot): GateProgress {
  const total = m.lessons.length
  const remaining = m.lessons
    .filter((l) => l.status !== 'completed' || l.score < CAPSTONE_GATE_SCORE)
    .map((l) => ({ lessonId: l.lessonId, title: l.title, score: l.score }))
    .sort((a, b) => a.score - b.score)
  const met = total - remaining.length
  return { unlocked: total > 0 && remaining.length === 0, met, total, remaining }
}

/** Fisher–Yates shuffle (non-mutating). */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Builds the interleaved concept order: `perConcept` shuffled passes over the
 * concepts, stitched so no two *adjacent* problems share a concept (true
 * interleaving). With ≥2 distinct concepts this always succeeds.
 */
export function buildInterleavedConcepts(
  concepts: ConceptId[] = CAPSTONE_CONCEPTS,
  perConcept: number = CAPSTONE_PER_CONCEPT,
): ConceptId[] {
  const order: ConceptId[] = []
  for (let pass = 0; pass < perConcept; pass++) {
    const next = shuffle(concepts)
    // Avoid a repeat across the pass boundary by swapping the first element out.
    if (order.length > 0 && next[0] === order[order.length - 1] && next.length > 1) {
      const swapWith = next.findIndex((c, i) => i > 0 && c !== next[0])
      if (swapWith > 0) [next[0], next[swapWith]] = [next[swapWith], next[0]]
    }
    order.push(...next)
  }
  return order
}

export type CapstoneResult = {
  passed: boolean
  /** Best first-try accuracy ever achieved, 0–1. */
  bestScore: number
  /** Most recent attempt's first-try accuracy, 0–1. */
  lastScore: number
  attempts: number
  updatedAt: string
}

const GUEST_KEY = 'phynesse_capstone'

function loadGuest(): CapstoneResult | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as CapstoneResult) : null
  } catch {
    return null
  }
}

function saveGuest(result: CapstoneResult): void {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(result))
  } catch {
    // storage unavailable — capstone status just won't persist for this guest.
  }
}

/** Read the learner's capstone result (guest → localStorage, signed-in → Firestore). */
export async function loadCapstone(uid: string | null): Promise<CapstoneResult | null> {
  if (!uid || !db) return loadGuest()
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    const data = snap.exists() ? (snap.data().capstone as CapstoneResult | undefined) : undefined
    return data ?? null
  } catch {
    return null
  }
}

/**
 * Record a finished capstone attempt, keeping the best first-try score and
 * latching `passed` once the learner clears the bar.
 */
export async function recordCapstoneAttempt(
  uid: string | null,
  score: number,
): Promise<CapstoneResult> {
  const prev = (await loadCapstone(uid)) ?? {
    passed: false,
    bestScore: 0,
    lastScore: 0,
    attempts: 0,
    updatedAt: new Date().toISOString(),
  }
  const next: CapstoneResult = {
    passed: prev.passed || score >= CAPSTONE_PASS,
    bestScore: Math.max(prev.bestScore, score),
    lastScore: score,
    attempts: prev.attempts + 1,
    updatedAt: new Date().toISOString(),
  }
  if (!uid || !db) {
    saveGuest(next)
  } else {
    await setDoc(
      doc(db, 'users', uid),
      { capstone: next, lastActiveAt: serverTimestamp() },
      { merge: true },
    )
  }
  return next
}
