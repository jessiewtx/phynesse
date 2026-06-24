import { PhysicsText } from '../lib/physicsText'

/** Number of wrong attempts before we stop hinting and walk the learner through it. */
export const STUCK_THRESHOLD = 3

type Props = {
  answer: string
  /** Full worked solution. */
  solution?: string
  /** Key formulas to re-ground the learner before the walkthrough. */
  formulas?: string[]
}

/**
 * Shown after repeated wrong attempts. Instead of just giving the answer, it
 * surfaces a short concept review and then an easier, step-by-step walkthrough
 * so the learner can recover and move on with understanding.
 */
export function StuckHelp({ answer, solution, formulas }: Props) {
  return (
    <div className="stuck-help">
      <p className="stuck-help__title">Let's slow down and walk through it together.</p>

      {formulas && formulas.length > 0 && (
        <div className="stuck-help__recap">
          <span className="stuck-help__recap-label">Remember</span>
          <div className="stuck-help__recap-formulas">
            {formulas.map((f) => (
              <PhysicsText key={f} text={f} className="stuck-help__formula" />
            ))}
          </div>
        </div>
      )}

      {solution && (
        <div className="stuck-help__body">
          <span className="stuck-help__step-label">Step by step</span>
          <PhysicsText text={solution} block />
        </div>
      )}

      <p className="stuck-help__answer">
        Answer: <strong>{answer}</strong>
      </p>
    </div>
  )
}
