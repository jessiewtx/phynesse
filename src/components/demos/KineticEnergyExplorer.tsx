import { useRef, useState, type CSSProperties } from 'react'

const TARGET = 50
// 50 J is hit exactly by m=4,v=5 or m=1,v=10, so require an exact match.
const TARGET_TOL = 0
const VMAX = 10

/** A round bird that gets visibly chonkier as mass goes up (1–5 kg). */
function Bird({ mass, flapDur }: { mass: number; flapDur?: number }) {
  const f = (mass - 1) / 4 // 0 → 1
  const cx = 60
  const cy = 60
  const rx = 17 + f * 33 // skinny at 1 kg → chonky at 5 kg
  const ry = 18 + f * 16 // and a little taller too
  const eyeX = cx + rx * 0.42
  const eyeY = cy - ry * 0.5
  const beakX = cx + rx
  const beakY = cy - ry * 0.18

  const wingStyle: CSSProperties = flapDur
    ? { animationDuration: `${flapDur}s` }
    : {}

  return (
    <svg viewBox="0 0 120 120" className="ke-bird" role="img" aria-label={`${mass} kg bird`}>
      {/* tail */}
      <path
        d={`M ${cx - rx + 6} ${cy - 6} L ${cx - rx - 18} ${cy - 2} L ${cx - rx + 4} ${cy + 12} Z`}
        fill="#3a9fd6"
      />
      {/* body */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#5bc0eb" />
      {/* belly */}
      <ellipse cx={cx + 2} cy={cy + ry * 0.28} rx={rx * 0.68} ry={ry * 0.6} fill="#d7f0fd" />
      {/* wing (flaps while flying) */}
      <g className="ke-bird__wing" style={wingStyle}>
        <ellipse cx={cx - 2} cy={cy} rx={rx * 0.5} ry={ry * 0.42} fill="#3a9fd6" />
      </g>
      {/* eye */}
      <circle cx={eyeX} cy={eyeY} r="8.5" fill="#fff" />
      <circle cx={eyeX + 2} cy={eyeY} r="4.2" fill="#222" />
      {/* beak */}
      <path
        d={`M ${beakX - 2} ${beakY - 6} L ${beakX + 16} ${beakY} L ${beakX - 2} ${beakY + 6} Z`}
        fill="#ff9f1c"
      />
      {/* feet */}
      <g stroke="#ff9f1c" strokeWidth="3" strokeLinecap="round">
        <line x1={cx - 6} y1={cy + ry - 1} x2={cx - 8} y2={cy + ry + 9} />
        <line x1={cx + 8} y1={cy + ry - 1} x2={cx + 10} y2={cy + ry + 9} />
      </g>
    </svg>
  )
}

function CloudPanel() {
  return (
    <div className="ke-cloud-panel">
      <svg className="ke-cloud" style={{ left: '12%', top: '16%', width: 78 }} viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="34" ry="20" />
          <ellipse cx="68" cy="30" rx="26" ry="22" />
          <ellipse cx="88" cy="40" rx="24" ry="16" />
        </g>
      </svg>
      <svg className="ke-cloud" style={{ left: '64%', top: '30%', width: 56 }} viewBox="0 0 120 60">
        <g fill="#ffffff" opacity="0.92">
          <ellipse cx="40" cy="38" rx="34" ry="20" />
          <ellipse cx="70" cy="32" rx="26" ry="22" />
          <ellipse cx="90" cy="40" rx="22" ry="15" />
        </g>
      </svg>
    </div>
  )
}

function TuftPanel() {
  const tufts = [8, 30, 52, 74, 92]
  return (
    <div className="ke-tuft-panel">
      {tufts.map((x, i) => (
        <svg key={i} className="ke-tuft" style={{ left: `${x}%` }} viewBox="0 0 40 24">
          <g fill="#3fae5a">
            <path d="M20 24 C 12 16 10 8 14 2 C 16 8 18 10 20 12 C 22 10 24 8 26 2 C 30 8 28 16 20 24 Z" />
            <path d="M10 24 C 6 18 4 12 6 8 C 9 12 10 16 12 20 Z" />
            <path d="M30 24 C 34 18 36 12 34 8 C 31 12 30 16 28 20 Z" />
          </g>
        </svg>
      ))}
    </div>
  )
}

/** Draggable semicircular speedometer, 0 → VMAX m/s. */
function Speedometer({ v, onChange }: { v: number; onChange: (v: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const CX = 100
  const CY = 100
  const R = 78

  const angleFor = (val: number) => Math.PI * (1 - val / VMAX)
  const pointFor = (val: number, r = R) => {
    const a = angleFor(val)
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
  }

  const setFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cxClient = rect.left + rect.width * (CX / 200)
    const cyClient = rect.top + rect.height * (CY / 120)
    const dx = clientX - cxClient
    const dy = cyClient - clientY
    let theta = Math.atan2(dy, dx)
    theta = Math.max(0, Math.min(Math.PI, theta))
    const t = 1 - theta / Math.PI
    onChange(Math.max(0, Math.min(VMAX, Math.round(t * VMAX))))
  }

  const needle = pointFor(v, R - 8)
  const arcEnd = pointFor(VMAX)
  const arcStart = pointFor(0)
  const progEnd = pointFor(v)

  const arc = (from: { x: number; y: number }, to: { x: number; y: number }, large = 0) =>
    `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`

  return (
    <div className="ke-gauge">
      <svg
        ref={svgRef}
        viewBox="0 0 200 120"
        className="ke-gauge__svg"
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          setFromPointer(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromPointer(e.clientX, e.clientY)
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <path d={arc(arcStart, arcEnd, 0)} className="ke-gauge__base" />
        <path d={arc(arcStart, progEnd, 0)} className="ke-gauge__prog" />
        {Array.from({ length: VMAX + 1 }, (_, i) => i).map((i) => {
          const a = pointFor(i, R + 2)
          const b = pointFor(i, R - 9)
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="ke-gauge__tick" />
        })}
        <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} className="ke-gauge__needle" />
        <circle cx={CX} cy={CY} r="7" className="ke-gauge__hub" />
        <text x={CX} y={CY - 22} className="ke-gauge__read" textAnchor="middle">
          {v}
        </text>
        <text x={CX} y={CY - 8} className="ke-gauge__unit" textAnchor="middle">
          m/s
        </text>
      </svg>
      <p className="ke-gauge__hint">Drag the dial to change speed</p>
    </div>
  )
}

export function KineticEnergyExplorer() {
  const [m, setM] = useState(2)
  const [v, setV] = useState(3)

  const ke = 0.5 * m * v * v
  const maxKE = 0.5 * 5 * VMAX * VMAX
  const fill = Math.min(1, ke / maxKE)
  const hit = Math.abs(ke - TARGET) <= TARGET_TOL

  // Real-feeling motion: 1 m/s should look genuinely slow. Foreground (grass)
  // moves faster than the far clouds for parallax depth.
  const moving = v > 0
  const cloudDur = moving ? Math.max(4, 44 / v) : 0
  const groundDur = moving ? Math.max(0.9, 15 / v) : 0
  const flapDur = moving ? Math.max(0.18, 1.1 / v) : undefined

  const layerStyle = (dur: number): CSSProperties =>
    moving ? { animationDuration: `${dur}s` } : { animationPlayState: 'paused' }

  return (
    <div className="ke-explorer">
      {/* Outdoor flight scene — the bird stays put while the world drifts past */}
      <div className="ke-sky">
        <div className="ke-sun" />

        <svg className="ke-hills" viewBox="0 0 360 80" preserveAspectRatio="none">
          <path d="M0 80 C 60 30 110 30 170 60 C 230 88 280 36 360 56 L360 80 Z" fill="#bfe3a8" />
          <path d="M0 80 C 80 52 150 70 220 50 C 280 34 320 58 360 44 L360 80 Z" fill="#a6d889" opacity="0.85" />
        </svg>

        <div className="ke-layer ke-layer--clouds" style={layerStyle(cloudDur)}>
          <CloudPanel />
          <CloudPanel />
        </div>

        <div className="ke-ground-band" />
        <div className="ke-layer ke-layer--ground" style={layerStyle(groundDur)}>
          <TuftPanel />
          <TuftPanel />
        </div>

        <span className={`ke-bird-wrap ${moving ? 'is-flying' : ''}`}>
          <Bird mass={m} flapDur={flapDur} />
        </span>

        <span className="ke-sky__tag">{v === 0 ? 'resting' : `${v} m/s`}</span>
      </div>

      {/* Gauge + KE bar */}
      <div className="ke-explorer__stage">
        <Speedometer v={v} onChange={setV} />

        <div className="ke-explorer__meter">
          <div className="ke-explorer__bar">
            <div className="ke-explorer__bar-fill" style={{ height: `${fill * 100}%` }} />
            <div className="ke-explorer__target" style={{ bottom: `${(TARGET / maxKE) * 100}%` }}>
              <span>goal</span>
            </div>
          </div>
          <div className="ke-explorer__ke">
            <strong>{ke.toFixed(0)}</strong> J
          </div>
        </div>
      </div>

      <div className="ke-explorer__formula">
        KE = ½ × {m} × <span className="ke-explorer__sq">{v}²</span> = ½ × {m} × {v * v} ={' '}
        <strong>{ke.toFixed(0)} J</strong>
      </div>

      {/* Mass slider — the bird fattens up as you drag */}
      <div className="ke-explorer__controls">
        <label className="ke-explorer__row">
          <span>Bird mass</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
          />
          <span className="ke-explorer__val">{m} kg</span>
        </label>
      </div>

      <p className={`ke-explorer__goal ${hit ? 'ke-explorer__goal--hit' : ''}`}>
        {hit
          ? '✓ Nice — exactly 50 J! Notice a 1 kg bird at 10 m/s ties a 4 kg bird at 5 m/s — speed counts for more.'
          : 'Goal: tune the dial and bird mass until KE = 50 J exactly.'}
      </p>
    </div>
  )
}
