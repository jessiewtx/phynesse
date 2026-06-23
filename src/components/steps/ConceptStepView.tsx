import { useState } from 'react'
import { PushWorkDemo } from '../demos/PushWorkDemo'
import { WorkEnergyIntroDiagram } from '../diagrams/WorkEnergyIntroDiagram'
import { PhysicsEquation, PhysicsText } from '../../lib/physicsText'
import type { ConceptStep } from '../../types/lesson'

type Props = {
  step: ConceptStep
  onContinue: () => void
}

export function ConceptStepView({ step, onContinue }: Props) {
  const needsDemo = step.demo === 'push_work'
  const [demoDone, setDemoDone] = useState(!needsDemo)
  const [pushedValues, setPushedValues] = useState<{ force: number; distance: number } | null>(null)

  return (
    <div className="step step--concept">
      {step.title && <h2 className="step__title">{step.title}</h2>}

      <PhysicsText text={step.body} block className="step__body" />

      {step.equation && <PhysicsEquation text={step.equation} />}

      {needsDemo && (
        <PushWorkDemo
          onTried={() => setDemoDone(true)}
          onPushed={(f, d) => setPushedValues({ force: f, distance: d })}
        />
      )}

      {step.visual === 'work_energy_intro' && <WorkEnergyIntroDiagram values={pushedValues} />}

      <button
        type="button"
        className="btn btn--primary"
        onClick={onContinue}
        disabled={!demoDone}
      >
        {demoDone ? 'Continue' : 'Push the block to continue'}
      </button>
    </div>
  )
}
