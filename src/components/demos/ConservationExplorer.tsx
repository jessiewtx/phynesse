import { useState } from 'react'

const TOTAL = 100

export function ConservationExplorer() {
  const [drop, setDrop] = useState(0)
  const frac = drop / 100
  const ke = TOTAL * frac
  const u = TOTAL - ke
  const balanced = Math.abs(ke - u) <= 4

  return (
    <div className="ke-explorer">
      <div className="cons-expl__stage">
        <div className="cons-expl__ramp">
          <div className="cons-expl__slope" />
          <div
            className="cons-expl__ball"
            style={{ left: `${frac * 82}%`, bottom: `${(1 - frac) * 70 + 6}%` }}
          />
        </div>

        <div className="cons-expl__bars">
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--u" style={{ height: `${u}%` }} />
            <span className="cons-expl__bar-cap">U {u.toFixed(0)}</span>
          </div>
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--ke" style={{ height: `${ke}%` }} />
            <span className="cons-expl__bar-cap">KE {ke.toFixed(0)}</span>
          </div>
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--total" style={{ height: '100%' }} />
            <span className="cons-expl__bar-cap">total {TOTAL}</span>
          </div>
        </div>
      </div>

      <div className="ke-explorer__formula">
        KE + U = {ke.toFixed(0)} + {u.toFixed(0)} = <strong>{TOTAL} J</strong> (always)
      </div>

      <div className="ke-explorer__controls">
        <label className="ke-explorer__row">
          <span>Drop</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={drop}
            style={{ accentColor: '#34d399' }}
            onChange={(e) => setDrop(Number(e.target.value))}
          />
          <span className="ke-explorer__val">{drop}%</span>
        </label>
      </div>

      <p className={`ke-explorer__goal ${balanced ? 'ke-explorer__goal--hit' : ''}`}>
        {balanced
          ? '✓ Halfway down — KE and U are equal. The total never budged.'
          : 'Slide the ball down. Watch U turn into KE — but the total stays fixed. Can you find where KE = U?'}
      </p>
    </div>
  )
}
