export function ConservationDiagram() {
  const total = 110
  const baseY = 24

  const Bar = ({ x, ke, u, label }: { x: number; ke: number; u: number; label: string }) => {
    const keH = Math.round(ke * total)
    const uH = Math.round(u * total)
    return (
      <g>
        {/* U on top */}
        <rect x={x} y={baseY} width={48} height={uH} fill="#8b5cf6" rx={3} />
        {uH > 16 && (
          <text x={x + 24} y={baseY + uH / 2 + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="system-ui">U</text>
        )}
        {/* KE below */}
        <rect x={x} y={baseY + uH} width={48} height={keH} fill="#34d399" rx={3} />
        {keH > 16 && (
          <text x={x + 24} y={baseY + uH + keH / 2 + 4} textAnchor="middle" fill="#0b3d34" fontSize="10" fontWeight="700" fontFamily="system-ui">KE</text>
        )}
        <text x={x + 24} y={baseY + total + 18} textAnchor="middle" fill="#5c5c58" fontSize="11" fontFamily="system-ui">{label}</text>
      </g>
    )
  }

  return (
    <figure className="concept-diagram" aria-labelledby="cons-diagram-caption">
      <svg viewBox="0 0 360 175" className="concept-diagram__svg" role="img" aria-hidden="true">
        <Bar x={48} ke={0} u={1} label="top (at rest)" />
        <Bar x={156} ke={0.5} u={0.5} label="halfway" />
        <Bar x={264} ke={1} u={0} label="bottom" />
      </svg>
      <figcaption id="cons-diagram-caption" className="concept-diagram__caption">
        No friction: energy just trades between U and KE — the total stays the same.
      </figcaption>
    </figure>
  )
}
