import type { CSSProperties } from 'react'
import { PhysicsText } from '../lib/physicsText'

type Props = {
  label: string
  value: number
  unit: string
  color: string
  note?: string
}

export function EnergyReadout({ label, value, unit, color, note }: Props) {
  return (
    <div className="energy-readout" style={{ '--readout-color': color } as CSSProperties}>
      <span className="energy-readout__chip">
        <PhysicsText text={label} />
      </span>
      <div className="energy-readout__amount-row">
        <span className="energy-readout__amount">
          {value}
          <span className="energy-readout__unit">{unit}</span>
        </span>
        {note && <span className="energy-readout__note">{note}</span>}
      </div>
    </div>
  )
}
