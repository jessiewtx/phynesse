type Props = {
  values?: { force: number; distance: number } | null
}

export function WorkEnergyIntroDiagram({ values }: Props) {
  const work = values ? values.force * values.distance : null
  const maxWork = 20 * 5
  const keFillRatio = work ? Math.min(1, work / maxWork) : 0.5
  const keBarH = 72
  const keFillH = Math.max(6, Math.round(keFillRatio * keBarH))

  return (
    <figure className="concept-diagram" aria-labelledby="work-energy-diagram-caption">
      <svg
        viewBox="0 0 360 200"
        className="concept-diagram__svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5b6472" />
            <stop offset="100%" stopColor="#3d4450" />
          </linearGradient>
          <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#4f8cff" />
          </marker>
          <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#34d399" />
          </marker>
        </defs>

        {/* ground */}
        <line x1="24" y1="148" x2="336" y2="148" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <line x1="24" y1="152" x2="336" y2="152" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* block */}
        <rect x="118" y="108" width="56" height="40" rx="4" fill="url(#blockGrad)" stroke="#8b95a8" strokeWidth="1.5" />
        <text x="146" y="133" textAnchor="middle" fill="#e8eaed" fontSize="11" fontFamily="system-ui">
          block
        </text>

        {/* force arrow */}
        <line x1="52" y1="128" x2="114" y2="128" stroke="#4f8cff" strokeWidth="3" markerEnd="url(#arrowBlue)" />
        <text x="80" y="118" textAnchor="middle" fill="#4f8cff" fontSize="12" fontWeight="600" fontFamily="system-ui">
          {values ? `F = ${values.force} N` : 'F'}
        </text>

        {/* displacement */}
        <line x1="118" y1="168" x2="210" y2="168" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
        <text x="164" y="184" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="11" fontFamily="system-ui">
          {values ? `d = ${values.distance} m` : 'distance d'}
        </text>

        {/* energy transfer arc */}
        <path
          d="M 148 98 Q 210 44 260 90"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeDasharray="5 4"
          markerEnd="url(#arrowGreen)"
        />
        <text x="210" y="50" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600" fontFamily="system-ui">
          energy in
        </text>

        {/* KE bar — height reflects actual work done */}
        <rect x="268" y="76" width="28" height={keBarH} rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" />
        <rect x="268" y={76 + keBarH - keFillH} width="28" height={keFillH} rx="4" fill="#34d399" opacity="0.85" />
        <text x="282" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600" fontFamily="system-ui">
          {work ? `${work} J` : 'KE ↑'}
        </text>

        {/* work label box */}
        <rect x="24" y="24" width="120" height="36" rx="8" fill="rgba(79,140,255,0.12)" stroke="rgba(79,140,255,0.35)" />
        <text x="84" y="47" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="600" fontFamily="system-ui">
          {work ? `W = ${work} J` : 'W = F · d'}
        </text>
      </svg>
      <figcaption id="work-energy-diagram-caption" className="concept-diagram__caption">
        {work
          ? `${values!.force} N × ${values!.distance} m = ${work} J of work → ${work} J of kinetic energy`
          : 'Push with force over a distance → work → kinetic energy increases'}
      </figcaption>
    </figure>
  )
}
