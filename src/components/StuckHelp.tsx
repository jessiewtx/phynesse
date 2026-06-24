import { PhysicsText } from '../lib/physicsText'

/** Number of wrong attempts before we stop hinting and walk the learner through it. */
export const STUCK_THRESHOLD = 3

type Props = {
  answer: string
  /** Full worked solution. */
  solution?: string
}

/**
 * Shown after repeated wrong attempts. Reveals the correct answer plus the full
 * walkthrough so the learner can recover and move on.
 */
export function StuckHelp({ answer, solution }: Props) {
  return (
    <div className="stuck-help">
      <p className="stuck-help__title">Stuck? Here's the full walkthrough.</p>
      <p className="stuck-help__answer">
        Answer: <strong>{answer}</strong>
      </p>
      {solution && (
        <div className="stuck-help__body">
          <PhysicsText text={solution} block />
        </div>
      )}
    </div>
  )
}
