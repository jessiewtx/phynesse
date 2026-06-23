import { loadProgress } from './progress'
import { saveLessonProgress } from './progressFirestore'
import { getAllLessons } from './lessons'

/** After sign-in, copy any guest (localStorage) progress into Firestore. */
export async function migrateGuestProgress(uid: string): Promise<void> {
  for (const lesson of getAllLessons()) {
    const local = loadProgress(lesson.id)
    if (!local) continue

    await saveLessonProgress(uid, lesson.id, {
      stepIndex: local.stepIndex,
      simParams: local.simParams,
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
}
