import { type ReactNode } from 'react'

type Props = {
  /** 0–100. */
  value: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  /** Center content. If omitted, shows the rounded value with a % sign. */
  children?: ReactNode
  gradientId?: string
}

/** A crisp SVG progress ring with a soft track and rounded cap. */
export function MasteryRing({
  value,
  size = 132,
  stroke = 12,
  color = 'var(--accent)',
  trackColor = 'var(--border)',
  children,
  gradientId,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped / 100)

  return (
    <div className="mastery-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mastery-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={gradientId ? `url(#${gradientId})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="mastery-ring__bar"
        />
        {gradientId && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>
          </defs>
        )}
      </svg>
      <div className="mastery-ring__center">
        {children ?? (
          <span className="mastery-ring__pct">
            {Math.round(clamped)}
            <span className="mastery-ring__pct-sign">%</span>
          </span>
        )}
      </div>
    </div>
  )
}
