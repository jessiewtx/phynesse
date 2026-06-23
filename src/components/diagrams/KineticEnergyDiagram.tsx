export function KineticEnergyDiagram() {
  return (
    <figure className="concept-diagram" aria-labelledby="ke-diagram-caption">
      <svg
        viewBox="0 0 360 190"
        className="concept-diagram__svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <marker id="vArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#14a89b" />
          </marker>
        </defs>

        {/* Row 1 — speed v */}
        <text x="20" y="40" fill="#5c5c58" fontSize="12" fontWeight="600" fontFamily="system-ui">
          speed v
        </text>
        <circle cx="86" cy="50" r="18" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <line x1="110" y1="50" x2="150" y2="50" stroke="#14a89b" strokeWidth="3" markerEnd="url(#vArrow)" />
        <text x="130" y="40" textAnchor="middle" fill="#14a89b" fontSize="11" fontWeight="600" fontFamily="system-ui">
          v
        </text>
        {/* KE bar (1x) */}
        <rect x="250" y="34" width="86" height="22" rx="4" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.1)" />
        <rect x="250" y="34" width="20" height="22" rx="4" fill="#14a89b" opacity="0.9" />
        <text x="300" y="50" textAnchor="middle" fill="#5c5c58" fontSize="10" fontFamily="system-ui">
          KE
        </text>

        {/* Row 2 — speed 2v */}
        <text x="20" y="130" fill="#5c5c58" fontSize="12" fontWeight="600" fontFamily="system-ui">
          speed 2v
        </text>
        <circle cx="86" cy="140" r="18" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <line x1="110" y1="140" x2="186" y2="140" stroke="#14a89b" strokeWidth="3" markerEnd="url(#vArrow)" />
        <text x="148" y="130" textAnchor="middle" fill="#14a89b" fontSize="11" fontWeight="600" fontFamily="system-ui">
          2v
        </text>
        {/* KE bar (4x) */}
        <rect x="250" y="112" width="86" height="22" rx="4" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.1)" />
        <rect x="250" y="112" width="80" height="22" rx="4" fill="#14a89b" />
        <text x="300" y="128" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" fontFamily="system-ui">
          4 × KE
        </text>
      </svg>
      <figcaption id="ke-diagram-caption" className="concept-diagram__caption">
        Same object, double the speed → four times the kinetic energy (because v is squared).
      </figcaption>
    </figure>
  )
}
