import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HomeTeaser } from '../components/HomeTeaser'
import { LessonPath } from '../components/LessonPath'
import { MasteryRing } from '../components/MasteryRing'
import { IconTarget, IconBars, IconScale, IconPencil } from '../components/Illustrations'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons } from '../lib/lessons'
import { useLearnerData } from '../lib/useLearnerData'
import { buildMastery, levelMeta, relativeTime } from '../lib/mastery'
import { displayFirstName } from '../lib/displayName'

export function HomePage() {
  const { user, isSignedIn, authReady } = useAuth()
  const lessons = getAllLessons()
  const { progressMap, attempts, streak } = useLearnerData()

  const m = useMemo(() => buildMastery(lessons, progressMap, attempts), [lessons, progressMap, attempts])

  const started = m.completedCount > 0 || attempts.length > 0 || Object.keys(progressMap).length > 0
  const rec = m.recommendation
  const ctaLessonId = rec.lesson ? rec.lesson.lessonId : lessons[0].id
  const greeting = isSignedIn && user ? `Welcome back, ${displayFirstName(user)}` : 'Work, Power & Energy'

  const ctaVerb = !rec.lesson
    ? 'Review the course'
    : rec.kind === 'resume'
      ? 'Resume'
      : rec.kind === 'review'
        ? 'Review'
        : started
          ? 'Continue'
          : 'Start the course'

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__text">
          <p className="home-display__eyebrow">AP Physics 1 · Unit 4</p>
          <h1 className="home-display__title">{greeting}</h1>
          <p className="home-display__tagline">
            Drag bars. Watch energy move. Actually understand it — six hands-on lessons that take
            you from a single push to full conservation of energy.
          </p>

          <div className="home-hero__cta">
            <Link to={`/lesson/${ctaLessonId}`} className="btn btn--primary btn--lg">
              {rec.lesson && ctaVerb !== 'Start the course' ? `${ctaVerb}: ${rec.lesson.title}` : ctaVerb} →
            </Link>
            <Link to="/progress" className="btn btn--ghost btn--lg">
              View mastery
            </Link>
          </div>
        </div>

        <div className="home-hero__visual">
          <HomeTeaser />
          <p className="home-hero__visual-cap">Drag the bars — energy is interactive here.</p>
        </div>
      </section>

      {/* ── Dashboard band ── */}
      <section className="home-dash">
        {/* Continue / recommended next — the path knows where you are */}
        <div className="dash-card dash-card--continue">
          {rec.lesson ? (
            <>
              <span className="dash-card__eyebrow">
                {rec.kind === 'resume'
                  ? 'Pick up where you left off'
                  : rec.kind === 'review'
                    ? 'Recommended review'
                    : 'Recommended next'}
              </span>
              <span className="dash-card__title">{rec.lesson.title}</span>
              <p className="dash-card__note">{rec.reason}</p>
              {(rec.kind === 'resume' || rec.kind === 'review') && (
                <div className="dash-card__progress">
                  <div className="dash-card__progress-bar">
                    <div
                      className="dash-card__progress-fill"
                      style={{ width: `${Math.round((rec.kind === 'review' ? rec.lesson.retention : rec.lesson.progressFraction) * 100)}%` }}
                    />
                  </div>
                  <span className="dash-card__progress-num">
                    {Math.round((rec.kind === 'review' ? rec.lesson.retention : rec.lesson.progressFraction) * 100)}%
                  </span>
                </div>
              )}
              <Link to={`/lesson/${rec.lesson.lessonId}`} className="btn btn--primary btn--full">
                {rec.kind === 'resume' ? 'Resume lesson' : rec.kind === 'review' ? 'Review lesson' : 'Start lesson'} →
              </Link>
            </>
          ) : (
            <>
              <span className="dash-card__eyebrow">Course complete</span>
              <span className="dash-card__title">You finished every lesson 🎉</span>
              <p className="dash-card__note">Keep your mastery fresh with a review.</p>
              <Link to="/progress" className="btn btn--primary btn--full">See mastery →</Link>
            </>
          )}
        </div>

        {/* Streak */}
        <div className="dash-card dash-card--streak">
          <span className="dash-card__eyebrow">Daily streak</span>
          <div className="dash-streak">
            <span className="dash-streak__flame">🔥</span>
            <span className="dash-streak__num">{streak.currentStreak}</span>
          </div>
          <span className="dash-card__note">
            {streak.currentStreak === 0
              ? 'Finish a lesson today to start your streak.'
              : `Best: ${streak.longestStreak} days · ${streak.activeDays} days active`}
          </span>
        </div>

        {/* Mastery snapshot */}
        <div className="dash-card dash-card--mastery">
          <span className="dash-card__eyebrow">Course mastery</span>
          <div className="dash-mastery">
            <MasteryRing value={m.overall} size={84} stroke={9} gradientId="dashMastery" />
            <div className="dash-mastery__side">
              <span className="dash-mastery__level" style={{ color: levelMeta(m.level).color }}>
                {levelMeta(m.level).label}
              </span>
              <span className="dash-card__note">{m.completedCount}/{m.totalLessons} lessons · {m.counts.mastered} mastered</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Review strip ── */}
      {m.reviewQueue.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__label">Review to stay sharp</h2>
          <div className="mx-review">
            {m.reviewQueue.slice(0, 3).map((l) => (
              <Link key={l.lessonId} to={`/lesson/${l.lessonId}`} className="mx-review__card">
                <div className="mx-review__top">
                  <span className="mx-review__title">{l.title}</span>
                  <span className="mx-review__decay">{Math.round(l.retention * 100)}% retained</span>
                </div>
                <div className="mx-bar"><div className="mx-bar__fill" style={{ width: `${Math.max(2, l.retention * 100)}%`, background: 'var(--gold)' }} /></div>
                <div className="mx-review__bottom">
                  <span>last seen {relativeTime(l.lastPracticed)}</span>
                  <span className="mx-review__cta">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
