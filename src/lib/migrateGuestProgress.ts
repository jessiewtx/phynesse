import { loadProgress, clearProgress, loadGuestAttempts, clearGuestAttempts } from './progress'
import { fetchLessonProgress, saveLessonProgress, logStepAttempt, type LessonStatus } from './progressFirestore'
import { getAllLessons, statusForStepIndex } from './lessons'

const statusRank: Record<LessonStatus, number> = { not_started: 0, in_progress: 1, completed: 2 }

/**
 * After sign-in, fold any guest (localStorage) progress into Firestore.
 *
 * This must NEVER downgrade what's already on the server — a learner who
 * finished a lesson on one device should not have it reset because some stale
 * guest progress is still sitting in this browser's localStorage. We only write
 * when the guest copy is genuinely further along, and we clear the guest copy
 * afterwards so repeat sign-ins can't keep re-applying old data.
 */
export async function migrateGuestProgress(uid: string): Promise<void> {
  for (const lesson of getAllLessons()) {
    const local = loadProgress(lesson.id)
    if (!local) continue

    const guestStatus = statusForStepIndex(lesson, local.stepIndex)
    const remote = await fetchLessonProgress(uid, lesson.id)

    const guestRank = statusRank[guestStatus]
    const remoteRank = remote ? statusRank[remote.status] : -1
    const remoteStep = remote?.stepIndex ?? -1

    // Only adopt the guest copy when it's ahead of the server (better status, or
    // same status but further through the steps). Otherwise leave Firestore be.
    const guestIsAhead = guestRank > remoteRank || (guestRank === remoteRank && local.stepIndex > remoteStep)

    if (guestIsAhead) {
      await saveLessonProgress(uid, lesson.id, {
        stepIndex: local.stepIndex,
        stepDraft: local.stepDraft ?? null,
        drafts: local.drafts,
        status: guestStatus,
        totalSteps: lesson.steps.length,
      })
    }

    // Guest data has been reconciled — drop it so future sign-ins can't clobber.
    clearProgress(lesson.id)
  }

  // Carry over the guest attempt history (preserving timestamps so per-problem
  // mastery scoring stays accurate), then clear it so it isn't double-counted.
  const attempts = loadGuestAttempts()
  if (attempts.length) {
    for (const a of attempts) {
      await logStepAttempt(uid, a)
    }
    clearGuestAttempts()
  }
}
