import { useState, type ReactNode } from 'react'

type ExplorerVar = {
  key: string
  label: string
  min: number
  max: number
  step: number
  unit: string
  default: number
}

type Props = {
  vars: ExplorerVar[]
  compute: (v: Record<string, number>) => number
  maxResult: number
  unit: string
  accent?: string
  formula: (v: Record<string, number>, result: number) => ReactNode
  stage: (v: Record<string, number>, result: number) => ReactNode
  goal?: { target: number; tol: number; label: string; hitLabel: string }
}

export function Explorer({
  vars,
  compute,
  maxResult,
  unit,
  accent = '#14a89b',
  formula,
  stage,
  goal,
}: Props) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(vars.map((v) => [v.key, v.default])),
  )

  const result = compute(vals)
  const fill = Math.min(1, result / maxResult)
  const hit = goal ? Math.abs(result - goal.target) <= goal.tol : false
  const shown = result < 10 ? result.toFixed(1) : result.toFixed(0)

  return (
    <div className="ke-explorer">
      <div className="ke-explorer__stage">
        {stage(vals, result)}

        <div className="ke-explorer__meter">
          <div className="ke-explorer__bar">
            <div
              className="ke-explorer__bar-fill"
              style={{ height: `${fill * 100}%`, background: accent }}
            />
            {goal && (
              <div
                className="ke-explorer__target"
                style={{ bottom: `${(goal.target / maxResult) * 100}%` }}
              >
                <span>goal</span>
              </div>
            )}
          </div>
          <div className="ke-explorer__ke">
            <strong style={{ color: accent }}>{shown}</strong> {unit}
          </div>
        </div>
      </div>

      <div className="ke-explorer__formula">{formula(vals, result)}</div>

      <div className="ke-explorer__controls">
        {vars.map((v) => (
          <label key={v.key} className="ke-explorer__row">
            <span>{v.label}</span>
            <input
              type="range"
              min={v.min}
              max={v.max}
              step={v.step}
              value={vals[v.key]}
              style={{ accentColor: accent }}
              onChange={(e) =>
                setVals((s) => ({ ...s, [v.key]: Number(e.target.value) }))
              }
            />
            <span className="ke-explorer__val">
              {vals[v.key]}
              {v.unit ? ` ${v.unit}` : ''}
            </span>
          </label>
        ))}
      </div>

      {goal && (
        <p className={`ke-explorer__goal ${hit ? 'ke-explorer__goal--hit' : ''}`}>
          {hit ? goal.hitLabel : goal.label}
        </p>
      )}
    </div>
  )
}
