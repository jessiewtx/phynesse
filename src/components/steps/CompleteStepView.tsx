import { Link } from 'react-router-dom'
import { getLesson } from '../../lib/lessons'
import type { CompleteStep } from '../../types/lesson'
import { StreakCelebration } from '../StreakCelebration'
import type { Milestone, StreakStats } from '../../lib/streak'

type Props = {
  step: CompleteStep
  onFinish: () => void
  celebration?: { stats: StreakStats; milestones: Milestone[] } | null
}

export function CompleteStepView({ step, onFinish, celebration }: Props) {
  const nextLesson = getLesson(step.nextLessonId)

  return (
    <div className="step step--complete">
      <h2 className="step__title">{step.title}</h2>
      <p className="step__body">{step.body}</p>
      {celebration && (
        <StreakCelebration stats={celebration.stats} milestones={celebration.milestones} />
      )}
      <p className="step__next">
        Up next:{' '}
        {nextLesson ? (
          <Link to={`/lesson/${step.nextLessonId}`} replace>
            <strong>{step.nextLessonTitle}</strong>
          </Link>
        ) : (
          <>
            <strong>{step.nextLessonTitle}</strong> (coming soon)
          </>
        )}
      </p>
      <div className="step__actions">
        {nextLesson ? (
          <Link to={`/lesson/${step.nextLessonId}`} className="btn btn--primary" replace>
            Start {step.nextLessonTitle}
          </Link>
        ) : (
          <button type="button" className="btn btn--primary" onClick={onFinish}>
            Back to course
          </button>
        )}
        <Link to="/" className="btn btn--ghost">
          Home
        </Link>
      </div>
    </div>
  )
}
