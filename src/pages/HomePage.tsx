import { type CSSProperties, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignInPanel } from '../components/SignInPanel'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import {
  fetchAllLessonProgress,
  type StoredLessonProgress,
} from '../lib/progressFirestore'
import { displayFirstName } from '../lib/displayName'

const LESSON_COLORS = ['#3a86ff', '#00b894', '#fd9f28', '#8338ec', '#e74c3c', '#f9c74f']

export function HomePage() {
  const { user, isSignedIn, loading, signOut, authReady } = useAuth()
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
          status:
            local.stepIndex >= lesson.steps.length
              ? 'completed'
              : local.stepIndex > 0
                ? 'in_progress'
                : 'not_started',
          updatedAt: local.updatedAt,
        }
      }
    }
    setProgressMap(guest)
  }, [isSignedIn, user])

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-hero__brand">
            <span className="home-hero__logo">⚡</span>
            <h1>Phynesse</h1>
          </div>
          <p className="home-hero__sub">AP Physics 1 · Unit 4</p>
          <p className="home-hero__tagline">Master energy mechanics by doing, not watching.</p>

          {loading && authReady && (
            <p style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem' }}>Checking sign-in…</p>
          )}

          {isSignedIn && user && (
            <div className="home-hero__welcome">
              <span>Welcome back, {displayFirstName(user)}</span>
              <button type="button" className="btn btn--ghost-white btn--sm" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          )}

          {!isSignedIn && !loading && authReady && (
            <p className="home-hero__guest">
              Start for free — sign in to save progress across devices.
            </p>
          )}
        </div>
      </section>

      <main className="home-main">
        {!isSignedIn && !loading && authReady && (
          <div className="home-signin">
            <SignInPanel compact />
          </div>
        )}

        <section className="course-section">
          <h2>Course path</h2>
          <div className="lesson-grid">
            {lessons.map((lesson) => {
              const locked = !isLessonUnlocked(lesson, progressMap)
              const prog = progressMap[lesson.id]
              const complete = prog?.status === 'completed'
              const inProgress = prog?.status === 'in_progress'
              const statusClass = complete ? 'completed' : inProgress ? 'in_progress' : 'not_started'
              const accent = LESSON_COLORS[(lesson.order - 1) % LESSON_COLORS.length]
              const cardStyle = { '--accent': accent } as CSSProperties

              if (locked) {
                return (
                  <div key={lesson.id} className="lesson-card lesson-card--locked" style={cardStyle}>
                    <div className="lesson-card__num-badge">{lesson.order}</div>
                    <div className="lesson-card__body">
                      <div className="lesson-card__eyebrow">Lesson {lesson.order}</div>
                      <div className="lesson-card__title">{lesson.title}</div>
                    </div>
                    <div className="lesson-card__arrow">🔒</div>
                  </div>
                )
              }

              return (
                <Link
                  key={lesson.id}
                  to={`/lesson/${lesson.id}`}
                  className={`lesson-card lesson-card--${statusClass}`}
                  style={cardStyle}
                >
                  <div className="lesson-card__num-badge">
                    {complete ? '✓' : lesson.order}
                  </div>
                  <div className="lesson-card__body">
                    <div className="lesson-card__eyebrow">Lesson {lesson.order}</div>
                    <div className="lesson-card__title">{lesson.title}</div>
                    {complete && (
                      <span className="lesson-card__tag lesson-card__tag--done">Complete</span>
                    )}
                    {inProgress && (
                      <span className="lesson-card__tag lesson-card__tag--progress">In progress</span>
                    )}
                  </div>
                  <div className="lesson-card__arrow">→</div>
                </Link>
              )
            })}

            <div className="lesson-card lesson-card--locked">
              <div className="lesson-card__num-badge">7</div>
              <div className="lesson-card__body">
                <div className="lesson-card__eyebrow">Lessons 7 – 8</div>
                <div className="lesson-card__title">Mixed problems & unit capstone</div>
              </div>
              <div className="lesson-card__arrow" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                Coming soon
              </div>
            </div>
          </div>
        </section>

        {!authReady && (
          <p className="status-line status-line--warn">
            Firebase not configured — add keys to .env.local, then redeploy.
          </p>
        )}
      </main>
    </div>
  )
}
