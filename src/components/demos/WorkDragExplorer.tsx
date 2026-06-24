import { useRef, useState, type PointerEvent as RPointer, type KeyboardEvent as RKey } from 'react'

/**
 * Free-explore W = F·d before the "double it" question. Two drag handles:
 *  • drag the flag (or box) → change the distance the box travels
 *  • drag the back (tail) of the blue arrow ← → change how hard you push (F)
 * The work bar updates live so the learner feels W depend on both factors.
 */

const F_COLOR = '#2f7bf6'
const D_COLOR = '#ef7d1a'

const W = 560
const H = 205
const GROUND_Y = 150
const ORIGIN_X = 80
const BOX = 42
const D_MIN = 1
const D_MAX = 6
const D_STEP = 0.5
const F_MIN = 2
const F_MAX = 20
const L_MIN = 22
const L_MAX = 80
const FORCE_Y = GROUND_Y - 86
const PX_PER_M = (W - 70 - BOX - ORIGIN_X) / D_MAX

export function WorkDragExplorer() {
  const [d, setD] = useState(2)
  const [force, setForce] = useState(10)
  const ref = useRef<SVGSVGElement | null>(null)
  const active = useRef<'dist' | 'force' | null>(null)

  const boxX = ORIGIN_X + d * PX_PER_M
  const boxRight = boxX + BOX
  const headX = boxX
  const lpx = L_MIN + ((force - F_MIN) / (F_MAX - F_MIN)) * (L_MAX - L_MIN)
  const tailX = headX - lpx
  const flagTopY = GROUND_Y - 64
  const work = force * d
  const maxWork = F_MAX * D_MAX

  const toSvg = (cx: number, cy: number) => {
    const svg = ref.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H }
  }

  const applyDist = (lx: number) => {
    const raw = (lx - ORIGIN_X) / PX_PER_M
    const snapped = Math.round(raw / D_STEP) * D_STEP
    setD(Math.max(D_MIN, Math.min(D_MAX, snapped)))
  }
  const applyForce = (lx: number) => {
    const clamped = Math.max(L_MIN, Math.min(L_MAX, headX - lx))
    setForce(Math.round(F_MIN + ((clamped - L_MIN) / (L_MAX - L_MIN)) * (F_MAX - F_MIN)))
  }

  const onDown = (e: RPointer<SVGSVGElement>) => {
    const p = toSvg(e.clientX, e.clientY)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const dTail = Math.hypot(p.x - tailX, p.y - FORCE_Y)
    const dFlag = Math.hypot(p.x - boxRight, p.y - flagTopY)
    if (dTail < dFlag) {
      active.current = 'force'
      applyForce(p.x)
    } else {
      active.current = 'dist'
      applyDist(p.x)
    }
  }
  const onMove = (e: RPointer<SVGSVGElement>) => {
    if (!active.current) return
    const p = toSvg(e.clientX, e.clientY)
    if (!p) return
    if (active.current === 'force') applyForce(p.x)
    else applyDist(p.x)
  }
  const onUp = () => {
    active.current = null
  }
  const onKey = (e: RKey<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setD((x) => Math.max(D_MIN, x - D_STEP))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setD((x) => Math.min(D_MAX, x + D_STEP))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setForce((f) => Math.min(F_MAX, f + 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setForce((f) => Math.max(F_MIN, f - 1))
    }
  }

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

  return (
    <div className="wfx">
      <svg
        ref={ref}
        className="wfx__scene"
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Drag the flag to set distance, drag the arrow tail to set force"
        aria-valuetext={`Force ${force} newtons, distance ${fmt(d)} meters, work ${fmt(work)} joules`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} className="cmp__ground" />
        <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} className="cmp__ground-line" />

        <line x1={ORIGIN_X} y1={GROUND_Y - 96} x2={ORIGIN_X} y2={GROUND_Y} className="cmp__start-line" />
        <text x={ORIGIN_X} y={GROUND_Y - 102} className="cmp__start-label" textAnchor="middle" fill="#9aa3ad" fontSize="11" fontWeight="700">start</text>

        {/* distance measure */}
        <g className="cmp__measure">
          <line x1={ORIGIN_X} y1={GROUND_Y + 22} x2={boxX} y2={GROUND_Y + 22} className="cmp__measure-line" />
          <line x1={ORIGIN_X} y1={GROUND_Y + 14} x2={ORIGIN_X} y2={GROUND_Y + 30} className="cmp__measure-line" />
          <line x1={boxX} y1={GROUND_Y + 14} x2={boxX} y2={GROUND_Y + 30} className="cmp__measure-line" />
          <text x={(ORIGIN_X + boxX) / 2} y={GROUND_Y + 44} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d = {fmt(d)} m</text>
        </g>

        {/* person pushing */}
        <g className="cmp__person" transform={`translate(${boxX - 34}, 0)`}>
          <line x1="6" y1={GROUND_Y} x2="14" y2={GROUND_Y - 22} />
          <line x1="22" y1={GROUND_Y} x2="14" y2={GROUND_Y - 22} />
          <line x1="14" y1={GROUND_Y - 22} x2="16" y2={GROUND_Y - 44} />
          <circle cx="16" cy={GROUND_Y - 52} r="8" />
          <line x1="16" y1={GROUND_Y - 42} x2="34" y2={GROUND_Y - 30} />
        </g>

        {/* draggable force arrow: head at the box, drag the tail to add force */}
        <g>
          <line x1={tailX} y1={FORCE_Y} x2={headX - 12} y2={FORCE_Y} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
          <polygon points={`${headX},${FORCE_Y} ${headX - 12},${FORCE_Y - 8} ${headX - 12},${FORCE_Y + 8}`} fill={F_COLOR} />
          <circle cx={tailX} cy={FORCE_Y} r="11" fill={F_COLOR} opacity="0.22" className="wfx__grab" />
          <text className="wfx__lbl" x={(tailX + headX) / 2} y={FORCE_Y - 13} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F = {force} N</text>
        </g>

        {/* box */}
        <rect x={boxX} y={GROUND_Y - BOX} width={BOX} height={BOX} rx="6" className="cmp__box" />

        {/* end flag (drag to set distance) */}
        <g className="cmp__flag">
          <line x1={boxRight} y1={GROUND_Y} x2={boxRight} y2={GROUND_Y - 64} />
          <path d={`M ${boxRight} ${GROUND_Y - 64} L ${boxRight + 26} ${GROUND_Y - 57} L ${boxRight} ${GROUND_Y - 48} Z`} />
          <circle cx={boxRight} cy={GROUND_Y - 64} r="11" className="cmp__flag-grab wfx__grab" />
        </g>
      </svg>

      <p className="cmp__hint-drag">Drag the flag for distance, and the back of the blue arrow for force</p>

      <div className="wfx__readout">
        <div className="wfx__formula">
          W = <span style={{ color: F_COLOR }}>{force} N</span> × <span style={{ color: D_COLOR }}>{fmt(d)} m</span> ={' '}
          <strong>{fmt(work)} J</strong>
        </div>
        <div className="wfx__bar-row">
          <span className="wfx__bar-tag">Work</span>
          <div className="wfx__bar-track">
            <div className="wfx__bar-fill" style={{ width: `${(work / maxWork) * 100}%` }} />
          </div>
          <span className="wfx__bar-val">{fmt(work)} J</span>
        </div>
      </div>
    </div>
  )
}
