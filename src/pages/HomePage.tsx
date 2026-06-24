import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HomeTeaser } from '../components/HomeTeaser'
import { LessonPath } from '../components/LessonPath'
import { IconTarget, IconBars, IconScale, IconPencil } from '../components/Illustrations'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, isLessonUnlocked, statusForStepIndex } from '../lib/lessons'
import { loadProgress } from '../lib/progress'
import {
  fetchAllLessonProgress,
  type StoredLessonProgress,
} from '../lib/progressFirestore'
import { getStreak, emptyStats, type StreakStats } from '../lib/streak'
import { StreakBanner } from '../components/StreakBanner'

export function HomePage() {
  const { user, isSignedIn, authReady } = useAuth()
  const lessons = getAllLessons()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})
  const [streak, setStreak] = useState<StreakStats>(() => emptyStats())

  useEffect(() => {
    getStreak(isSignedIn && user ? user.uid : null).then(setStreak)
  }, [isSignedIn, user])

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

  const masteredCount = lessons.filter((l) => progressMap[l.id]?.status === 'completed').length
  const started = Object.keys(progressMap).length > 0
  const nextLesson = lessons.find(
    (l) => isLessonUnlocked(l, progressMap) && progressMap[l.id]?.status !== 'completed',
  )
  const ctaLesson = nextLesson ?? lessons[0]
  const ctaLabel = !started
    ? 'Start the course'
    : nextLesson
      ? progressMap[nextLesson.id]?.status === 'in_progress'
        ? `Resume: ${nextLesson.title}`
        : `Continue: ${nextLesson.title}`
      : 'Review the course'

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__text">
          <p className="home-display__eyebrow">AP Physics 1 · Unit 4</p>
          <h1 className="home-display__title">Work, Power &amp; Energy</h1>
          <p className="home-display__tagline">
            Drag bars. Watch energy move. Actually understand it — six hands-on
            lessons that take you from a single push to full conservation of energy.
          </p>

          <div className="home-hero__cta">
            <Link to={`/lesson/${ctaLesson.id}`} className="btn btn--primary btn--lg">
              {ctaLabel} →
            </Link>
            <Link to="/progress" className="btn btn--ghost btn--lg">
              View progress
            </Link>
          </div>

          <div className="home-hero__stats">
            <span><strong>{masteredCount}/{lessons.length}</strong> lessons mastered</span>
            <span aria-hidden="true">·</span>
            <span>🔥 <strong>{streak.currentStreak}</strong> day streak</span>
          </div>
        </div>

        <div className="home-hero__visual">
          <HomeTeaser />
          <p className="home-hero__visual-cap">Drag the bars — energy is interactive here.</p>
        </div>
      </section>

      {/* ── Habit loop ── */}
      <section className="home-streak">
        <StreakBanner stats={streak} totalLessons={lessons.length} />
      </section>

      {/* ── Lesson path ── */}
      <section className="home-section home-section--path">
        <h2 className="home-section__label">Your path</h2>
        <LessonPath lessons={lessons} progressMap={progressMap} />
      </section>

      {/* ── Outcomes ── */}
      <section className="home-section">
        <h2 className="home-section__label">What you'll be able to do</h2>
        <div className="home-outcomes">
          <div className="home-outcome">
            <span className="home-outcome__icon"><IconTarget size={40} /></span>
            <span><strong>Predict before you calculate.</strong> Reason about where energy goes, then check the math.</span>
          </div>
          <div className="home-outcome">
            <span className="home-outcome__icon"><IconBars size={40} /></span>
            <span><strong>Read live energy bar charts.</strong> See work, KE, and PE trade off in real time.</span>
          </div>
          <div className="home-outcome">
            <span className="home-outcome__icon"><IconScale size={40} /></span>
            <span><strong>Apply the work-energy theorem.</strong> Connect forces, motion, and energy.</span>
          </div>
          <div className="home-outcome">
            <span className="home-outcome__icon"><IconPencil size={40} /></span>
            <span><strong>Solve AP-style problems.</strong> Build the formulas step by step, with instant feedback.</span>
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
