import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { getAllLessons } from '../lib/lessons'
import { useLearnerData } from '../lib/useLearnerData'
import {
  buildMastery,
  levelMeta,
  relativeTime,
  strandScore,
  STRANDS,
  type LessonMastery,
  type MasteryLevel,
} from '../lib/mastery'
import { MasteryRing } from '../components/MasteryRing'

function LevelChip({ level }: { level: MasteryLevel }) {
  const meta = levelMeta(level)
  return (
    <span className="level-chip" style={{ '--lc': meta.color } as CSSProperties}>
      {meta.label}
    </span>
  )
}

function MasteryBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="mx-bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="mx-bar__fill" style={{ width: `${Math.max(2, value)}%`, background: color }} />
    </div>
  )
}

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`)

export function ProgressPage() {
  const lessons = getAllLessons()
  const { progressMap, attempts, streak, isSignedIn, ready } = useLearnerData()

  const m = useMemo(() => buildMastery(lessons, progressMap, attempts), [lessons, progressMap, attempts])

  const overallMeta = levelMeta(m.level)

  return (
    <div className="home mx">
      <section className="home-display" style={{ paddingBottom: '0.75rem' }}>
        <p className="home-display__eyebrow">Your progress</p>
        <h1 className="home-display__title">Mastery</h1>
      </section>

      {/* ── Overall mastery hero ── */}
      <section className="mx-hero">
        <div className="mx-hero__ring">
          <MasteryRing value={m.overall} size={150} stroke={14} gradientId="mxOverall">
            <span className="mx-hero__ringnum">{m.overall}</span>
            <span className="mx-hero__ringunit">mastery</span>
          </MasteryRing>
        </div>
        <div className="mx-hero__body">
          <div className="mx-hero__levelline">
            <LevelChip level={m.level} />
            <span className="mx-hero__levelblurb">{overallMeta.blurb}</span>
          </div>
          <div className="mx-hero__levels">
            {(['learning', 'proficient', 'skilled', 'mastered'] as MasteryLevel[]).map((lvl) => {
              const meta = levelMeta(lvl)
              return (
                <div key={lvl} className="mx-hero__levelpip">
                  <span className="mx-hero__pip-dot" style={{ background: meta.color }} />
                  <span className="mx-hero__pip-num">{m.counts[lvl]}</span>
                  <span className="mx-hero__pip-label">{meta.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stat grid ── */}
      <section className="mx-statgrid">
        <Stat value={`${m.completedCount}/${m.totalLessons}`} label="lessons complete" />
        <Stat value={`🔥 ${streak.currentStreak}`} label="day streak" />
        <Stat value={`${m.totalAttempts}`} label="problems solved" />
        <Stat value={pct(m.accuracy)} label="accuracy" />
        <Stat value={pct(m.firstTryRate)} label="first-try rate" />
        <Stat value={`${streak.longestStreak}`} label="best streak" />
      </section>

      {!isSignedIn && (
        <p className="mx-guestnote">
          You're learning as a guest. <strong>Sign in</strong> (left sidebar) to track accuracy, sync across devices,
          and get spaced-review reminders.
        </p>
      )}

      {/* ── Review queue ── */}
      {m.reviewQueue.length > 0 && (
        <section className="mx-section">
          <div className="mx-section__head">
            <h2 className="mx-section__title">Time to review</h2>
            <p className="mx-section__sub">These are fading from memory — a quick pass locks them back in.</p>
          </div>
          <div className="mx-review">
            {m.reviewQueue.map((l) => (
              <Link key={l.lessonId} to={`/lesson/${l.lessonId}`} className="mx-review__card">
                <div className="mx-review__top">
                  <span className="mx-review__title">{l.title}</span>
                  <span className="mx-review__decay">{Math.round(l.retention * 100)}% retained</span>
                </div>
                <MasteryBar value={l.retention * 100} color="var(--gold)" />
                <div className="mx-review__bottom">
                  <span>last seen {relativeTime(l.lastPracticed)}</span>
                  <span className="mx-review__cta">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Concept strands ── */}
      <section className="mx-section">
        <div className="mx-section__head">
          <h2 className="mx-section__title">Concept strands</h2>
          <p className="mx-section__sub">How the unit's big ideas are coming together.</p>
        </div>
        <div className="mx-strands">
          {STRANDS.map((strand) => {
            const s = strandScore(strand, m.byId)
            const meta = levelMeta(s >= 85 ? 'mastered' : s >= 65 ? 'skilled' : s >= 40 ? 'proficient' : s > 0 ? 'learning' : 'not_started')
            return (
              <div key={strand.id} className="mx-strand">
                <div className="mx-strand__head">
                  <span className="mx-strand__name">{strand.name}</span>
                  <span className="mx-strand__score" style={{ color: meta.color }}>{s}%</span>
                </div>
                <p className="mx-strand__blurb">{strand.blurb}</p>
                <MasteryBar value={s} color={meta.color} />
                <div className="mx-strand__lessons">
                  {strand.lessonIds.map((id) => {
                    const lm = m.byId[id]
                    if (!lm) return null
                    return (
                      <span
                        key={id}
                        className="mx-strand__dot"
                        title={`${lm.title}: ${lm.score}%`}
                        style={{ background: levelMeta(lm.level).color }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Per-lesson detail ── */}
      <section className="mx-section">
        <div className="mx-section__head">
          <h2 className="mx-section__title">Lesson by lesson</h2>
        </div>
        <div className="mx-lessons">
          {m.lessons.map((l) => (
            <LessonCard key={l.lessonId} l={l} progressStatus={progressMap[l.lessonId]?.status} />
          ))}
        </div>
      </section>

      {!ready && <p className="status-line" style={{ marginTop: '1rem' }}>Loading your progress…</p>}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="mx-stat">
      <span className="mx-stat__value">{value}</span>
      <span className="mx-stat__label">{label}</span>
    </div>
  )
}

function LessonCard({ l, progressStatus }: { l: LessonMastery; progressStatus?: string }) {
  const meta = levelMeta(l.level)
  const body = (
    <>
      <div className="mx-lesson__left">
        <span className="mx-lesson__num" style={{ background: l.locked ? 'var(--border)' : meta.color }}>
          {l.status === 'completed' ? '✓' : l.locked ? '🔒' : l.order}
        </span>
      </div>
      <div className="mx-lesson__main">
        <div className="mx-lesson__titlerow">
          <span className="mx-lesson__title">{l.title}</span>
          <LevelChip level={l.level} />
        </div>
        <MasteryBar value={l.locked ? 0 : l.score} color={meta.color} />
        <div className="mx-lesson__meta">
          {l.locked ? (
            <span>Finish the previous lesson to unlock</span>
          ) : (
            <>
              <span>{l.score}% mastery</span>
              {l.accuracy != null && <span>· {Math.round(l.accuracy * 100)}% accuracy</span>}
              {l.status === 'completed' && <span>· seen {relativeTime(l.lastPracticed)}</span>}
              {l.dueForReview && <span className="mx-lesson__due">· due for review</span>}
            </>
          )}
        </div>
      </div>
      {!l.locked && (
        <span className="mx-lesson__cta">
          {l.status === 'completed' ? 'Review' : l.status === 'in_progress' ? 'Resume' : 'Start'} →
        </span>
      )}
    </>
  )

  if (l.locked) {
    return <div className="mx-lesson mx-lesson--locked">{body}</div>
  }
  return (
    <Link to={`/lesson/${l.lessonId}`} className={`mx-lesson${progressStatus === 'in_progress' ? ' mx-lesson--active' : ''}`}>
      {body}
    </Link>
  )
}
