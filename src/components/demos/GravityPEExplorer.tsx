import { Explorer } from './Explorer'

export function GravityPEExplorer() {
  return (
    <Explorer
      accent="#8b5cf6"
      unit="J"
      maxResult={5 * 9.8 * 5}
      vars={[
        { key: 'm', label: 'Mass', min: 1, max: 5, step: 1, unit: 'kg', default: 2 },
        { key: 'h', label: 'Height', min: 0, max: 5, step: 0.5, unit: 'm', default: 2 },
      ]}
      compute={(v) => v.m * 9.8 * v.h}
      goal={{
        target: 98,
        tol: 0.1,
        label: 'Goal: tune mass and height until PE_g = 98 J (g = 9.8).',
        hitLabel: '✓ Got it! Height and mass both push PE_g up the same way — no squaring here.',
      }}
      formula={(v, r) => (
        <>
          PE<sub>g</sub> = m·g·h = {v.m} × 9.8 × {v.h} = <strong>{r.toFixed(0)} J</strong>
        </>
      )}
      stage={(v) => (
        <div className="expl-vstage">
          <div
            className="expl-vstage__object expl-vstage__object--purple"
            style={{ bottom: `calc(${(v.h / 5) * 100}% )` }}
          >
            {v.m}kg
          </div>
          <div className="expl-vstage__ground" />
        </div>
      )}
    />
  )
}
