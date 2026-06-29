import type { StepAttemptRecord } from './progressFirestore'

/**
 * The memory model — a forgetting curve driven by spaced retrieval.
 *
 * Learning-science basis: the **spacing effect** + the **testing effect**. Memory
 * is not "did you score well once" — it's a strength that *fades over time* and is
 * *re-strengthened most* when you successfully recall something just as it starts
 * to slip. We model that directly:
 *
 *   • Each successful recall is a *retrieval event*. Attempts clustered in time
 *     (same study session) count once — cramming ten reps in a row is one retrieval.
 *   • A retrieval has a memory *stability* S (in days): retention decays as
 *         R(t) = exp(-Δt / S)
 *     where Δt is the time since the last successful recall.
 *   • Every spaced retrieval *grows* S. A recall that lands after the memory has
 *     already faded a lot (low R at recall time — "desirable difficulty") grows S
 *     more than a recall while it's still fresh. So well-spaced practice compounds;
 *     massed practice barely moves the needle.
 *
 * This single estimate then drives concept-level spaced review: a lesson becomes
 * "due" when its predicted retention drops below a threshold, and `dueAt` tells the
 * UI when it will resurface. It is deliberately separate from the *demonstrated*
 * mastery score (which never decays, so the learner is never punished for time
 * passing) — the model only ever *recommends* a refresh, it doesn't take credit away.
 *
 * Pure and dependency-free: feed it the attempt log + an optional completion time
 * and it returns a fully-derived estimate.
 */

const DAY_MS = 86_400_000
/** Correct attempts within this window collapse into one retrieval session. */
const SESSION_GAP_MS = 30 * 60 * 1000
/** Stability (days) granted by the very first successful retrieval. With the
 *  review threshold below this puts the first review ~3 days out — long enough to
 *  not nag right after finishing, soon enough to catch it before it's gone. */
const S0 = 7
/** Upper bound on how much a single perfectly-spaced retrieval can grow stability. */
const MAX_GROWTH = 2.4

/** Retention at or below this means a concept is fading and worth refreshing. */
export const REVIEW_RETENTION_THRESHOLD = 0.66

export type MemoryEstimate = {
  /** 0–1 estimated probability of recalling this right now. */
  retention: number
  /** Memory stability in days — the forgetting curve's time constant. */
  stability: number
  /** ms timestamp of the most recent successful retrieval, or null. */
  lastRetrieval: number | null
  /** ms timestamp when retention is predicted to fall to the review threshold. */
  dueAt: number | null
  /** Count of distinct (spaced) successful retrieval sessions. */
  retrievals: number
}

const EMPTY: MemoryEstimate = {
  retention: 0,
  stability: 0,
  lastRetrieval: null,
  dueAt: null,
  retrievals: 0,
}

/** Collapse correct attempts into spaced retrieval *sessions* (ascending times). */
function retrievalSessions(attempts: StepAttemptRecord[]): number[] {
  const correct = attempts
    .filter((a) => a.correct)
    .map((a) => Date.parse(a.createdAt))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b)

  const sessions: number[] = []
  for (const t of correct) {
    const last = sessions[sessions.length - 1]
    if (last == null || t - last > SESSION_GAP_MS) {
      sessions.push(t)
    } else {
      // Same session — keep the latest time so decay measures from session end.
      sessions[sessions.length - 1] = t
    }
  }
  return sessions
}

/**
 * Estimate the current memory strength for a concept/lesson from its successful
 * retrievals. `extraRetrieval` (e.g. the lesson's completion time) is folded in as
 * an additional retrieval session when it isn't already covered by an attempt.
 */
export function estimateMemory(
  attempts: StepAttemptRecord[],
  extraRetrieval: number | null,
  now: number = Date.now(),
): MemoryEstimate {
  const sessions = retrievalSessions(attempts)

  if (extraRetrieval != null && !Number.isNaN(extraRetrieval)) {
    const last = sessions[sessions.length - 1]
    if (last == null || Math.abs(extraRetrieval - last) > SESSION_GAP_MS) {
      sessions.push(extraRetrieval)
      sessions.sort((a, b) => a - b)
    }
  }

  if (sessions.length === 0) return EMPTY

  // Build stability up through each spaced retrieval.
  let stability = S0
  for (let i = 1; i < sessions.length; i++) {
    const gapDays = (sessions[i] - sessions[i - 1]) / DAY_MS
    // Predicted retention at the moment of this retrieval. Recalling after more
    // forgetting (smaller R) earns a bigger stability boost — desirable difficulty.
    const rAtRecall = Math.exp(-gapDays / stability)
    stability *= 1 + (MAX_GROWTH - 1) * (1 - rAtRecall)
  }

  const lastRetrieval = sessions[sessions.length - 1]
  const daysSince = Math.max(0, (now - lastRetrieval) / DAY_MS)
  const retention = Math.exp(-daysSince / stability)

  // Solve exp(-t / S) = threshold  →  t = -S · ln(threshold).
  const dueAt = lastRetrieval + -stability * Math.log(REVIEW_RETENTION_THRESHOLD) * DAY_MS

  return {
    retention: Math.max(0, Math.min(1, retention)),
    stability,
    lastRetrieval,
    dueAt,
    retrievals: sessions.length,
  }
}
