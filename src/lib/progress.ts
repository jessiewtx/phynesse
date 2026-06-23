import type { LessonProgress, PushBlockParams, StepDraft } from '../types/lesson'

const PREFIX = 'phynesse_progress_'

export function loadProgress(lessonId: string): LessonProgress | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${lessonId}`)
    if (!raw) return null
    return JSON.parse(raw) as LessonProgress
  } catch {
    return null
  }
}

export function saveProgress(
  lessonId: string,
  stepIndex: number,
  simParams: PushBlockParams,
  stepDraft?: StepDraft | null,
): void {
  const data: LessonProgress = {
    lessonId,
    stepIndex,
    simParams,
    stepDraft: stepDraft ?? null,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(`${PREFIX}${lessonId}`, JSON.stringify(data))
}

export function clearProgress(lessonId: string): void {
  localStorage.removeItem(`${PREFIX}${lessonId}`)
}
