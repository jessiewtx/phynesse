import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked, statusForStepIndex } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import {
  fetchAllLessonProgress,
  fetchAttempts,
  type StepAttemptRecord,
  type StoredLessonProgress,
} from '../lib/progressFirestore'
import { getStreak, emptyStats, type StreakStats } from '../lib/streak'
import { displayFirstName } from '../lib/displayName'

type Accuracy = { correct: number; total: number }

export function ProgressPage() {
  const { user, isSignedIn, signOut } = useAuth()
  const lessons = getAllLessons()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})
  const [streak, setStreak] = useState<StreakStats>(() => emptyStats())
  const [attempts, setAttempts] = useState<StepAttemptRecord[]>([])

  useEffect(() => {
    const uid = isSignedIn && user ? user.uid : null
    getStreak(uid).then(setStreak)

    if (uid) {
      fetchAllLessonProgress(uid).then(setProgressMap)
      fetchAttempts(uid).then(setAttempts)
      return
    }

    const guest: Record<string, StoredLessonProgress> = {}
    for (const lesson of lessons) {
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
    setAttempts([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user])

  const accuracyByLesson = useMemo(() => {
    const map: Record<string, Accuracy> = {}
    for (const a of attempts) {
      const acc = (map[a.lessonId] ??= { correct: 0, total: 0 })
      acc.total += 1
      if (a.correct) acc.correct += 1
    }
    return map
  }, [attempts])

  const overall = useMemo(() => {
    const total = attempts.length
    const correct = attempts.filter((a) => a.correct).length
    return { correct, total }
  }, [attempts])

  const masteredCount = lessons.filter((l) => progressMap[l.id]?.status === 'completed').length
  const masteredPct = Math.round((masteredCount / lessons.length) * 100)

  const nextLesson = lessons.find(
    (l) => isLessonUnlocked(l, progressMap) && progressMap[l.id]?.status !== 'completed',
  )

  const pctText = (a?: Accuracy) =>
    a && a.total > 0 ? `${Math.round((a.correct / a.total) * 100)}%` : '—'

  return (
    <div className="home">
      <nav className="home-nav">
        <span className="home-nav__brand">Phynesse</span>
        <div className="home-nav__right">
          <Link to="/" className="btn btn--ghost btn--sm">Course</Link>
          {isSignedIn && user && (
            <>
              <span>{displayFirstName(user)}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="home-display" style={{ paddingBottom: '1.5rem' }}>
        <p className="home-display__eyebrow">Your progress</p>
        <h1 className="home-display__title">Mastery</h1>
      </section>

      {/* Mastery summary */}
      <section className="progress-summary">
        <div className="progress-ring-card">
          <div className="progress-ring" style={{ '--pct': masteredPct } as CSSProperties}>
            <span className="progress-ring__num">{masteredCount}/{lessons.length}</span>
          </div>
          <span className="progress-ring__label">lessons mastered</span>
        </div>

        <div className="progress-stats">
          <div className="progress-stat">
            <span className="progress-stat__value">🔥 {streak.currentStreak}</span>
            <span className="progress-stat__label">day streak</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat__value">🏅 {streak.longestStreak}</span>
            <span className="progress-stat__label">best streak</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat__value">{streak.activeDays}</span>
            <span className="progress-stat__label">days active</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat__value">
              {overall.total > 0 ? `${Math.round((overall.correct / overall.total) * 100)}%` : '—'}
            </span>
            <span className="progress-stat__label">answer accuracy</span>
          </div>
        </div>
      </section>

      {/* What to do next */}
      <section className="progress-next">
        {nextLesson ? (
          <>
            <div className="progress-next__text">
              <span className="progress-next__eyebrow">Recommended next</span>
              <span className="progress-next__title">{nextLesson.title}</span>
            </div>
            <Link to={`/lesson/${nextLesson.id}`} className="btn btn--primary">
              {progressMap[nextLesson.id]?.status === 'in_progress' ? 'Resume' : 'Start'} →
            </Link>
          </>
        ) : (
          <div className="progress-next__text">
            <span className="progress-next__eyebrow">🎓 Unit complete</span>
            <span className="progress-next__title">You've mastered every lesson. Review any one to keep it sharp.</span>
          </div>
        )}
      </section>

      {!isSignedIn && (
        <p className="status-line" style={{ marginTop: '0.5rem' }}>
          Sign in on the course page to track answer accuracy and sync across devices.
        </p>
      )}

      {/* Per-lesson breakdown */}
      <section className="home-lessons">
        <h2 className="home-lessons__label">By lesson</h2>
        {lessons.map((lesson) => {
          const prog = progressMap[lesson.id]
          const status = prog?.status ?? 'not_started'
          const locked = !isLessonUnlocked(lesson, progressMap)
          const acc = accuracyByLesson[lesson.id]
          const num = lesson.order.toString().padStart(2, '0')

          const statusLabel = locked
            ? 'Locked'
            : status === 'completed'
              ? 'Mastered'
              : status === 'in_progress'
                ? 'In progress'
                : 'Not started'

          const body = (
            <>
              <span className="lesson-row__n">{num}</span>
              <div className="lesson-row__body">
                <span className="lesson-row__title">{lesson.title}</span>
                <span className={`progress-pill progress-pill--${status}${locked ? ' progress-pill--locked' : ''}`}>
                  {statusLabel}
                </span>
              </div>
              <span className="progress-row__acc">{locked ? '🔒' : pctText(acc)}</span>
            </>
          )

          return locked ? (
            <div key={lesson.id} className="lesson-row lesson-row--locked">{body}</div>
          ) : (
            <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="lesson-row">{body}</Link>
          )
        })}
      </section>
    </div>
  )
}
