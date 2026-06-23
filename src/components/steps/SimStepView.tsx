import type { SimStep, PushBlockParams } from '../../types/lesson'
import { PushBlockSim } from '../PushBlockSim'

type Props = {
  step: SimStep
  params: PushBlockParams
  onChange: (params: PushBlockParams) => void
  onContinue: () => void
}

export function SimStepView({ step, params, onChange, onContinue }: Props) {
  return (
    <div className="step step--sim">
      {step.prompt && <p className="step__prompt">{step.prompt}</p>}
      {step.labId === 'push_block' && (
        <PushBlockSim params={params} onChange={onChange} />
      )}
      <button type="button" className="btn btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
