import type { Lesson } from '../types/lesson'
import type { StoredLessonProgress } from './progressFirestore'
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

export function isLessonUnlocked(
  lesson: Lesson,
  progressMap: Record<string, StoredLessonProgress>,
): boolean {
  if (lesson.order === 1) return true
  const prev = getAllLessons().find((l) => l.order === lesson.order - 1)
  if (!prev) return true
  return progressMap[prev.id]?.status === 'completed'
}
