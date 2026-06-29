import type { StepAttemptRecord } from './progressFirestore'

/**
 * Measured learning-science effects — not the techniques themselves, but evidence
 * they're *working*, computed from the learner's own attempt log.
 *
 * The headline metric is **mistake recovery**: a problem first answered wrong and
 * later answered right. That's retrieval practice paying off — and when the right
 * answer lands in a *later study session* (a real time gap, not the same sitting),
 * it's the spacing effect specifically. We surface both so the learner can see the
 * abstract principle turn into their own concrete progress.
 */

/** Correct answers within this gap of a miss count as the same study sitting. */
const SESSION_GAP_MS = 30 * 60 * 1000

export type LearningEffects = {
  /** Distinct graded problems the learner has ever missed. */
  missed: number
  /** Of those, how many they later got right (any time after the miss). */
  recovered: number
  /** Of the recovered, how many were re-solved in a *separate* later session. */
  spacedRecovered: number
  /** recovered / missed, the retrieval-practice recovery rate (0–1, or null). */
  recoveryRate: number | null
  /** First-try accuracy on the learner's first-ever encounter of each problem. */
  firstTryRate: number | null
  /** Total distinct graded problems attempted. */
  problems: number
}

const EMPTY: LearningEffects = {
  missed: 0,
  recovered: 0,
  spacedRecovered: 0,
  recoveryRate: null,
  firstTryRate: null,
  problems: 0,
}

/** Stable key for "the same problem" across content tweaks. */
function problemKey(a: StepAttemptRecord): string {
  return `${a.lessonId}:${a.stepIndex}:${a.stepType}`
}

export function learningEffects(attempts: StepAttemptRecord[]): LearningEffects {
  if (attempts.length === 0) return EMPTY

  const byProblem = new Map<string, StepAttemptRecord[]>()
  for (const a of attempts) {
    const key = problemKey(a)
    const arr = byProblem.get(key) ?? []
    arr.push(a)
    byProblem.set(key, arr)
  }

  let missed = 0
  let recovered = 0
  let spacedRecovered = 0
  let firstTryCorrect = 0
  let firstAttempts = 0

  for (const arr of byProblem.values()) {
    const ordered = arr
      .map((a) => ({ t: Date.parse(a.createdAt), correct: a.correct }))
      .filter((a) => !Number.isNaN(a.t))
      .sort((a, b) => a.t - b.t)
    if (ordered.length === 0) continue

    firstAttempts += 1
    if (ordered[0].correct) firstTryCorrect += 1

    // Time of the first miss, then look for a later correct answer.
    const firstMiss = ordered.find((a) => !a.correct)
    if (!firstMiss) continue
    missed += 1

    const laterCorrect = ordered.find((a) => a.correct && a.t > firstMiss.t)
    if (laterCorrect) {
      recovered += 1
      if (laterCorrect.t - firstMiss.t > SESSION_GAP_MS) spacedRecovered += 1
    }
  }

  return {
    missed,
    recovered,
    spacedRecovered,
    recoveryRate: missed > 0 ? recovered / missed : null,
    firstTryRate: firstAttempts > 0 ? firstTryCorrect / firstAttempts : null,
    problems: byProblem.size,
  }
}
