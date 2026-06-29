import { useState } from 'react'
import type { WorkedExampleStep } from '../../types/lesson'
import { PhysicsText } from '../../lib/physicsText'
import { useEnterAdvance } from '../../lib/useEnterAdvance'
import { ProblemVisualView } from '../diagrams/ProblemVisualView'

type Props = {
  step: WorkedExampleStep
  onContinue: () => void
}

/**
 * First rung of worked-example fading: the learner studies a fully worked
 * solution before solving anything themselves. Lines reveal one at a time so
 * they predict each move instead of skimming a finished answer.
 */
export function WorkedExampleStepView({ step, onContinue }: Props) {
  const [revealed, setRevealed] = useState(0)
  const allShown = revealed >= step.steps.length
  useEnterAdvance(onContinue, allShown)

  return (
    <div className="step step--worked">
      <div className="worked__tag">Worked example · study it first</div>

      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

      {step.visual && <ProblemVisualView visual={step.visual} />}

      {step.formulas && step.formulas.length > 0 && (
        <div className="bar-drag__formulas">
          {step.formulas.map((f) => (
            <span key={f} className="bar-drag__formula">
              <PhysicsText text={f} />
            </span>
          ))}
        </div>
      )}

      {step.givens && step.givens.length > 0 && (
        <div className="bar-drag__givens">
          {step.givens.map(({ label, value }) => (
            <span key={label} className="bar-drag__given">
              <PhysicsText text={label} /> = {value}
            </span>
          ))}
        </div>
      )}

      <ol className="worked__steps">
        {step.steps.slice(0, revealed).map((line, i) => (
          <li key={i} className="worked__step">
            <PhysicsText text={line} />
          </li>
        ))}
      </ol>

      {allShown && (
        <div className="worked__answer">
          <span className="worked__answer-label">Answer</span>
          <PhysicsText text={step.answer} />
        </div>
      )}

      {allShown && step.takeaway && (
        <p className="worked__takeaway">
          <PhysicsText text={step.takeaway} />
        </p>
      )}

      {!allShown ? (
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setRevealed((r) => r + 1)}
        >
          {revealed === 0 ? 'Walk me through it →' : 'Reveal next line →'}
        </button>
      ) : (
        <button type="button" className="btn btn--primary" onClick={onContinue}>
          Now your turn →
        </button>
      )}
    </div>
  )
}
