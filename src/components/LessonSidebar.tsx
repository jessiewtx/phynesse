import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked, statusForStepIndex } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import { fetchAllLessonProgress, type StoredLessonProgress } from '../lib/progressFirestore'

type Props = {
  currentLessonId?: string
}

/** Left-hand course rail: overview link + every lesson with its status. */
export function LessonSidebar({ currentLessonId }: Props) {
  const { user, isSignedIn } = useAuth()
  const lessons = getAllLessons()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})

  useEffect(() => {
    const all = getAllLessons()
    if (isSignedIn && user) {
      fetchAllLessonProgress(user.uid).then(setProgressMap)
      return
    }
    const guest: Record<string, StoredLessonProgress> = {}
    for (const lesson of all) {
      const local = loadProgress(lesson.id)
      if (local) {
        guest[lesson.id] = {
          lessonId: lesson.id,
          stepIndex: local.stepIndex,
          simParams: local.simParams,
          stepDraft: local.stepDraft ?? null,
          status: statusForStepIndex(lesson, local.stepIndex),
          updatedAt: local.updatedAt,
        }
      }
    }
    setProgressMap(guest)
  }, [isSignedIn, user])

  return (
    <aside className="lesson-sidebar">
      <Link to="/" className="lesson-sidebar__overview">
        ← Course overview
      </Link>

      <Link to="/progress" className="lesson-sidebar__tab">
        <span className="lesson-sidebar__tab-icon">📊</span>
        Progress &amp; mastery
      </Link>

      <p className="lesson-sidebar__label">Lessons</p>
      <nav className="lesson-sidebar__list">
        {lessons.map((lesson) => {
          const prog = progressMap[lesson.id]
          const complete = prog?.status === 'completed'
          const locked = !isLessonUnlocked(lesson, progressMap)
          const current = lesson.id === currentLessonId
          const num = lesson.order.toString().padStart(2, '0')

          const inner = (
            <>
              <span className="lesson-sidebar__n">{num}</span>
              <span className="lesson-sidebar__title">{lesson.title}</span>
              <span className="lesson-sidebar__mark">
                {complete ? '✓' : locked ? '🔒' : ''}
              </span>
            </>
          )

          if (locked) {
            return (
              <div key={lesson.id} className="lesson-sidebar__item lesson-sidebar__item--locked">
                {inner}
              </div>
            )
          }

          return (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className={`lesson-sidebar__item ${current ? 'lesson-sidebar__item--current' : ''}`}
              aria-current={current ? 'page' : undefined}
            >
              {inner}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
