import { Explorer } from './Explorer'

function springPath(len: number, coils = 7) {
  const x0 = 8
  const y = 30
  const seg = len / (coils * 2)
  let d = `M ${x0} ${y}`
  for (let i = 0; i < coils * 2; i++) {
    const dx = x0 + seg * (i + 1)
    const dy = y + (i % 2 === 0 ? -12 : 12)
    d += ` L ${dx} ${dy}`
  }
  d += ` L ${x0 + len} ${y}`
  return d
}

export function ElasticPEExplorer() {
  return (
    <Explorer
      accent="#ec4899"
      unit="J"
      maxResult={0.5 * 400 * 1 * 1}
      vars={[
        { key: 'k', label: 'Stiffness', min: 50, max: 400, step: 50, unit: 'N/m', default: 200 },
        { key: 'x', label: 'Squeeze', min: 0, max: 1, step: 0.1, unit: 'm', default: 0.4 },
      ]}
      compute={(v) => 0.5 * v.k * v.x * v.x}
      goal={{
        target: 40,
        tol: 5,
        label: 'Goal: tune the spring until U_s ≈ 40 J.',
        hitLabel: '✓ Nice! See how squeeze (x) is squared — it dominates the energy.',
      }}
      formula={(v, r) => (
        <>
          U<sub>s</sub> = ½·k·<span className="ke-explorer__sq">x²</span> = ½ × {v.k} ×{' '}
          {(v.x * v.x).toFixed(2)} = <strong>{r.toFixed(0)} J</strong>
        </>
      )}
      stage={(v) => {
        const len = 150 * (1 - v.x * 0.7)
        return (
          <div className="expl-hstage">
            <svg viewBox="0 0 220 60" className="expl-hstage__svg" aria-hidden="true">
              <rect x="0" y="6" width="8" height="48" fill="#5c5c58" />
              <path d={springPath(len)} fill="none" stroke="#ec4899" strokeWidth="2.5" />
              <rect x={8 + len} y="14" width="26" height="32" rx="3" fill="#3d4450" />
            </svg>
          </div>
        )
      }}
    />
  )
}
