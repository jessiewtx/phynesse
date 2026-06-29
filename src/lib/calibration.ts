import type { Confidence } from '../types/lesson'
import type { StepAttemptRecord } from './progressFirestore'

/**
 * Confidence calibration — a metacognition layer.
 *
 * Learning-science basis: learners are notoriously bad at judging what they
 * actually know (the Dunning–Kruger / overconfidence problem). Asking them to
 * commit to a confidence *before* seeing the result, then reflecting it back,
 * trains **metacognitive calibration**: knowing what you know. It directly targets
 * the persona's pain — "I thought I understood it" — by making the gap visible and
 * measurable on their own data.
 */

export const CONFIDENCE_ORDER: Confidence[] = ['guess', 'think', 'sure']

export const CONFIDENCE_META: Record<
  Confidence,
  { label: string; short: string; emoji: string; color: string }
> = {
  guess: { label: 'Just guessing', short: 'Guessing', emoji: '🤞', color: 'var(--text-3)' },
  think: { label: 'I think so', short: 'Think so', emoji: '🤔', color: 'var(--gold)' },
  sure: { label: "I'm sure", short: 'Sure', emoji: '💪', color: 'var(--teal)' },
}

/** A short, felt reflection shown right after grading a calibrated answer. */
export function calibrationMessage(confidence: Confidence, correct: boolean): string {
  if (correct) {
    switch (confidence) {
      case 'sure':
        return 'Sure and correct — that\u2019s real mastery. Well calibrated.'
      case 'think':
        return 'You thought so, and you were right. Trust that instinct a little more.'
      case 'guess':
        return 'A lucky guess landed it — let\u2019s make sure you could do it again, not just this once.'
    }
  }
  switch (confidence) {
    case 'sure':
      return 'You felt sure but missed it — that\u2019s exactly the kind of blind spot worth a second look.'
    case 'think':
      return 'Close call — you weren\u2019t certain, and this one slipped. Worth reinforcing.'
    case 'guess':
      return 'You called it a guess, and it missed — honest read. Let\u2019s build that into real understanding.'
  }
}

export type CalibrationBucket = {
  confidence: Confidence
  attempts: number
  correct: number
  accuracy: number // 0–1
}

export type CalibrationSummary = {
  total: number
  buckets: CalibrationBucket[]
  /** True when "Sure" answers are wrong often enough to flag overconfidence. */
  overconfident: boolean
  /** A one-line insight, or null when there isn't enough data. */
  insight: string | null
}

/**
 * Rolls up confidence-tagged attempts into per-level accuracy. Well-calibrated
 * learning looks like a staircase: high accuracy when "Sure", lower when
 * "Guessing". A flat or inverted shape means the learner can't yet tell.
 */
export function calibrationSummary(attempts: StepAttemptRecord[]): CalibrationSummary {
  const tagged = attempts.filter((a) => a.confidence != null)
  const buckets: CalibrationBucket[] = CONFIDENCE_ORDER.map((confidence) => {
    const inBucket = tagged.filter((a) => a.confidence === confidence)
    const correct = inBucket.filter((a) => a.correct).length
    return {
      confidence,
      attempts: inBucket.length,
      correct,
      accuracy: inBucket.length > 0 ? correct / inBucket.length : 0,
    }
  })

  const sure = buckets.find((b) => b.confidence === 'sure')!
  const overconfident = sure.attempts >= 3 && sure.accuracy < 0.7

  let insight: string | null = null
  if (tagged.length >= 4) {
    if (overconfident) {
      insight = `Watch out: you've been ${Math.round(sure.accuracy * 100)}% right when you felt sure. A few "sure" answers are slipping — slow down on those.`
    } else if (sure.attempts >= 3 && sure.accuracy >= 0.85) {
      insight = "Nicely calibrated — when you say you're sure, you usually are."
    } else {
      insight = "Keep rating your confidence — a clear pattern is taking shape."
    }
  }

  return { total: tagged.length, buckets, overconfident, insight }
}
