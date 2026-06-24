function spring(x: number, y: number, len: number, coils = 6) {
  const seg = len / (coils * 2)
  let d = `M ${x} ${y}`
  for (let i = 0; i < coils * 2; i++) {
    const dx = x + seg * (i + 1)
    const dy = y + (i % 2 === 0 ? -9 : 9)
    d += ` L ${dx} ${dy}`
  }
  d += ` L ${x + len} ${y}`
  return d
}

export function ElasticPEDiagram() {
  return (
    <figure className="concept-diagram" aria-labelledby="epe-diagram-caption">
      <svg viewBox="0 0 360 180" className="concept-diagram__svg" role="img" aria-hidden="true">
        {/* small compression */}
        <rect x="20" y="34" width="8" height="44" fill="#5c5c58" />
        <path d={spring(28, 56, 64)} fill="none" stroke="#ec4899" strokeWidth="2.5" />
        <rect x="92" y="40" width="22" height="32" rx="3" fill="#3d4450" />
        <text x="60" y="92" textAnchor="middle" fill="#5c5c58" fontSize="11" fontFamily="system-ui">small x</text>
        <rect x="140" y="48" width="20" height="16" rx="3" fill="rgba(236,72,153,0.18)" stroke="#ec4899" />
        <text x="150" y="60" textAnchor="middle" fill="#db2777" fontSize="8" fontWeight="700" fontFamily="system-ui">PE_s</text>

        {/* double compression */}
        <rect x="20" y="116" width="8" height="44" fill="#5c5c58" />
        <path d={spring(28, 138, 36)} fill="none" stroke="#ec4899" strokeWidth="2.5" />
        <rect x="64" y="122" width="22" height="32" rx="3" fill="#3d4450" />
        <text x="120" y="174" textAnchor="middle" fill="#5c5c58" fontSize="11" fontFamily="system-ui">2x compression</text>
        <rect x="140" y="98" width="20" height="64" rx="3" fill="#ec4899" />
        <text x="150" y="134" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui">4×PE_s</text>
      </svg>
      <figcaption id="epe-diagram-caption" className="concept-diagram__caption">
        Compress a spring twice as far → four times the stored energy (x is squared).
      </figcaption>
    </figure>
  )
}
