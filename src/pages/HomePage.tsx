import { type CSSProperties, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignInPanel } from '../components/SignInPanel'
import { HomeTeaser } from '../components/HomeTeaser'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked, statusForStepIndex } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import {
  fetchAllLessonProgress,
  type StoredLessonProgress,
} from '../lib/progressFirestore'
import { displayFirstName } from '../lib/displayName'

const LESSON_COLORS = ['#0ab5c5', '#e63946', '#e9a800', '#14a89b', '#7c3aed', '#f57c20']

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
          status: statusForStepIndex(lesson, local.stepIndex),
          updatedAt: local.updatedAt,
        }
      }
    }
    setProgressMap(guest)
  }, [isSignedIn, user])

  return (
    <div className="home">
      {/* ── Minimal nav ── */}
      <nav className="home-nav">
        <span className="home-nav__brand">Phynesse</span>
        <div className="home-nav__right">
          {isSignedIn && user ? (
            <>
              <span>{displayFirstName(user)}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          ) : (
            loading && authReady && <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>…</span>
          )}
        </div>
      </nav>

      {/* ── Centered editorial display ── */}
      <section className="home-display">
        <p className="home-display__eyebrow">AP Physics 1 · Unit 4</p>
        <h1 className="home-display__title">Work, Power &amp; Energy</h1>
        <p className="home-display__tagline">
          Drag bars. Watch energy move. Actually understand it.
        </p>
        <HomeTeaser />
      </section>

      {/* ── Sign-in (only when guest) ── */}
      {!isSignedIn && !loading && authReady && (
        <div className="home-signin">
          <SignInPanel compact />
        </div>
      )}

      {/* ── Lesson list ── */}
      <section className="home-lessons">
        <h2 className="home-lessons__label">Lessons</h2>

        {lessons.map((lesson) => {
          const locked = !isLessonUnlocked(lesson, progressMap)
          const prog = progressMap[lesson.id]
          const complete = prog?.status === 'completed'
          const inProgress = prog?.status === 'in_progress'
          const color = LESSON_COLORS[(lesson.order - 1) % LESSON_COLORS.length]
          const style = { '--c': color } as CSSProperties
          const num = lesson.order.toString().padStart(2, '0')

          if (locked) {
            return (
              <div key={lesson.id} className="lesson-row lesson-row--locked" style={style}>
                <span className="lesson-row__n">{num}</span>
                <div className="lesson-row__body">
                  <span className="lesson-row__title">{lesson.title}</span>
                </div>
                <span className="lesson-row__arrow">🔒</span>
              </div>
            )
          }

          return (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className="lesson-row"
              style={style}
            >
              <span className="lesson-row__n">{num}</span>
              <div className="lesson-row__body">
                <span className="lesson-row__title">{lesson.title}</span>
                {complete && <span className="lesson-row__pill lesson-row__pill--done">Done</span>}
                {inProgress && <span className="lesson-row__pill lesson-row__pill--in">In progress</span>}
              </div>
              <span className="lesson-row__arrow">→</span>
            </Link>
          )
        })}

        <div className="lesson-row lesson-row--locked">
          <span className="lesson-row__n">07</span>
          <div className="lesson-row__body">
            <span className="lesson-row__title">Mixed problems & unit capstone</span>
            <span className="lesson-row__pill" style={{ background: '#f5f5f5', color: 'var(--text-3)' }}>
              Coming soon
            </span>
          </div>
        </div>
      </section>

      {!authReady && (
        <p className="status-line status-line--warn">
          Firebase not configured — add keys to .env.local, then redeploy.
        </p>
      )}
    </div>
  )
}
