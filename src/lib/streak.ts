import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

/** A learner's habit-loop state: daily streak + completion milestones. */
export type StreakStats = {
  currentStreak: number
  longestStreak: number
  lastActiveDay: string | null // local 'YYYY-MM-DD'
  activeDays: number
  completedLessons: string[]
}

export type Milestone = {
  id: string
  label: string
  blurb: string
  icon: string
}

const GUEST_KEY = 'phynesse_streak'

export function emptyStats(): StreakStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    activeDays: 0,
    completedLessons: [],
  }
}

/** Local-timezone day key, e.g. "2026-06-23". */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const aMs = Date.UTC(ay, am - 1, ad)
  const bMs = Date.UTC(by, bm - 1, bd)
  return Math.round((bMs - aMs) / 86_400_000)
}

/** Pure: fold a day of activity into the stats. Idempotent within the same day. */
export function registerActivity(stats: StreakStats, today = dayKey()): StreakStats {
  if (stats.lastActiveDay === today) return stats

  let currentStreak: number
  if (stats.lastActiveDay && daysBetween(stats.lastActiveDay, today) === 1) {
    currentStreak = stats.currentStreak + 1
  } else {
    currentStreak = 1
  }

  return {
    ...stats,
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    lastActiveDay: today,
    activeDays: stats.activeDays + 1,
  }
}

/** Pure: record a finished lesson (deduped). */
export function registerCompletion(stats: StreakStats, lessonId: string): StreakStats {
  if (stats.completedLessons.includes(lessonId)) return stats
  return { ...stats, completedLessons: [...stats.completedLessons, lessonId] }
}

const STREAK_MILESTONES: { days: number; milestone: Milestone }[] = [
  { days: 3, milestone: { id: 'streak-3', icon: '🔥', label: '3-day streak', blurb: 'Three days in a row — a habit is forming.' } },
  { days: 7, milestone: { id: 'streak-7', icon: '⚡', label: '7-day streak', blurb: 'A full week of physics. Momentum!' } },
  { days: 14, milestone: { id: 'streak-14', icon: '🌟', label: '14-day streak', blurb: 'Two weeks strong — this is sticking.' } },
  { days: 30, milestone: { id: 'streak-30', icon: '🏆', label: '30-day streak', blurb: 'A month of daily practice. Unstoppable.' } },
]

const LESSON_MILESTONES: { count: number; milestone: Milestone }[] = [
  { count: 1, milestone: { id: 'lessons-1', icon: '✅', label: 'First lesson done', blurb: 'You finished your first lesson. The hard part is starting.' } },
  { count: 3, milestone: { id: 'lessons-3', icon: '📘', label: 'Halfway there', blurb: 'Three lessons down — energy is clicking.' } },
  { count: 6, milestone: { id: 'lessons-6', icon: '🎓', label: 'Unit complete', blurb: 'You finished every lesson in the unit. Real mastery.' } },
]

/** All milestones the learner has earned, given their stats. */
export function earnedMilestones(stats: StreakStats): Milestone[] {
  const earned: Milestone[] = []
  for (const { days, milestone } of STREAK_MILESTONES) {
    if (stats.longestStreak >= days) earned.push(milestone)
  }
  for (const { count, milestone } of LESSON_MILESTONES) {
    if (stats.completedLessons.length >= count) earned.push(milestone)
  }
  return earned
}

/** Milestones present in `after` but not in `before`. */
export function newlyEarned(before: StreakStats, after: StreakStats): Milestone[] {
  const had = new Set(earnedMilestones(before).map((m) => m.id))
  return earnedMilestones(after).filter((m) => !had.has(m.id))
}

// ── Guest (localStorage) ──────────────────────────────────────────────

export function loadGuestStreak(): StreakStats {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return emptyStats()
    return { ...emptyStats(), ...(JSON.parse(raw) as Partial<StreakStats>) }
  } catch {
    return emptyStats()
  }
}

export function saveGuestStreak(stats: StreakStats): void {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(stats))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ── Firestore (signed in) ─────────────────────────────────────────────

function pickStats(data: Record<string, unknown> | undefined): StreakStats {
  if (!data) return emptyStats()
  return {
    currentStreak: Number(data.currentStreak ?? 0),
    longestStreak: Number(data.longestStreak ?? 0),
    lastActiveDay: (data.lastActiveDay as string) ?? null,
    activeDays: Number(data.activeDays ?? 0),
    completedLessons: Array.isArray(data.completedLessons)
      ? (data.completedLessons as string[])
      : [],
  }
}

export async function fetchStreak(uid: string): Promise<StreakStats> {
  if (!db) return emptyStats()
  const snap = await getDoc(doc(db, 'users', uid))
  return pickStats(snap.exists() ? snap.data() : undefined)
}

async function saveStreak(uid: string, stats: StreakStats): Promise<void> {
  if (!db) return
  await setDoc(
    doc(db, 'users', uid),
    { ...stats, lastActiveAt: serverTimestamp() },
    { merge: true },
  )
}

// ── Unified API (uid === null → guest) ───────────────────────────────

/** Read current stats from the right backing store. */
export async function getStreak(uid: string | null): Promise<StreakStats> {
  return uid ? fetchStreak(uid) : loadGuestStreak()
}

/** Mark today active. Returns updated stats. */
export async function touchStreak(uid: string | null): Promise<StreakStats> {
  const current = await getStreak(uid)
  const next = registerActivity(current)
  if (next !== current) {
    if (uid) await saveStreak(uid, next)
    else saveGuestStreak(next)
  }
  return next
}

/** Record a completed lesson (also counts as activity). Returns new stats + any milestones just earned. */
export async function completeLesson(
  uid: string | null,
  lessonId: string,
): Promise<{ stats: StreakStats; milestones: Milestone[] }> {
  const before = await getStreak(uid)
  const next = registerCompletion(registerActivity(before), lessonId)
  if (uid) await saveStreak(uid, next)
  else saveGuestStreak(next)
  return { stats: next, milestones: newlyEarned(before, next) }
}

/** On sign-in, fold guest streak into the account, keeping the better numbers. */
export async function migrateGuestStreak(uid: string): Promise<void> {
  const guest = loadGuestStreak()
  if (guest.lastActiveDay === null && guest.completedLessons.length === 0) return

  const remote = await fetchStreak(uid)
  const merged: StreakStats = {
    currentStreak: Math.max(remote.currentStreak, guest.currentStreak),
    longestStreak: Math.max(remote.longestStreak, guest.longestStreak),
    lastActiveDay:
      !remote.lastActiveDay || (guest.lastActiveDay ?? '') > remote.lastActiveDay
        ? guest.lastActiveDay
        : remote.lastActiveDay,
    activeDays: Math.max(remote.activeDays, guest.activeDays),
    completedLessons: Array.from(
      new Set([...remote.completedLessons, ...guest.completedLessons]),
    ),
  }
  await saveStreak(uid, merged)
  saveGuestStreak(emptyStats())
}
