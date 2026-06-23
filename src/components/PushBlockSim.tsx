import type { PushBlockParams } from '../types/lesson'
import { pushBlockEnergy } from '../lib/physics'
import { EnergyBarChart } from './EnergyBarChart'

type PushBlockSimProps = {
  params: PushBlockParams
  onChange: (params: PushBlockParams) => void
}

export function PushBlockSim({ params, onChange }: PushBlockSimProps) {
  const { workNet, deltaKe, thermal } = pushBlockEnergy(params)

  const update = (key: keyof PushBlockParams, value: number) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <div className="push-block-sim">
      <div className="push-block-sim__scene">
        <div className="push-block-sim__surface" />
        <div
          className="push-block-sim__block"
          style={{ left: `${Math.min(85, 10 + params.distance * 8)}%` }}
        />
        <span className="push-block-sim__force">F = {params.force} N →</span>
      </div>

      <EnergyBarChart
        bars={[
          { label: 'W_net', value: workNet, color: '#4f8cff' },
          { label: 'ΔKE', value: deltaKe, color: '#34d399' },
          { label: 'E_th', value: thermal, color: '#f59e0b' },
        ]}
      />

      <div className="sliders">
        <label className="slider">
          <span>Applied force (N)</span>
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={params.force}
            onChange={(e) => update('force', Number(e.target.value))}
          />
          <span>{params.force}</span>
        </label>
        <label className="slider">
          <span>Distance (m)</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={params.distance}
            onChange={(e) => update('distance', Number(e.target.value))}
          />
          <span>{params.distance}</span>
        </label>
        <label className="slider">
          <span>Mass (kg)</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={params.mass}
            onChange={(e) => update('mass', Number(e.target.value))}
          />
          <span>{params.mass}</span>
        </label>
        <label className="slider">
          <span>Friction μ_k</span>
          <input
            type="range"
            min={0}
            max={0.8}
            step={0.05}
            value={params.muK}
            onChange={(e) => update('muK', Number(e.target.value))}
          />
          <span>{params.muK}</span>
        </label>
      </div>
    </div>
  )
}
