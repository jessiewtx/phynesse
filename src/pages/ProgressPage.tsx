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
import { calibrationSummary, CONFIDENCE_META } from '../lib/calibration'
import { learningEffects } from '../lib/effects'

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
  const calib = useMemo(() => calibrationSummary(attempts), [attempts])
  const effects = useMemo(() => learningEffects(attempts), [attempts])

  // Average current recall across completed lessons — the spacing/forgetting-curve
  // model made visible as a single "is it sticking?" number.
  const recalled = m.lessons.filter((l) => l.status === 'completed' && l.retrievals > 0)
  const avgRecall = recalled.length
    ? recalled.reduce((s, l) => s + l.retention, 0) / recalled.length
    : null

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

      {/* ── Learning, measured (effect of the techniques on YOUR data) ── */}
      {(effects.missed > 0 || avgRecall != null) && (
        <section className="mx-section">
          <div className="mx-section__head">
            <h2 className="mx-section__title">Your learning, measured</h2>
            <p className="mx-section__sub">
              Not the techniques in the abstract — proof they're working, pulled from your own attempts.
            </p>
          </div>
          <div className="mx-effects">
            {effects.missed > 0 && (
              <div className="mx-effect">
                <span className="mx-effect__value">
                  {effects.recovered}
                  <span className="mx-effect__of">/{effects.missed}</span>
                </span>
                <span className="mx-effect__label">mistakes turned into solves</span>
                <span className="mx-effect__note">
                  {effects.recoveryRate != null && (
                    <>You've recovered {Math.round(effects.recoveryRate * 100)}% of the problems you first missed. </>
                  )}
                  {effects.spacedRecovered > 0
                    ? `${effects.spacedRecovered} of them you nailed in a later session — that's spaced retrieval working.`
                    : 'Retrieval practice: getting it wrong, then earning it back.'}
                </span>
              </div>
            )}
            {avgRecall != null && (
              <div className="mx-effect">
                <span className="mx-effect__value">{Math.round(avgRecall * 100)}%</span>
                <span className="mx-effect__label">recall retained</span>
                <span className="mx-effect__note">
                  Estimated recall right now across your {recalled.length} completed lesson
                  {recalled.length === 1 ? '' : 's'}, from the forgetting-curve model. Reviews push it back up.
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Confidence calibration ── */}
      {calib.total >= 3 && (
        <section className="mx-section">
          <div className="mx-section__head">
            <h2 className="mx-section__title">Confidence calibration</h2>
            <p className="mx-section__sub">
              How well your gut matches reality. Good learners are right when they feel sure — and know when they're guessing.
            </p>
          </div>
          <div className={`calib-card${calib.overconfident ? ' calib-card--warn' : ''}`}>
            <div className="calib-bars">
              {calib.buckets.map((b) => {
                const meta = CONFIDENCE_META[b.confidence]
                return (
                  <div key={b.confidence} className="calib-bar">
                    <div className="calib-bar__head">
                      <span className="calib-bar__name">
                        {meta.emoji} {meta.short}
                      </span>
                      <span className="calib-bar__pct" style={{ color: meta.color }}>
                        {b.attempts > 0 ? `${Math.round(b.accuracy * 100)}%` : '—'}
                      </span>
                    </div>
                    <MasteryBar value={b.attempts > 0 ? b.accuracy * 100 : 0} color={meta.color} />
                    <span className="calib-bar__count">
                      {b.attempts > 0 ? `${b.correct}/${b.attempts} correct` : 'no answers yet'}
                    </span>
                  </div>
                )
              })}
            </div>
            {calib.insight && <p className="calib-card__insight">{calib.insight}</p>}
          </div>
        </section>
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
              {l.status === 'completed' && l.retrievals > 0 && (
                <span title="Estimated recall right now, from the forgetting-curve model">
                  · {Math.round(l.retention * 100)}% recall
                </span>
              )}
              {l.status === 'completed' && <span>· seen {relativeTime(l.lastPracticed)}</span>}
              {l.dueForReview && <span className="mx-lesson__due">· due for review</span>}
            </>
          )}
        </div>
        {!l.locked && l.status !== 'completed' && !l.ready && l.prereqTitle && (l.prereqScore ?? 0) > 0 && (
          <p className="mx-lesson__gate">
            🔑 Master <strong>{l.prereqTitle}</strong> first — it's at {l.prereqScore}% (aim for 70%). You can still dive in.
          </p>
        )}
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
