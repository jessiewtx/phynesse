import type { Lesson } from '../types/lesson'
import type { LessonStatus, StoredLessonProgress } from './progressFirestore'
import l1 from '../../content/L1-work-energy.json'
import l2 from '../../content/L2-kinetic-energy.json'
import l3 from '../../content/L3-gravitational-pe.json'
import l4 from '../../content/L4-elastic-pe.json'
import l5 from '../../content/L5-conservation.json'
import l6 from '../../content/L6-power.json'

const lessons: Record<string, Lesson> = {
  L1: l1 as Lesson,
  L2: l2 as Lesson,
  L3: l3 as Lesson,
  L4: l4 as Lesson,
  L5: l5 as Lesson,
  L6: l6 as Lesson,
}

export function getLesson(id: string): Lesson | undefined {
  return lessons[id]
}

export function getAllLessons(): Lesson[] {
  return Object.values(lessons).sort((a, b) => a.order - b.order)
}

export function getNextLesson(afterId: string): Lesson | undefined {
  const current = lessons[afterId]
  if (!current) return undefined
  return getAllLessons().find((l) => l.order === current.order + 1)
}

export function lessonCompletionIndex(lesson: Lesson): number {
  const i = lesson.steps.findIndex((s) => s.type === 'complete')
  return i === -1 ? lesson.steps.length : i
}

export function statusForStepIndex(lesson: Lesson, stepIndex: number): LessonStatus {
  if (stepIndex >= lessonCompletionIndex(lesson)) return 'completed'
  return stepIndex > 0 ? 'in_progress' : 'not_started'
}

export function isLessonUnlocked(
  _lesson?: Lesson,
  _progressMap?: Record<string, StoredLessonProgress>,
): boolean {
  // Every lesson is open — learners can explore the unit in any order.
  return true
}
