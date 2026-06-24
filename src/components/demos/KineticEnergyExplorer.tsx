import { useState } from 'react'

const TARGET = 50
// 50 J is hit exactly by m=4,v=5 or m=1,v=10, so require an exact match —
// otherwise near-misses like m=2,v=7 (49 J) read as "you hit 50 J".
const TARGET_TOL = 0

export function KineticEnergyExplorer() {
  const [m, setM] = useState(2)
  const [v, setV] = useState(3)

  const ke = 0.5 * m * v * v
  const maxKE = 0.5 * 5 * 10 * 10
  const fill = Math.min(1, ke / maxKE)
  const ballR = 12 + m * 4
  const hit = Math.abs(ke - TARGET) <= TARGET_TOL
  const duration = v === 0 ? 0 : Math.max(0.45, 7 / v)

  return (
    <div className="ke-explorer">
      <div className="ke-explorer__stage">
        <div className="ke-explorer__track">
          <div
            className="ke-explorer__ball"
            style={{
              width: ballR * 2,
              height: ballR * 2,
              animationDuration: duration ? `${duration}s` : undefined,
              animationPlayState: v === 0 ? 'paused' : 'running',
            }}
          >
            {m}kg
          </div>
        </div>

        <div className="ke-explorer__meter">
          <div className="ke-explorer__bar">
            <div
              className="ke-explorer__bar-fill"
              style={{ height: `${fill * 100}%` }}
            />
            <div
              className="ke-explorer__target"
              style={{ bottom: `${(TARGET / maxKE) * 100}%` }}
            >
              <span>goal</span>
            </div>
          </div>
          <div className="ke-explorer__ke">
            <strong>{ke.toFixed(0)}</strong> J
          </div>
        </div>
      </div>

      <div className="ke-explorer__formula">
        KE = ½ × {m} × <span className="ke-explorer__sq">{v}²</span> = ½ × {m} ×{' '}
        {v * v} = <strong>{ke.toFixed(0)} J</strong>
      </div>

      <div className="ke-explorer__controls">
        <label className="ke-explorer__row">
          <span>Mass</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
          />
          <span className="ke-explorer__val">{m} kg</span>
        </label>
        <label className="ke-explorer__row">
          <span>Speed</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
          />
          <span className="ke-explorer__val">{v} m/s</span>
        </label>
      </div>

      <p className={`ke-explorer__goal ${hit ? 'ke-explorer__goal--hit' : ''}`}>
        {hit
          ? '✓ Nice — exactly 50 J! Try the other combo that lands here too (4 kg @ 5 m/s vs 1 kg @ 10 m/s).'
          : 'Goal: tune the sliders until KE = 50 J exactly.'}
      </p>
    </div>
  )
}
