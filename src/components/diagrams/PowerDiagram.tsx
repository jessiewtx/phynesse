export function PowerDiagram() {
  const Clock = ({ cx, cy, frac }: { cx: number; cy: number; frac: number }) => {
    const angle = -Math.PI / 2 + frac * 2 * Math.PI
    const hx = cx + Math.cos(angle) * 14
    const hy = cy + Math.sin(angle) * 14
    return (
      <g>
        <circle cx={cx} cy={cy} r={18} fill="#fff" stroke="#9a9a96" strokeWidth="1.5" />
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#5c5c58" strokeWidth="2" />
      </g>
    )
  }

  return (
    <figure className="concept-diagram" aria-labelledby="power-diagram-caption">
      <svg viewBox="0 0 360 170" className="concept-diagram__svg" role="img" aria-hidden="true">
        {/* same energy block, both rows */}
        {/* slow row */}
        <rect x="30" y="24" width="58" height="36" rx="5" fill="#06b6d4" />
        <text x="59" y="47" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui">100 J</text>
        <text x="104" y="46" fill="#5c5c58" fontSize="12" fontFamily="system-ui">in</text>
        <Clock cx={150} cy={42} frac={0.85} />
        <text x="180" y="40" fill="#5c5c58" fontSize="12" fontFamily="system-ui">long time</text>
        <text x="180" y="56" fill="#0e7490" fontSize="12" fontWeight="700" fontFamily="system-ui">→ low power</text>

        {/* fast row */}
        <rect x="30" y="104" width="58" height="36" rx="5" fill="#06b6d4" />
        <text x="59" y="127" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui">100 J</text>
        <text x="104" y="126" fill="#5c5c58" fontSize="12" fontFamily="system-ui">in</text>
        <Clock cx={150} cy={122} frac={0.25} />
        <text x="180" y="120" fill="#5c5c58" fontSize="12" fontFamily="system-ui">short time</text>
        <text x="180" y="136" fill="#0e7490" fontSize="12" fontWeight="700" fontFamily="system-ui">→ high power</text>
      </svg>
      <figcaption id="power-diagram-caption" className="concept-diagram__caption">
        Same energy, less time = more power. Power is the rate energy moves.
      </figcaption>
    </figure>
  )
}
