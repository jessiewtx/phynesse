import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAllLessons, getLesson } from '../../lib/lessons'
import { useLearnerData } from '../../lib/useLearnerData'
import { buildMastery, levelMeta } from '../../lib/mastery'
import { LESSON_CONCEPT } from '../../lib/practiceConcepts'
import { CONCEPTS } from '../../lib/physics'
import { IconParty, IconFlame } from '../Illustrations'
import type { CompleteStep } from '../../types/lesson'

type Props = {
  step: CompleteStep
  lessonId?: string
  onFinish: () => void
  onRestart: () => void
}

export function CompleteStepView({ step, lessonId, onFinish, onRestart }: Props) {
  const lessons = getAllLessons()
  const { progressMap, attempts, streak } = useLearnerData()
  const nextLesson = getLesson(step.nextLessonId)

  const m = useMemo(() => buildMastery(lessons, progressMap, attempts), [lessons, progressMap, attempts])
  const lm = lessonId ? m.byId[lessonId] : null
  const meta = lm ? levelMeta(lm.level) : null

  // A review that's now due (other than the lesson just finished) is worth surfacing.
  const dueReview = m.reviewQueue.find((r) => r.lessonId !== lessonId)

  const practiceConcept = lessonId ? LESSON_CONCEPT[lessonId] : undefined

  return (
    <div className="step step--complete complete-card">
      <div className="complete-card__burst" aria-hidden="true"><IconParty size={56} /></div>
      <h2 className="complete-card__title">{step.title}</h2>
      <p className="complete-card__body">{step.body}</p>

      {/* What you just earned */}
      <div className="complete-card__earned">
        {lm && meta && (
          <div className="complete-card__stat">
            <span className="complete-card__stat-value" style={{ color: meta.color }}>{lm.score}%</span>
            <span className="complete-card__stat-label">{meta.label}</span>
          </div>
        )}
        <div className="complete-card__stat">
          <span className="complete-card__stat-value complete-card__stat-value--icon">
            <IconFlame size={22} /> {streak.currentStreak}
          </span>
          <span className="complete-card__stat-label">day streak</span>
        </div>
        <div className="complete-card__stat">
          <span className="complete-card__stat-value">{m.completedCount}/{m.totalLessons}</span>
          <span className="complete-card__stat-label">lessons done</span>
        </div>
        <div className="complete-card__stat">
          <span className="complete-card__stat-value">{m.overall}%</span>
          <span className="complete-card__stat-label">course mastery</span>
        </div>
      </div>

      {/* Path-aware next step */}
      <div className="complete-card__next">
        <span className="complete-card__next-eyebrow">Up next on your path</span>
        <span className="complete-card__next-title">
          {nextLesson ? step.nextLessonTitle : `${step.nextLessonTitle} (coming soon)`}
        </span>
      </div>

      <div className="complete-card__actions">
        {nextLesson ? (
          <Link to={`/lesson/${step.nextLessonId}`} className="btn btn--primary btn--lg" replace>
            Continue to {step.nextLessonTitle} →
          </Link>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" onClick={onFinish}>
            Back to course
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          ↺ Start over
        </button>
      </div>

      {practiceConcept && (
        <Link to={`/practice/${practiceConcept}`} className="complete-card__practice">
          ∞ Keep practicing <strong>{CONCEPTS[practiceConcept].name}</strong> — fresh problems, never the same twice.
        </Link>
      )}

      {dueReview && (
        <Link to={`/lesson/${dueReview.lessonId}`} className="complete-card__review" replace>
          ↻ Or refresh <strong>{dueReview.title}</strong> — it's starting to fade.
        </Link>
      )}
    </div>
  )
}
