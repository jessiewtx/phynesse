import { loadProgress, loadGuestAttempts, clearGuestAttempts } from './progress'
import { saveLessonProgress, logStepAttempt } from './progressFirestore'
import { getAllLessons } from './lessons'

/** After sign-in, copy any guest (localStorage) progress into Firestore. */
export async function migrateGuestProgress(uid: string): Promise<void> {
  for (const lesson of getAllLessons()) {
    const local = loadProgress(lesson.id)
    if (!local) continue

    await saveLessonProgress(uid, lesson.id, {
      stepIndex: local.stepIndex,
      stepDraft: local.stepDraft ?? null,
      status:
        local.stepIndex >= lesson.steps.length
          ? 'completed'
          : local.stepIndex > 0
            ? 'in_progress'
            : 'not_started',
      totalSteps: lesson.steps.length,
    })
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
