export function GravitationalPEDiagram() {
  return (
    <figure className="concept-diagram" aria-labelledby="gpe-diagram-caption">
      <svg viewBox="0 0 360 190" className="concept-diagram__svg" role="img" aria-hidden="true">
        {/* ground */}
        <line x1="24" y1="160" x2="336" y2="160" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
        <text x="30" y="176" fill="#9a9a96" fontSize="10" fontFamily="system-ui">h = 0</text>

        {/* low book */}
        <rect x="70" y="120" width="44" height="22" rx="3" fill="#8b5cf6" />
        <line x1="92" y1="142" x2="92" y2="160" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="124" y="135" fill="#5c5c58" fontSize="11" fontFamily="system-ui">low h</text>
        <rect x="70" y="100" width="44" height="14" rx="3" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6" />
        <text x="92" y="111" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="700" fontFamily="system-ui">U_g</text>

        {/* high book */}
        <rect x="232" y="48" width="44" height="22" rx="3" fill="#8b5cf6" />
        <line x1="254" y1="70" x2="254" y2="160" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="286" y="120" fill="#5c5c58" fontSize="11" fontFamily="system-ui">high h</text>
        <rect x="232" y="14" width="44" height="28" rx="3" fill="#8b5cf6" />
        <text x="254" y="32" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="system-ui">U_g</text>
      </svg>
      <figcaption id="gpe-diagram-caption" className="concept-diagram__caption">
        Lift the same object higher → more gravitational PE. U_g grows straight with height.
      </figcaption>
    </figure>
  )
}
