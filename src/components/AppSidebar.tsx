import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked, statusForStepIndex } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import { fetchAllLessonProgress, type StoredLessonProgress } from '../lib/progressFirestore'
import { getStreak, emptyStats, type StreakStats } from '../lib/streak'
import { displayFirstName } from '../lib/displayName'
import { SignInPanel } from './SignInPanel'

type Props = {
  /** Called when a nav item is chosen — lets the shell close the drawer on mobile. */
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: Props) {
  const { user, isSignedIn, signOut } = useAuth()
  const location = useLocation()
  const lessons = getAllLessons()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})
  const [streak, setStreak] = useState<StreakStats>(() => emptyStats())

  useEffect(() => {
    const uid = isSignedIn && user ? user.uid : null
    getStreak(uid).then(setStreak)

    if (uid) {
      fetchAllLessonProgress(uid).then(setProgressMap)
      return
    }
    const guest: Record<string, StoredLessonProgress> = {}
    for (const lesson of getAllLessons()) {
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
  }, [isSignedIn, user, location.pathname])

  const currentLessonId = location.pathname.startsWith('/lesson/')
    ? location.pathname.split('/lesson/')[1]
    : undefined

  return (
    <div className="app-sidebar__inner">
      {!isSignedIn && (
        <div className="app-sidebar__signin">
          <p className="app-sidebar__signin-title">Save your progress</p>
          <SignInPanel compact />
        </div>
      )}

      <nav className="app-sidebar__nav">
        <Link
          to="/"
          className={`app-sidebar__link ${location.pathname === '/' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">🏠</span>
          Lesson plan overview
        </Link>
        <Link
          to="/progress"
          className={`app-sidebar__link ${location.pathname === '/progress' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">📊</span>
          Progress &amp; mastery
        </Link>
      </nav>

      <p className="app-sidebar__label">Lessons</p>
      <nav className="app-sidebar__list">
        {lessons.map((lesson) => {
          const prog = progressMap[lesson.id]
          const complete = prog?.status === 'completed'
          const locked = !isLessonUnlocked(lesson, progressMap)
          const current = lesson.id === currentLessonId
          const num = lesson.order.toString().padStart(2, '0')

          const inner = (
            <>
              <span className="app-sidebar__n">{num}</span>
              <span className="app-sidebar__lesson-title">{lesson.title}</span>
              <span className="app-sidebar__mark">{complete ? '✓' : locked ? '🔒' : ''}</span>
            </>
          )

          if (locked) {
            return (
              <div key={lesson.id} className="app-sidebar__item app-sidebar__item--locked">
                {inner}
              </div>
            )
          }
          return (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className={`app-sidebar__item ${current ? 'app-sidebar__item--current' : ''}`}
              aria-current={current ? 'page' : undefined}
              onClick={onNavigate}
            >
              {inner}
            </Link>
          )
        })}
      </nav>

      <div className="app-sidebar__footer">
        <span className="app-sidebar__streak">🔥 {streak.currentStreak} day streak</span>
        {isSignedIn && user && (
          <div className="app-sidebar__account">
            <span className="app-sidebar__name">{displayFirstName(user)}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                onNavigate?.()
                void signOut()
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
