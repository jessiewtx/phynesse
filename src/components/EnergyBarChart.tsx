import { formatJ } from '../lib/physics'

type Bar = {
  label: string
  value: number
  color: string
}

type EnergyBarChartProps = {
  bars: Bar[]
  maxValue?: number
}

export function EnergyBarChart({ bars, maxValue }: EnergyBarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => Math.abs(b.value)), 1)

  return (
    <div className="energy-chart">
      {bars.map((bar) => {
        const heightPct = (Math.abs(bar.value) / max) * 100
        return (
          <div key={bar.label} className="energy-chart__col">
            <div className="energy-chart__bar-wrap">
              <div
                className="energy-chart__bar"
                style={{ height: `${heightPct}%`, background: bar.color }}
                title={formatJ(bar.value)}
              />
            </div>
            <span className="energy-chart__value">{formatJ(bar.value)}</span>
            <span className="energy-chart__label">{bar.label}</span>
          </div>
        )
      })}
    </div>
  )
}
