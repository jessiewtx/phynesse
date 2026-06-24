import { useRef, useState, type PointerEvent as RPointer, type KeyboardEvent as RKey } from 'react'

/**
 * Interactive: drag the rope to change the pull angle θ and watch how much of the
 * force actually does work. F and the travel distance d are fixed; only θ moves.
 */

const F = 50 // N, fixed
const D = 5 // m, fixed
const MAX_DEG = 90

const W = 360
const H = 210
const GROUND_Y = 150
const BOX = 42
const BOX_X = 70
const OX = BOX_X + BOX // pivot: front-bottom corner of the box
const OY = GROUND_Y - BOX / 2
const L = 92 // constant arrow length (force magnitude)

const F_COLOR = '#2f7bf6'
const COMP_COLOR = '#1f9d6b'
const D_COLOR = '#ef7d1a'
const VERT_COLOR = '#b0392b' // the "wasted" upward pull

export function AngleWorkExplorer() {
  const [deg, setDeg] = useState(35)
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const tipX = OX + L * cos
  const tipY = OY - L * Math.sin(rad)
  const compX = OX + L * cos
  const work = F * D * cos
  const comp = F * cos

  const setFromClient = (cx: number, cy: number) => {
    const svg = ref.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const px = ((cx - r.left) / r.width) * W
    const py = ((cy - r.top) / r.height) * H
    let a = (Math.atan2(OY - py, px - OX) * 180) / Math.PI
    a = Math.max(0, Math.min(MAX_DEG, a))
    setDeg(Math.round(a))
  }

  const onPointerDown = (e: RPointer<SVGSVGElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClient(e.clientX, e.clientY)
  }
  const onPointerMove = (e: RPointer<SVGSVGElement>) => {
    if (dragging.current) setFromClient(e.clientX, e.clientY)
  }
  const onPointerUp = () => {
    dragging.current = false
  }
  const onKeyDown = (e: RKey<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setDeg((d) => Math.max(0, d - 1))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setDeg((d) => Math.min(MAX_DEG, d + 1))
    }
  }

  // work bar (fraction of the max at θ = 0)
  const frac = cos // work / (F·D)

  return (
    <div className="awe">
      <svg
        ref={ref}
        className="awe__scene"
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Drag to change the pull angle"
        aria-valuemin={0}
        aria-valuemax={MAX_DEG}
        aria-valuenow={deg}
        aria-valuetext={`${deg} degrees`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* ground */}
        <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} className="awe__ground" />
        <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} className="awe__ground-line" />

        {/* distance the box will travel (fixed) */}
        <line x1={OX} y1={GROUND_Y + 20} x2={OX + 150} y2={GROUND_Y + 20} stroke={D_COLOR} strokeWidth="2" />
        <polygon points={`${OX + 150},${GROUND_Y + 20} ${OX + 140},${GROUND_Y + 16} ${OX + 140},${GROUND_Y + 24}`} fill={D_COLOR} />
        <text x={OX + 75} y={GROUND_Y + 38} textAnchor="middle" fill={D_COLOR} fontSize="12" fontWeight="800">d = {D} m</text>

        {/* the box */}
        <rect x={BOX_X} y={GROUND_Y - BOX} width={BOX} height={BOX} rx="5" className="awe__box" />

        {/* horizontal component F·cos θ (green) — the part that does work */}
        <line x1={OX} y1={OY} x2={compX} y2={OY} stroke={COMP_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon points={`${compX},${OY} ${compX - 13},${OY - 6} ${compX - 13},${OY + 6}`} fill={COMP_COLOR} />
        {compX - OX > 44 && (
          <g>
            <text className="awe__lbl" x={(OX + compX) / 2} y={OY + 16} textAnchor="middle" fill={COMP_COLOR} fontSize="11" fontWeight="800">F·cos θ</text>
            <text className="awe__lbl" x={(OX + compX) / 2} y={OY + 28} textAnchor="middle" fill={COMP_COLOR} fontSize="9" fontWeight="700">(does work)</text>
          </g>
        )}

        {/* vertical component F·sin θ (red) — the wasted, up-pulling part */}
        {deg > 4 && (
          <g>
            <line x1={compX} y1={OY} x2={compX} y2={tipY + 12} stroke={VERT_COLOR} strokeWidth="4" strokeLinecap="round" />
            <polygon points={`${compX},${tipY} ${compX - 6},${tipY + 13} ${compX + 6},${tipY + 13}`} fill={VERT_COLOR} />
            <text className="awe__lbl" x={compX + 8} y={(OY + tipY) / 2} fill={VERT_COLOR} fontSize="11" fontWeight="800">F·sin θ</text>
            <text className="awe__lbl" x={compX + 8} y={(OY + tipY) / 2 + 13} fill={VERT_COLOR} fontSize="9" fontWeight="700">(no work)</text>
          </g>
        )}

        {/* full force arrow at angle (blue) */}
        <line x1={OX} y1={OY} x2={tipX} y2={tipY} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon
          points={`${tipX},${tipY} ${tipX - 15 * cos + 6 * Math.sin(rad)},${tipY + 15 * Math.sin(rad) + 6 * cos} ${tipX - 15 * cos - 6 * Math.sin(rad)},${tipY + 15 * Math.sin(rad) - 6 * cos}`}
          fill={F_COLOR}
        />
        <text className="awe__lbl" x={tipX + 8} y={tipY - 4} fill={F_COLOR} fontSize="13" fontWeight="800">F = {F} N</text>

        {/* horizontal reference (the 0° / motion direction) */}
        <line x1={OX} y1={OY} x2={OX + 58} y2={OY} stroke="#b8bdc6" strokeWidth="1.4" strokeDasharray="4 4" />
        {/* angle arc from the reference up to the force */}
        <path
          d={`M ${OX + 24} ${OY} A 24 24 0 0 0 ${OX + 24 * cos} ${OY - 24 * Math.sin(rad)}`}
          fill="none"
          stroke="#555"
          strokeWidth="1.4"
        />
        <text
          className="awe__lbl"
          x={OX + 54 * Math.cos(rad / 2)}
          y={OY - 54 * Math.sin(rad / 2) + 4}
          fill="#444"
          fontSize="12"
          fontWeight="800"
          textAnchor="middle"
        >
          θ = {deg}°
        </text>

        {/* drag handle on the tip */}
        <circle cx={tipX} cy={tipY} r="11" className="awe__grab" />
      </svg>

      <p className="awe__hint">Drag the rope to change the angle</p>

      <div className="awe__readout">
        <div className="awe__line">
          <span className="awe__k" style={{ color: COMP_COLOR }}>F·cos θ</span> ={' '}
          {F} × cos {deg}° = <strong>{comp.toFixed(1)} N</strong> does work
        </div>
        <div className="awe__line">
          <span className="awe__k" style={{ color: VERT_COLOR }}>F·sin θ</span> ={' '}
          {F} × sin {deg}° = <strong>{(F * Math.sin(rad)).toFixed(1)} N</strong> pulls up — but the box never moves up, so it does <strong>0 J</strong> of work
        </div>
        <div className="awe__bar-row">
          <span className="awe__bar-tag">Work</span>
          <div className="awe__bar-track">
            <div className="awe__bar-fill" style={{ width: `${frac * 100}%` }} />
          </div>
          <span className="awe__bar-val">{work.toFixed(0)} J</span>
        </div>
        <div className="awe__formula">
          W = <span style={{ color: F_COLOR }}>F</span> · <span style={{ color: D_COLOR }}>d</span> · cos θ ={' '}
          {F} × {D} × cos {deg}° = <strong>{work.toFixed(0)} J</strong>
        </div>
        <p className="awe__note">
          {deg === 0
            ? 'Straight along the motion — every newton does work.'
            : deg >= MAX_DEG
              ? 'Pulling straight up: no matter how hard you pull, the box only slides sideways — zero vertical motion means W = 0.'
              : 'Work needs motion in the direction of the force. The box moves sideways, so only the green (sideways) part counts — the red up-pull is wasted.'}
        </p>
      </div>
    </div>
  )
}
