import { useRef, useState, type PointerEvent as RPointer, type KeyboardEvent as RKey } from 'react'

/**
 * Interactive: the box always SLIDES RIGHT. Drag the rope all the way around to
 * change the angle θ between your pull and that motion. Pull forward (θ < 90°) and
 * the sideways part runs with the motion → positive work, speeding the box up.
 * Pull backward (θ > 90°) and it fights the motion → negative work, slowing it
 * down — even though the box keeps moving right. F and the distance d are fixed.
 */

const F = 50 // N, fixed
const D = 5 // m, fixed
const MAX_DEG = 180

const W = 380
const H = 240
const GROUND_Y = 175
const BOX = 40
const BOX_X = 130 // box spans 130–170, centred on 150
const BOX_R = BOX_X + BOX // right edge
const BOX_TOP = GROUND_Y - BOX
const PX = BOX_X + BOX / 2 // pivot x: top-centre of the box
const PY = BOX_TOP - 18 // pivot floats above the box so labels have room
const L = 88 // constant arrow length (force magnitude)

const F_COLOR = '#2f7bf6'
const POS_COLOR = '#1f9d6b' // sideways part WITH the motion → positive work
const NEG_COLOR = '#d1495b' // sideways part AGAINST the motion → negative work
const VERT_COLOR = '#8a8f98' // vertical part → no work (neutral grey)
const D_COLOR = '#ef7d1a'

export function AngleWorkExplorer() {
  const [deg, setDeg] = useState(35)
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)
  const lastDeg = useRef(35)

  const apply = (a: number) => {
    const v = Math.round(Math.max(0, Math.min(MAX_DEG, a)))
    lastDeg.current = v
    setDeg(v)
  }

  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad) // signed: + pulling forward, − pulling back
  const sin = Math.sin(rad) // ≥ 0 across 0–180°, the upward part
  const tipX = PX + L * cos
  const tipY = PY - L * sin
  const compX = tipX // horizontal component shares the tip's x
  const work = F * D * cos // signed
  const comp = F * cos // signed horizontal component
  const vertMag = F * sin // upward component magnitude
  const sideColor = work >= 0 ? POS_COLOR : NEG_COLOR

  const setFromClient = (cx: number, cy: number) => {
    const svg = ref.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const px = ((cx - r.left) / r.width) * W
    const py = ((cy - r.top) / r.height) * H
    // angle from the rightward motion direction, CCW positive (−180..180]
    let a = (Math.atan2(PY - py, px - PX) * 180) / Math.PI
    // Below the horizontal axis atan2 goes negative. Don't wrap to the other
    // side — hold at whichever end (0° or 180°) we were already nearest to.
    if (a < 0) a = lastDeg.current >= 90 ? MAX_DEG : 0
    apply(a)
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
      apply(deg - 1)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      apply(deg + 1)
    }
  }

  // diverging work bar (centre = 0, right = +, left = −)
  const frac = cos // work / (F·D)
  const pct = Math.abs(frac) * 50
  const fillStyle =
    frac >= 0
      ? { left: '50%', width: `${pct}%`, background: POS_COLOR }
      : { left: `${50 - pct}%`, width: `${pct}%`, background: NEG_COLOR }

  // generic arrowhead pointing along the force direction
  const ux = cos
  const uy = -sin
  const headBaseX = tipX - 15 * ux
  const headBaseY = tipY - 15 * uy
  const perpX = -uy
  const perpY = ux

  const arcEndX = PX + 24 * cos
  const arcEndY = PY - 24 * sin

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

        {/* the box always slides RIGHT — make that unmistakable */}
        <line x1={BOX_R + 6} y1={GROUND_Y + 20} x2={BOX_R + 150} y2={GROUND_Y + 20} stroke={D_COLOR} strokeWidth="2.5" />
        <polygon points={`${BOX_R + 162},${GROUND_Y + 20} ${BOX_R + 150},${GROUND_Y + 15} ${BOX_R + 150},${GROUND_Y + 25}`} fill={D_COLOR} />
        <text x={BOX_R + 78} y={GROUND_Y + 38} textAnchor="middle" fill={D_COLOR} fontSize="12" fontWeight="800">box slides → (d = {D} m)</text>

        {/* the box */}
        <rect x={BOX_X} y={GROUND_Y - BOX} width={BOX} height={BOX} rx="5" className="awe__box" />

        {/* horizontal component F·cos θ — green if with motion, red if against */}
        <line x1={PX} y1={PY} x2={compX} y2={PY} stroke={sideColor} strokeWidth="6" strokeLinecap="round" />
        {Math.abs(compX - PX) > 24 && (
          <polygon
            points={
              frac >= 0
                ? `${compX},${PY} ${compX - 13},${PY - 6} ${compX - 13},${PY + 6}`
                : `${compX},${PY} ${compX + 13},${PY - 6} ${compX + 13},${PY + 6}`
            }
            fill={sideColor}
          />
        )}
        {Math.abs(compX - PX) > 44 && (
          <text className="awe__lbl" x={(PX + compX) / 2} y={PY + 14} textAnchor="middle" fill={sideColor} fontSize="11" fontWeight="800">F·cos θ</text>
        )}

        {/* vertical component F·sin θ — grey, no work */}
        {Math.abs(tipY - PY) > 16 && (
          <g>
            <line x1={compX} y1={PY} x2={compX} y2={tipY + 12} stroke={VERT_COLOR} strokeWidth="4" strokeLinecap="round" />
            <polygon points={`${compX},${tipY} ${compX - 6},${tipY + 13} ${compX + 6},${tipY + 13}`} fill={VERT_COLOR} />
            <text className="awe__lbl" x={compX + (frac >= 0 ? 9 : -9)} y={(PY + tipY) / 2 + 4} textAnchor={frac >= 0 ? 'start' : 'end'} fill={VERT_COLOR} fontSize="11" fontWeight="800">F·sin θ</text>
          </g>
        )}

        {/* full force arrow at angle (blue) */}
        <line x1={PX} y1={PY} x2={tipX} y2={tipY} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon
          points={`${tipX},${tipY} ${headBaseX + 6 * perpX},${headBaseY + 6 * perpY} ${headBaseX - 6 * perpX},${headBaseY - 6 * perpY}`}
          fill={F_COLOR}
        />
        <text className="awe__lbl" x={tipX + (cos >= 0 ? 8 : -8)} y={tipY - 6} textAnchor={cos >= 0 ? 'start' : 'end'} fill={F_COLOR} fontSize="13" fontWeight="800">F = {F} N</text>

        {/* rightward reference = the motion direction the angle is measured from */}
        <line x1={PX} y1={PY} x2={PX + 54} y2={PY} stroke="#b8bdc6" strokeWidth="1.4" strokeDasharray="4 4" />
        {/* angle arc from the motion direction up to the force */}
        <path d={`M ${PX + 24} ${PY} A 24 24 0 0 0 ${arcEndX} ${arcEndY}`} fill="none" stroke="#555" strokeWidth="1.4" />
        <text
          className="awe__lbl"
          x={PX + 42 * Math.cos(rad / 2)}
          y={PY - 42 * Math.sin(rad / 2) + 4}
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

      <p className="awe__hint">The box always slides →. Drag the rope all the way around.</p>

      <div className="awe__readout">
        <div className="awe__line">
          <span className="awe__k" style={{ color: sideColor }}>F·cos θ</span> ={' '}
          {F} × cos {deg}° = <strong>{comp.toFixed(1)} N</strong>{' '}
          {work >= 0 ? '— runs with the motion (this is what does the work)' : '— runs against the motion'}
        </div>
        <div className="awe__line">
          <span className="awe__k" style={{ color: VERT_COLOR }}>F·sin θ</span> ={' '}
          {F} × sin {deg}° = <strong>{vertMag.toFixed(1)} N</strong> is vertical — the box never moves up, so it does <strong>0 J</strong>
        </div>
        <div className="awe__bar-row">
          <span className="awe__bar-tag">Work</span>
          <div className="awe__bar-track">
            <div className="awe__bar-zero" />
            <div className="awe__bar-fill" style={fillStyle} />
          </div>
          <span className="awe__bar-val" style={{ color: work < 0 ? NEG_COLOR : undefined }}>{work.toFixed(0)} J</span>
        </div>
        <div className="awe__formula">
          W = <span style={{ color: F_COLOR }}>F</span> · <span style={{ color: D_COLOR }}>d</span> · cos θ ={' '}
          {F} × {D} × cos {deg}° = <strong style={{ color: work < 0 ? NEG_COLOR : undefined }}>{work.toFixed(0)} J</strong>
        </div>
        <p className="awe__note">{note(deg)}</p>
      </div>
    </div>
  )
}

function note(deg: number): string {
  if (deg <= 2) return 'Straight along the motion — all of the force does work, speeding the box up the most.'
  if (deg < 88) return 'Positive work: the sideways part runs WITH the motion, so energy goes INTO the box — it speeds up.'
  if (deg <= 92) return 'A 90° pull is perpendicular: zero work, so the speed does not change at all.'
  if (deg >= 178) return 'Straight backward: the whole force fights the motion — the fastest slow-down (most negative work).'
  return 'Negative work: the sideways part runs AGAINST the motion, so energy comes OUT of the box — it slows down, like a brake.'
}
