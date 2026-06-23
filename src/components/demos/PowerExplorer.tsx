import { Explorer } from './Explorer'

export function PowerExplorer() {
  return (
    <Explorer
      accent="#06b6d4"
      unit="W"
      maxResult={500 / 1}
      vars={[
        { key: 'W', label: 'Work', min: 20, max: 500, step: 20, unit: 'J', default: 120 },
        { key: 't', label: 'Time', min: 1, max: 10, step: 1, unit: 's', default: 4 },
      ]}
      compute={(v) => v.W / v.t}
      goal={{
        target: 60,
        tol: 5,
        label: 'Goal: tune work and time until P ≈ 60 W.',
        hitLabel: '✓ Got it! Same work in less time = more power. Time is on the bottom.',
      }}
      formula={(v, r) => (
        <>
          P = W / Δt = {v.W} / {v.t} = <strong>{r.toFixed(0)} W</strong>
        </>
      )}
      stage={(v) => {
        const frac = (v.t - 1) / 9
        const angle = -90 + frac * 330
        const rad = (angle * Math.PI) / 180
        const hx = 30 + Math.cos(rad) * 18
        const hy = 30 + Math.sin(rad) * 18
        return (
          <div className="expl-hstage">
            <svg viewBox="0 0 220 60" className="expl-hstage__svg" aria-hidden="true">
              <rect x="8" y="14" width="64" height="32" rx="5" fill="#06b6d4" />
              <text x="40" y="35" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="system-ui">
                {v.W} J
              </text>
              <text x="92" y="35" fill="#5c5c58" fontSize="12" fontFamily="system-ui">in</text>
              <circle cx="150" cy="30" r="22" fill="#fff" stroke="#9a9a96" strokeWidth="2" />
              <line x1="150" y1="30" x2={120 + hx} y2={hy} stroke="#5c5c58" strokeWidth="2.5" />
              <text x="188" y="34" fill="#0e7490" fontSize="12" fontWeight="700" fontFamily="system-ui">
                {v.t}s
              </text>
            </svg>
          </div>
        )
      }}
    />
  )
}
