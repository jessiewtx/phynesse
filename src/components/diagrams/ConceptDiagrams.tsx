/**
 * Static, colour-coded diagrams for the formula concept pages. Each one reuses
 * the `wfd` styling (svg + legend + worked calculation) so every formula page
 * gets a real visual instead of a bare equation. Purely illustrative.
 */

import { useRef, useState, type PointerEvent as RPointer, type KeyboardEvent as RKey } from 'react'

const F_COLOR = '#2f7bf6' // force / push — blue
const D_COLOR = '#ef7d1a' // distance — orange
const COMP_COLOR = '#1f9d6b' // useful component / KE — green
const FRIC_COLOR = '#e0533b' // friction / heat — red
const PE_COLOR = '#7b5cff' // potential energy — purple

function Box({ x, y, w, h, ghost = false, label }: { x: number; y: number; w: number; h: number; ghost?: boolean; label?: string }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={ghost ? 'none' : '#3d4450'}
        stroke={ghost ? '#aab3c2' : '#8b95a8'}
        strokeWidth="1.5"
        strokeDasharray={ghost ? '4 3' : undefined}
      />
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill={ghost ? '#aab3c2' : '#c0c8d4'} fontSize="9">
          {label}
        </text>
      )}
    </g>
  )
}

function Key({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="wfd__key" style={{ color }}>
      <span className="wfd__dot" style={{ background: color }} /> {children}
    </span>
  )
}

/** Subscript inside an SVG <text> (e.g. the "g" in PE_g). Rendered last. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <tspan dy="3" fontSize="8">
      {children}
    </tspan>
  )
}

/* ---------------- L1: when is there NO work? ---------------- */
function StickPerson({ x, groundY, armUp = false }: { x: number; groundY: number; armUp?: boolean }) {
  return (
    <g stroke="#3d4450" strokeWidth="3.5" strokeLinecap="round" fill="none">
      <circle cx={x} cy={groundY - 52} r="8" fill="#3d4450" stroke="none" />
      <line x1={x} y1={groundY - 44} x2={x} y2={groundY - 20} />
      <line x1={x} y1={groundY - 20} x2={x - 9} y2={groundY} />
      <line x1={x} y1={groundY - 20} x2={x + 9} y2={groundY} />
      {armUp ? (
        <>
          <line x1={x} y1={groundY - 38} x2={x - 14} y2={groundY - 48} />
          <line x1={x} y1={groundY - 38} x2={x + 14} y2={groundY - 48} />
        </>
      ) : (
        <>
          <line x1={x} y1={groundY - 38} x2={x - 14} y2={groundY - 30} />
          <line x1={x} y1={groundY - 38} x2={x + 14} y2={groundY - 30} />
        </>
      )}
    </g>
  )
}

export function ZeroWorkDiagram() {
  const groundY = 134
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 188" className="wfd__svg" role="img" aria-label="Two cases where a force does no work">
        <line x1="14" y1={groundY} x2="346" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

        {/* Case A: holding still */}
        <text x={80} y={20} textAnchor="middle" fill="#333" fontSize="12" fontWeight="800">Holding still</text>
        <StickPerson x={80} groundY={groundY} armUp />
        <rect x={66} y={groundY - 64} width={28} height={20} rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <text x={80} y={groundY + 20} textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">d = 0</text>
        <text x={80} y={groundY + 38} textAnchor="middle" fill={FRIC_COLOR} fontSize="13" fontWeight="800">W = 0</text>

        {/* divider */}
        <line x1="180" y1="14" x2="180" y2={groundY - 4} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Case B: carrying horizontally */}
        <text x={262} y={20} textAnchor="middle" fill="#333" fontSize="12" fontWeight="800">Carrying across</text>
        <StickPerson x={250} groundY={groundY} armUp />
        <rect x={236} y={groundY - 64} width={28} height={20} rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        {/* support force up (green) */}
        <line x1={250} y1={groundY - 66} x2={250} y2={groundY - 92} stroke={COMP_COLOR} strokeWidth="5" strokeLinecap="round" />
        <polygon points={`${250},${groundY - 96} ${244},${groundY - 86} ${256},${groundY - 86}`} fill={COMP_COLOR} />
        <text x={236} y={groundY - 80} textAnchor="end" fill={COMP_COLOR} fontSize="12" fontWeight="800">F</text>
        {/* motion sideways (orange) */}
        <line x1={272} y1={groundY - 34} x2={314} y2={groundY - 34} stroke={D_COLOR} strokeWidth="5" strokeLinecap="round" />
        <polygon points={`${320},${groundY - 34} ${310},${groundY - 39} ${310},${groundY - 29}`} fill={D_COLOR} />
        <text x={296} y={groundY - 42} textAnchor="middle" fill={D_COLOR} fontSize="11" fontWeight="800">motion</text>
        <text x={262} y={groundY + 20} textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">F ⟂ motion</text>
        <text x={262} y={groundY + 38} textAnchor="middle" fill={FRIC_COLOR} fontSize="13" fontWeight="800">W = 0</text>
      </svg>

      <div className="wfd__legend">
        <Key color={COMP_COLOR}>F = the force you apply</Key>
        <Key color={D_COLOR}>motion = where it actually moves</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__plug">No motion <em>along the force</em> → no work, no matter how hard you push.</div>
      </div>
    </div>
  )
}

/* ---------------- L1: positive / negative / zero work ---------------- */
export function WorkSignDiagram() {
  const groundY = 104
  const boxX = 150
  const BOX = 46
  const cy = groundY - BOX / 2
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 158" className="wfd__svg" role="img" aria-label="Forces doing positive, negative and zero work on a moving box">
        <line x1="14" y1={groundY} x2="346" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
        <Box x={boxX} y={groundY - BOX} w={BOX} h={BOX} label="box" />

        {/* motion direction */}
        <text x={boxX + BOX / 2} y={groundY + 22} textAnchor="middle" fill="#777" fontSize="10" fontWeight="700">moving →</text>

        {/* push forward (+) blue */}
        <line x1={boxX + BOX} y1={cy} x2={boxX + BOX + 60} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${boxX + BOX + 74},${cy} ${boxX + BOX + 60},${cy - 9} ${boxX + BOX + 60},${cy + 9}`} fill={F_COLOR} />
        <text x={boxX + BOX + 42} y={cy - 13} textAnchor="middle" fill={F_COLOR} fontSize="12" fontWeight="800">push +</text>

        {/* friction backward (−) red */}
        <line x1={boxX} y1={cy} x2={boxX - 44} y2={cy} stroke={FRIC_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${boxX - 58},${cy} ${boxX - 44},${cy - 9} ${boxX - 44},${cy + 9}`} fill={FRIC_COLOR} />
        <text x={boxX - 30} y={cy - 13} textAnchor="middle" fill={FRIC_COLOR} fontSize="12" fontWeight="800">friction −</text>

        {/* gravity / normal perpendicular (0) gray */}
        <line x1={boxX + BOX / 2} y1={groundY - BOX} x2={boxX + BOX / 2} y2={groundY - BOX - 30} stroke="#9aa3ad" strokeWidth="5" strokeLinecap="round" />
        <polygon points={`${boxX + BOX / 2},${groundY - BOX - 34} ${boxX + BOX / 2 - 6},${groundY - BOX - 24} ${boxX + BOX / 2 + 6},${groundY - BOX - 24}`} fill="#9aa3ad" />
        <text x={boxX + BOX / 2} y={groundY - BOX - 40} textAnchor="middle" fill="#7c858f" fontSize="11" fontWeight="800">normal: 0</text>
      </svg>

      <div className="wfd__legend">
        <Key color={F_COLOR}>with motion: +work, speeds up</Key>
        <Key color={FRIC_COLOR}>against motion: −work, slows down</Key>
        <Key color="#9aa3ad">perpendicular: 0 work, no change</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__plug">{'Positive work adds kinetic energy (speeds up); negative work removes it (slows down). The sign comes from cos\u00A0θ:\u00A0 cos\u00A00°\u00A0=\u00A0+1,\u00A0 cos\u00A0180°\u00A0=\u00A0\u22121,\u00A0 cos\u00A090°\u00A0=\u00A00.'}</div>
      </div>
    </div>
  )
}

/* ---------------- L1: W = F·d·cos θ ---------------- */
export function WorkAngleDiagram() {
  const groundY = 104
  const startX = 46
  const endX = 196
  const BOX = 38
  const startC = startX + BOX / 2
  const endC = endX + BOX / 2
  const ox = endX + BOX - 6 // force origin near the box corner
  const oy = groundY - BOX
  const theta = (37 * Math.PI) / 180
  const L = 76
  const fx = ox + L * Math.cos(theta)
  const fy = oy - L * Math.sin(theta)
  const cxh = ox + L * Math.cos(theta) // horizontal reach
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 156" className="wfd__svg" role="img" aria-label="A box pulled by a force at an angle">
        <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
        <Box x={startX} y={groundY - BOX} w={BOX} h={BOX} ghost label="start" />
        <line x1={startC} y1={groundY - BOX / 2} x2={endC} y2={groundY - BOX / 2} stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeDasharray="3 4" />
        <Box x={endX} y={groundY - BOX} w={BOX} h={BOX} label="box" />

        {/* full force at angle (blue) */}
        <line x1={ox} y1={oy} x2={fx} y2={fy} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon points={`${fx},${fy} ${fx - 14},${fy + 2} ${fx - 6},${fy + 12}`} fill={F_COLOR} />
        <text x={fx + 6} y={fy - 2} fill={F_COLOR} fontSize="13" fontWeight="800">F</text>

        {/* horizontal component F·cos θ (green) */}
        <line x1={ox} y1={oy} x2={cxh} y2={oy} stroke={COMP_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon points={`${cxh},${oy} ${cxh - 13},${oy - 6} ${cxh - 13},${oy + 6}`} fill={COMP_COLOR} />
        <text x={(ox + cxh) / 2} y={oy + 16} textAnchor="middle" fill={COMP_COLOR} fontSize="11" fontWeight="800">F·cos θ</text>

        {/* projection line + angle */}
        <line x1={fx} y1={fy} x2={cxh} y2={oy} stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d={`M ${ox + 26} ${oy} A 26 26 0 0 0 ${ox + 26 * Math.cos(theta)} ${oy - 26 * Math.sin(theta)}`} fill="none" stroke="#555" strokeWidth="1.4" />
        <text x={ox + 32} y={oy - 10} fill="#555" fontSize="11" fontWeight="700">θ</text>

        {/* distance d (orange) */}
        <line x1={startC} y1={groundY} x2={startC} y2={groundY + 28} stroke={D_COLOR} strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1={endC} y1={groundY} x2={endC} y2={groundY + 28} stroke={D_COLOR} strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1={startC} y1={groundY + 24} x2={endC} y2={groundY + 24} stroke={D_COLOR} strokeWidth="2" />
        <polygon points={`${startC},${groundY + 24} ${startC + 9},${groundY + 20} ${startC + 9},${groundY + 28}`} fill={D_COLOR} />
        <polygon points={`${endC},${groundY + 24} ${endC - 9},${groundY + 20} ${endC - 9},${groundY + 28}`} fill={D_COLOR} />
        <text x={(startC + endC) / 2} y={groundY + 21} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
      </svg>

      <div className="wfd__legend">
        <Key color={F_COLOR}>F = the full pull</Key>
        <Key color={COMP_COLOR}>F·cos θ = the part that does work</Key>
        <Key color={D_COLOR}>d = distance moved</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          W = <span style={{ color: F_COLOR }}>F</span> · <span style={{ color: D_COLOR }}>d</span> · cos θ
        </div>
        <div className="wfd__plug">
          W = <span style={{ color: F_COLOR }}>50&nbsp;N</span> × <span style={{ color: D_COLOR }}>5&nbsp;m</span> × cos&nbsp;37° ≈ <strong>200&nbsp;J</strong>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L1: W_net = (F − f)·d (interactive) ---------------- */
const NW_F = 25 // N, fixed push
const NW_D = 4 // m, fixed distance
const NW_F_MIN = 2
const NW_F_MAX = 24
const NW_PXN = 3.1 // px per newton

export function NetWorkDiagram() {
  const [f, setF] = useState(10)
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const groundY = 96
  const boxX = 160
  const BOX = 46
  const cy = groundY - BOX / 2

  const lF = NW_F * NW_PXN
  const lf = f * NW_PXN
  const fricTipX = boxX - lf - 14
  const wnet = (NW_F - f) * NW_D

  const setFromClient = (clientX: number) => {
    const svg = ref.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * 360
    const lfNext = boxX - 14 - x
    const fNext = Math.round(lfNext / NW_PXN)
    setF(Math.max(NW_F_MIN, Math.min(NW_F_MAX, fNext)))
  }

  const onDown = (e: RPointer<SVGSVGElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClient(e.clientX)
  }
  const onMove = (e: RPointer<SVGSVGElement>) => {
    if (dragging.current) setFromClient(e.clientX)
  }
  const onUp = () => {
    dragging.current = false
  }
  const onKey = (e: RKey<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setF((v) => Math.min(NW_F_MAX, v + 1))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setF((v) => Math.max(NW_F_MIN, v - 1))
    }
  }

  return (
    <div className="wfd">
      <svg
        ref={ref}
        viewBox="0 0 360 150"
        className="wfd__svg"
        role="slider"
        tabIndex={0}
        aria-label="Drag the friction arrow to change how strong friction is"
        aria-valuemin={NW_F_MIN}
        aria-valuemax={NW_F_MAX}
        aria-valuenow={f}
        aria-valuetext={`friction ${f} newtons`}
        style={{ touchAction: 'none', userSelect: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
        <Box x={boxX} y={groundY - BOX} w={BOX} h={BOX} label="box" />

        {/* push F to the right (blue, fixed) */}
        <line x1={boxX + BOX} y1={cy} x2={boxX + BOX + lF} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${boxX + BOX + lF + 14},${cy} ${boxX + BOX + lF},${cy - 9} ${boxX + BOX + lF},${cy + 9}`} fill={F_COLOR} />
        <text x={boxX + BOX + lF / 2} y={cy - 14} textAnchor="middle" fill={F_COLOR} fontSize="12" fontWeight="800">F<tspan dy="3" fontSize="9">A</tspan><tspan dy="-3"> = {NW_F} N</tspan></text>

        {/* friction f to the left (red, draggable by its tip) */}
        <line x1={boxX} y1={cy} x2={boxX - lf} y2={cy} stroke={FRIC_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${fricTipX},${cy} ${boxX - lf},${cy - 9} ${boxX - lf},${cy + 9}`} fill={FRIC_COLOR} />
        <circle cx={fricTipX + 4} cy={cy} r="11" fill={FRIC_COLOR} opacity="0.24" className="wfx__grab" />
        <text x={boxX - lf / 2} y={cy - 14} textAnchor="middle" fill={FRIC_COLOR} fontSize="12" fontWeight="800">F<tspan dy="3" fontSize="9">f</tspan><tspan dy="-3"> = {f} N</tspan></text>

        {/* fixed distance the box slides */}
        <g>
          <line x1={boxX} y1={groundY + 16} x2={boxX + 150} y2={groundY + 16} stroke={D_COLOR} strokeWidth="2" />
          <line x1={boxX} y1={groundY + 11} x2={boxX} y2={groundY + 21} stroke={D_COLOR} strokeWidth="2" />
          <line x1={boxX + 150} y1={groundY + 11} x2={boxX + 150} y2={groundY + 21} stroke={D_COLOR} strokeWidth="2" />
          <text x={boxX + 75} y={groundY + 33} textAnchor="middle" fill={D_COLOR} fontSize="12" fontWeight="800">d = {NW_D} m (fixed)</text>
        </g>
      </svg>

      <p className="cmp__hint-drag">Drag the tip of the red friction arrow ← to change f</p>

      <div className="wfd__legend">
        <Key color={F_COLOR}>F<sub>A</sub> = your push (positive work)</Key>
        <Key color={FRIC_COLOR}>F<sub>f</sub> = friction (negative work)</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          W<sub>net</sub> = (<span style={{ color: F_COLOR }}>F<sub>A</sub></span> − <span style={{ color: FRIC_COLOR }}>F<sub>f</sub></span>) · <span style={{ color: D_COLOR }}>d</span>
        </div>
        <div className="wfd__plug">
          W<sub>net</sub> = (<span style={{ color: F_COLOR }}>{NW_F}&nbsp;N</span> − <span style={{ color: FRIC_COLOR }}>{f}&nbsp;N</span>) × <span style={{ color: D_COLOR }}>{NW_D}&nbsp;m</span> = <strong>{wnet}&nbsp;J</strong>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L2: W_net = ΔKE ---------------- */
export function KEToolDiagram() {
  const groundY = 92
  const BOX = 36
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 150" className="wfd__svg" role="img" aria-label="A box speeds up as net work is done on it">
        <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

        {/* slow box */}
        <Box x={48} y={groundY - BOX} w={BOX} h={BOX} />
        <line x1={42} y1={groundY - BOX / 2} x2={28} y2={groundY - BOX / 2} stroke={COMP_COLOR} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <text x={48 + BOX / 2} y={groundY - BOX - 8} textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">v₀ (slow)</text>

        {/* net work arrow */}
        <line x1={120} y1={groundY - BOX / 2} x2={196} y2={groundY - BOX / 2} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon points={`${210},${groundY - BOX / 2} ${196},${groundY - BOX / 2 - 9} ${196},${groundY - BOX / 2 + 9}`} fill={F_COLOR} />
        <text x={163} y={groundY - BOX / 2 - 12} textAnchor="middle" fill={F_COLOR} fontSize="11" fontWeight="800">net work</text>

        {/* fast box with streaks */}
        <Box x={250} y={groundY - BOX} w={BOX} h={BOX} />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={246 - i * 12} y1={groundY - 8 - i * 7} x2={224 - i * 12} y2={groundY - 8 - i * 7} stroke={COMP_COLOR} strokeWidth="3" strokeLinecap="round" />
        ))}
        <text x={250 + BOX / 2} y={groundY - BOX - 8} textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">v (fast)</text>
      </svg>

      <div className="wfd__legend">
        <Key color={F_COLOR}>net work in</Key>
        <Key color={COMP_COLOR}>kinetic energy out</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          W<sub>net</sub> = ΔKE = ½mv² − ½mv₀²
        </div>
        <div className="wfd__plug">
          ½(2)(4²) − ½(2)(2²) = 16 − 4 = <strong>12&nbsp;J</strong>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L3: h = d·sin θ ---------------- */
export function RampHeightDiagram() {
  // Interactive 30° ramp. Drag the critter UP the slope and watch the distance
  // travelled (d) and the vertical height it has actually gained (h = d·sin30°)
  // grow together in real time.
  const VBW = 320
  const VBH = 176
  const DEG = 30
  const ang = (DEG * Math.PI) / 180
  const ux = Math.cos(ang)
  const uy = -Math.sin(ang)
  const DMAX = 6 // metres along the slope
  const PXM = 26 // px per metre along the slope
  const ax = 52 // angle vertex (bottom of ramp)
  const ay = 150
  const cx = ax + DMAX * PXM * ux // top of ramp
  const cy = ay + DMAX * PXM * uy
  const bx = cx // right-angle corner
  const by = ay

  const [d, setD] = useState(3)
  const [touched, setTouched] = useState(false)
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const h = Math.round(d * Math.sin(ang) * 100) / 100 // h = d·sin30°
  const px = ax + d * PXM * ux
  const py = ay + d * PXM * uy

  const setFromClient = (clientX: number, clientY: number) => {
    const svg = ref.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const lx = ((clientX - rect.left) / rect.width) * VBW
    const ly = ((clientY - rect.top) / rect.height) * VBH
    const along = ((lx - ax) * ux + (ly - ay) * uy) / PXM // metres along slope
    const snapped = Math.min(DMAX, Math.max(0, Math.round(along / 0.5) * 0.5))
    setD(snapped)
  }

  const onDown = (e: RPointer<SVGSVGElement>) => {
    dragging.current = true
    setTouched(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClient(e.clientX, e.clientY)
  }
  const onMove = (e: RPointer<SVGSVGElement>) => {
    if (dragging.current) setFromClient(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }
  const onKey = (e: RKey<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setTouched(true)
      setD((x) => Math.min(DMAX, x + 0.5))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setTouched(true)
      setD((x) => Math.max(0, x - 0.5))
    }
  }

  const r = 30
  return (
    <div className="wfd">
      <svg
        ref={ref}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="wfd__svg ramp-lab"
        role="slider"
        tabIndex={0}
        aria-label="Distance up the ramp"
        aria-valuemin={0}
        aria-valuemax={DMAX}
        aria-valuenow={d}
        aria-valuetext={`d = ${d} m, h = ${h} m`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        {/* filled triangle for reference */}
        <polygon points={`${ax},${ay} ${bx},${by} ${cx},${cy}`} fill="rgba(123,92,255,0.07)" stroke="#cfd5de" strokeWidth="1.2" />

        {/* ground */}
        <line x1={ax - 28} y1={ay} x2={bx + 26} y2={by} stroke="#9aa3ad" strokeWidth="2" strokeLinecap="round" />

        {/* full ramp "track" — the path the critter can glide along */}
        <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#c4ccd6" strokeWidth="6" strokeLinecap="round" />
        {/* distance travelled so far (orange) */}
        <line x1={ax} y1={ay} x2={px} y2={py} stroke={D_COLOR} strokeWidth="6" strokeLinecap="round" />

        {/* live vertical height h at the critter's position (green) */}
        {d > 0 && (
          <>
            <line x1={px} y1={py} x2={px} y2={ay} stroke={COMP_COLOR} strokeWidth="2.5" strokeDasharray="1 0" />
            <line x1={px - 6} y1={py} x2={px + 6} y2={py} stroke={COMP_COLOR} strokeWidth="2" />
            <text x={px + 9} y={Math.max((py + ay) / 2 + 4, py + 20)} fill={COMP_COLOR} fontSize="13" fontWeight="800">
              h = {h} m
            </text>
          </>
        )}

        {/* right-angle marker */}
        <polyline points={`${bx - 11},${by} ${bx - 11},${by - 11} ${bx},${by - 11}`} fill="none" stroke="#9aa3ad" strokeWidth="1.3" />

        {/* explicit ramp angle, placed in the open space on the right */}
        <text x={(bx + VBW) / 2 + 6} y={ay - 34} textAnchor="middle" fill="#555" fontSize="17" fontWeight="800">
          θ = 30°
        </text>

        {/* angle wedge (sampled so it's always the correct convex arc) */}
        <polyline
          points={Array.from({ length: 13 }, (_, i) => {
            const a = (DEG * i) / 12
            const rad = (a * Math.PI) / 180
            return `${(ax + r * Math.cos(rad)).toFixed(1)},${(ay - r * Math.sin(rad)).toFixed(1)}`
          }).join(' ')}
          fill="none"
          stroke="#555"
          strokeWidth="1.5"
        />
        <text
          x={ax + (r + 9) * Math.cos((DEG / 2) * (Math.PI / 180))}
          y={ay - (r + 9) * Math.sin((DEG / 2) * (Math.PI / 180)) + 4}
          fill="#555"
          fontSize="12"
          fontWeight="700"
        >
          θ
        </text>

        {/* glide hint until first interaction */}
        {!touched && (
          <g className="ramp-lab__hint" transform={`translate(${px + 16 * ux}, ${py + 16 * uy})`}>
            <g transform={`rotate(${-(DEG)})`}>
              <path d="M0 -13 L6 -6 L-6 -6 Z" fill={PE_COLOR} />
              <path d="M0 13 L6 6 L-6 6 Z" fill={PE_COLOR} />
            </g>
          </g>
        )}

        {/* the critter, gliding on the slope */}
        <g transform={`rotate(${-DEG} ${px} ${py})`} style={{ cursor: 'grab' }}>
          <ellipse cx={px - 8} cy={py} rx="4.5" ry="3.2" fill="#6d4ad1" />
          <ellipse cx={px + 8} cy={py} rx="4.5" ry="3.2" fill="#6d4ad1" />
          <ellipse cx={px} cy={py - 14} rx="16" ry="14" fill="#8b5cf6" />
          <ellipse cx={px} cy={py - 10} rx="9.5" ry="7.5" fill="#ece4fb" />
          <circle cx={px - 8.5} cy={py - 11} r="2.4" fill="#ff8fb8" opacity="0.7" />
          <circle cx={px + 8.5} cy={py - 11} r="2.4" fill="#ff8fb8" opacity="0.7" />
          <circle cx={px - 5} cy={py - 17} r="3.2" fill="#fff" />
          <circle cx={px + 5} cy={py - 17} r="3.2" fill="#fff" />
          <circle cx={px - 5} cy={py - 17} r="1.6" fill="#2b2240" />
          <circle cx={px + 5} cy={py - 17} r="1.6" fill="#2b2240" />
          <path d={`M ${px - 3} ${py - 10} Q ${px} ${py - 7} ${px + 3} ${py - 10}`} fill="none" stroke="#2b2240" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>

      <p className="ramp-lab__caption">Drag the critter up and down the ramp</p>

      <div className="wfd__legend">
        <Key color={D_COLOR}>d = distance along the ramp</Key>
        <Key color={COMP_COLOR}>h = vertical height gained</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          <span style={{ color: COMP_COLOR }}>h</span> = <span style={{ color: D_COLOR }}>d</span> · sin&nbsp;30°
        </div>
        <div className="wfd__plug">
          <span style={{ color: D_COLOR }}>d = {d}&nbsp;m</span> &nbsp;×&nbsp; sin&nbsp;30° &nbsp;=&nbsp; <span style={{ color: COMP_COLOR }}>h = {h}&nbsp;m</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L3: ΔPE_g = mg·Δh (zero is your choice) ---------------- */
export function PEZeroDiagram() {
  const boxX = 150
  const BOX = 32
  const startTop = 26
  const endTop = 86
  const startMid = startTop + BOX / 2 // 42
  const endMid = endTop + BOX / 2 // 102
  const deskY = endTop + BOX // 118 — purple zero choice (the desk)
  const floorY = 148 // blue zero choice (the floor)
  const arrowX = boxX + BOX + 28
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 168" className="wfd__svg" role="img" aria-label="Same drop measured from two reference levels">
        {/* two candidate zero levels (your choice) */}
        <line x1="30" y1={floorY} x2="330" y2={floorY} stroke={F_COLOR} strokeWidth="1.6" strokeDasharray="5 4" />
        <text x="34" y={floorY - 6} fill={F_COLOR} fontSize="10" fontWeight="700">PE = 0 (floor)</text>
        <line x1="30" y1={deskY} x2="300" y2={deskY} stroke={PE_COLOR} strokeWidth="1.6" strokeDasharray="5 4" />
        <text x="34" y={deskY - 6} fill={PE_COLOR} fontSize="10" fontWeight="700">PE = 0 (desk)</text>

        {/* faint guides tying the Δh arrow ends to each box position */}
        <line x1={boxX + BOX} y1={startMid} x2={arrowX} y2={startMid} stroke="#c4ccd6" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1={boxX + BOX} y1={endMid} x2={arrowX} y2={endMid} stroke="#c4ccd6" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* object at two positions, clearly separated */}
        <Box x={boxX} y={startTop} w={BOX} h={BOX} ghost label="start" />
        <Box x={boxX} y={endTop} w={BOX} h={BOX} label="end" />

        {/* Δh (green) — the actual drop, same no matter which zero line */}
        <line x1={arrowX} y1={startMid} x2={arrowX} y2={endMid} stroke={COMP_COLOR} strokeWidth="3" />
        <polygon points={`${arrowX},${startMid} ${arrowX - 4},${startMid + 10} ${arrowX + 4},${startMid + 10}`} fill={COMP_COLOR} />
        <polygon points={`${arrowX},${endMid} ${arrowX - 4},${endMid - 10} ${arrowX + 4},${endMid - 10}`} fill={COMP_COLOR} />
        <text x={arrowX + 9} y={(startMid + endMid) / 2 + 5} fill={COMP_COLOR} fontSize="14" fontWeight="800">Δh</text>
      </svg>

      <div className="wfd__legend">
        <Key color={COMP_COLOR}>Δh = the change in height (what matters)</Key>
        <Key color={PE_COLOR}>the zero line is your choice</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          ΔPE<sub>g</sub> = mg · <span style={{ color: COMP_COLOR }}>Δh</span>
        </div>
        <div className="wfd__plug">
          ΔPE<sub>g</sub> = (2)(9.8)(<span style={{ color: COMP_COLOR }}>1.5</span>) = <strong>29.4&nbsp;J</strong>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L3: the great trade PE_g ⇄ KE (interactive seesaw) ---------------- */
export function PEKETradeDiagram() {
  const VBW = 360
  const VBH = 184
  // downhill ramp: high at top-left, low at bottom-right
  const Tx = 56
  const Ty = 48
  const Lx = 56
  const groundY = 150
  const Rx = 200
  const Ry = groundY

  const [p, setP] = useState(0.85) // 1 = top (all PE), 0 = bottom (all KE)
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const PE = Math.round(p * 100)
  const KE = 100 - PE
  const bxp = Rx + p * (Tx - Rx)
  const byp = Ry + p * (Ty - Ry)

  // two seesaw bars on the right
  const barBase = groundY
  const barH = 100
  const peX = 250
  const keX = 298
  const barW = 30

  const setFromClient = (clientX: number, clientY: number) => {
    const svg = ref.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const lx = ((clientX - rect.left) / rect.width) * VBW
    const ly = ((clientY - rect.top) / rect.height) * VBH
    const abx = Tx - Rx
    const aby = Ty - Ry
    const t = ((lx - Rx) * abx + (ly - Ry) * aby) / (abx * abx + aby * aby)
    setP(Math.min(1, Math.max(0, Math.round(t * 20) / 20)))
  }
  const onDown = (e: RPointer<SVGSVGElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClient(e.clientX, e.clientY)
  }
  const onMove = (e: RPointer<SVGSVGElement>) => {
    if (dragging.current) setFromClient(e.clientX, e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }
  const onKey = (e: RKey<SVGSVGElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setP((x) => Math.min(1, x + 0.05))
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      setP((x) => Math.max(0, x - 0.05))
    }
  }

  const speed = 1 - p // faster near the bottom
  return (
    <div className="wfd">
      <svg
        ref={ref}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="wfd__svg ramp-lab"
        role="slider"
        tabIndex={0}
        aria-label="Position on the hill"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={PE}
        aria-valuetext={`PE ${PE}, KE ${KE}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        {/* hill */}
        <polygon points={`${Tx},${Ty} ${Lx},${groundY} ${Rx},${Ry}`} fill="rgba(123,92,255,0.07)" stroke="#cfd5de" strokeWidth="1.2" />
        <line x1="24" y1={groundY} x2={Rx + 18} y2={groundY} stroke="#9aa3ad" strokeWidth="2" strokeLinecap="round" />
        <line x1={Tx} y1={Ty} x2={Rx} y2={Ry} stroke="#c4ccd6" strokeWidth="5" strokeLinecap="round" />

        {/* speed streaks (more as it speeds up near the bottom) */}
        {speed > 0.08 &&
          [0, 1, 2].map((i) => (
            <line
              key={i}
              x1={bxp - 14 - i * 9}
              y1={byp - 4 + i * 5}
              x2={bxp - 14 - i * 9 - (8 + speed * 26)}
              y2={byp - 4 + i * 5}
              stroke={COMP_COLOR}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={0.25 + speed * 0.6}
            />
          ))}

        {/* the rolling ball */}
        <circle cx={bxp} cy={byp - 13} r="13" fill="#8b5cf6" />
        <circle cx={bxp} cy={byp - 13} r="13" fill="none" stroke="#6d4ad1" strokeWidth="1.5" />
        <circle cx={bxp - 4} cy={byp - 15} r="2.4" fill="#fff" />
        <circle cx={bxp + 4} cy={byp - 15} r="2.4" fill="#fff" />
        <circle cx={bxp - 4} cy={byp - 15} r="1.2" fill="#2b2240" />
        <circle cx={bxp + 4} cy={byp - 15} r="1.2" fill="#2b2240" />

        {/* seesaw bars: PE shrinks while KE grows; the total is constant */}
        {[
          { x: peX, label: 'PE', color: PE_COLOR, frac: p, val: PE },
          { x: keX, label: 'KE', color: COMP_COLOR, frac: 1 - p, val: KE },
        ].map((b) => (
          <g key={b.label}>
            <rect x={b.x} y={barBase - barH} width={barW} height={barH} rx="6" fill="#eef0f5" stroke="#d8dce6" strokeWidth="1" />
            <rect x={b.x} y={barBase - b.frac * barH} width={barW} height={b.frac * barH} rx="6" fill={b.color} />
            <text x={b.x + barW / 2} y={barBase + 14} textAnchor="middle" fill={b.color} fontSize="12" fontWeight="800">
              {b.label}
            </text>
          </g>
        ))}
        {/* total bracket */}
        <line x1={peX - 8} y1={barBase - barH} x2={keX + barW + 8} y2={barBase - barH} stroke="#9aa3ad" strokeWidth="1.2" strokeDasharray="3 3" />
        <text x={(peX + keX + barW) / 2} y={barBase - barH - 6} textAnchor="middle" fill="#6b7280" fontSize="10" fontWeight="700">
          total
        </text>
      </svg>

      <p className="ramp-lab__caption">Drag the ball up and down the hill</p>

      <div className="wfd__legend">
        <Key color={PE_COLOR}>PE<sub>g</sub> = stored height</Key>
        <Key color={COMP_COLOR}>KE = motion</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          <span style={{ color: PE_COLOR }}>PE<sub>g</sub></span> + <span style={{ color: COMP_COLOR }}>KE</span> = constant
        </div>
        <div className="wfd__plug">
          <span style={{ color: PE_COLOR }}>{PE}</span> + <span style={{ color: COMP_COLOR }}>{KE}</span> = <strong>100</strong>
        </div>
      </div>
    </div>
  )
}

/* ---------------- L5: where v = √(2gh) comes from ---------------- */
export function VDerivationDiagram() {
  const W = 360
  const cx = W / 2
  const CANCEL = '#e0533b' // the m that drops out — red
  // row 1 token x-positions so the strike-throughs land on the two m's
  const r1y = 60
  const m1x = 122
  const m2x = 214
  return (
    <div className="wfd">
      <svg viewBox={`0 0 ${W} 246`} className="wfd__svg" role="img" aria-label="Deriving v equals square root of 2 g h from conservation of energy">
        <text x={cx} y="22" textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="700">
          drop from rest → all PE becomes KE
        </text>

        {/* row 1: mgh = ½mv², with the two m's struck out */}
        <g fontSize="22" fontWeight="800" fill="#2b2240" textAnchor="middle">
          <text x={m1x} y={r1y} fill={CANCEL}>m</text>
          <text x={m1x + 22} y={r1y}>gh</text>
          <text x={m1x + 52} y={r1y}>=</text>
          <text x={m1x + 76} y={r1y}>½</text>
          <text x={m2x} y={r1y} fill={CANCEL}>m</text>
          <text x={m2x + 22} y={r1y}>v²</text>
        </g>
        <line x1={m1x - 9} y1={r1y - 16} x2={m1x + 9} y2={r1y + 4} stroke={CANCEL} strokeWidth="2.5" strokeLinecap="round" />
        <line x1={m2x - 9} y1={r1y - 16} x2={m2x + 9} y2={r1y + 4} stroke={CANCEL} strokeWidth="2.5" strokeLinecap="round" />
        <text x={cx} y="84" textAnchor="middle" fill={CANCEL} fontSize="11" fontWeight="700">
          same m on both sides → it cancels
        </text>

        {/* arrow */}
        <line x1={cx} y1="92" x2={cx} y2="108" stroke="#b9c2cc" strokeWidth="2" />
        <polygon points={`${cx - 5},104 ${cx + 5},104 ${cx},112`} fill="#b9c2cc" />

        {/* row 2: gh = ½v² */}
        <text x={cx} y="134" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2b2240">gh = ½v²</text>
        <text x={cx + 92} y="134" textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="700">×2</text>

        {/* arrow */}
        <line x1={cx} y1="146" x2={cx} y2="162" stroke="#b9c2cc" strokeWidth="2" />
        <polygon points={`${cx - 5},158 ${cx + 5},158 ${cx},166`} fill="#b9c2cc" />

        {/* row 3: v² = 2gh */}
        <text x={cx} y="188" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2b2240">v² = 2gh</text>
        <text x={cx + 96} y="188" textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="700">√</text>

        {/* arrow */}
        <line x1={cx} y1="200" x2={cx} y2="214" stroke="#b9c2cc" strokeWidth="2" />
        <polygon points={`${cx - 5},210 ${cx + 5},210 ${cx},218`} fill="#b9c2cc" />

        {/* result, boxed */}
        <rect x={cx - 78} y="224" width="156" height="0.1" fill="none" />
        <rect x={cx - 78} y="221" width="156" height="22" rx="8" fill="rgba(123,92,255,0.1)" stroke="#7b5cff" strokeWidth="1.5" />
        <text x={cx} y="238" textAnchor="middle" fontSize="20" fontWeight="800" fill="#5b3bd1">v = √(2gh)</text>
      </svg>

      <div className="wfd__legend">
        <Key color={CANCEL}>mass cancels — heavy or light, same speed</Key>
      </div>
    </div>
  )
}

/* ---------------- L4: PE_s → KE → PE_g (energy chain) ---------------- */
export function EnergyChainDiagram() {
  const groundY = 110
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 150" className="wfd__svg" role="img" aria-label="Spring energy becomes motion then height">
        <line x1="14" y1={groundY} x2="346" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

        {/* 1. compressed spring (PE_s) */}
        <rect x="16" y={groundY - 50} width="8" height="50" fill="#9aa3ad" />
        <path d="M24 88 l8 -8 l8 8 l8 -8 l8 8 l8 -8" fill="none" stroke="#6b7480" strokeWidth="2.5" />
        <rect x="72" y={groundY - 28} width="22" height="28" rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <text x="54" y={groundY + 18} textAnchor="middle" fill={PE_COLOR} fontSize="11" fontWeight="800">PE<Sub>s</Sub></text>

        {/* arrow */}
        <line x1="104" y1={groundY - 14} x2="128" y2={groundY - 14} stroke="#888" strokeWidth="2" />
        <polygon points={`134,${groundY - 14} 124,${groundY - 19} 124,${groundY - 9}`} fill="#888" />

        {/* 2. moving block (KE) — speed lines as a compact parallel stack hugging
             the block, so they don't fan left into the connector arrow */}
        <rect x="150" y={groundY - 28} width="22" height="28" rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={148} y1={groundY - 8 - i * 7} x2={138} y2={groundY - 8 - i * 7} stroke={COMP_COLOR} strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <text x="160" y={groundY + 18} textAnchor="middle" fill={COMP_COLOR} fontSize="11" fontWeight="800">KE</text>

        {/* arrow */}
        <line x1="196" y1={groundY - 14} x2="220" y2={groundY - 14} stroke="#888" strokeWidth="2" />
        <polygon points={`226,${groundY - 14} 216,${groundY - 19} 216,${groundY - 9}`} fill="#888" />

        {/* 3. raised block (PE_g) */}
        <line x1="244" y1={groundY} x2="338" y2={groundY - 56} stroke="#9aa3ad" strokeWidth="2" />
        <rect x="300" y={groundY - 64} width="22" height="22" rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" transform="rotate(-31 311 53)" />
        <line x1="332" y1={groundY - 50} x2="332" y2={groundY} stroke={D_COLOR} strokeWidth="2" strokeDasharray="3 3" />
        <text x="290" y={groundY + 18} textAnchor="middle" fill={D_COLOR} fontSize="11" fontWeight="800">PE<Sub>g</Sub></text>
      </svg>

      <div className="wfd__legend">
        <Key color={PE_COLOR}>stored in the spring</Key>
        <Key color={COMP_COLOR}>becomes motion</Key>
        <Key color={D_COLOR}>becomes height</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          <span style={{ color: PE_COLOR }}>PE<sub>s</sub></span> → <span style={{ color: COMP_COLOR }}>KE</span> → <span style={{ color: D_COLOR }}>PE<sub>g</sub></span>
        </div>
        <div className="wfd__plug">Total energy stays the same at every stage.</div>
      </div>
    </div>
  )
}

/* ---------------- L5: PE_g = KE + E_th (friction joins in) ---------------- */
export function FrictionEnergyDiagram() {
  const baseY = 122
  const maxH = 86
  const peH = maxH
  const keH = 52
  const thH = maxH - keH
  const barW = 54
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 156" className="wfd__svg" role="img" aria-label="Potential energy splits into kinetic energy plus heat">
        {/* PE_g bar */}
        <rect x="60" y={baseY - peH} width={barW} height={peH} rx="3" fill={PE_COLOR} />
        <text x={60 + barW / 2} y={baseY + 14} textAnchor="middle" fill={PE_COLOR} fontSize="11" fontWeight="800">PE<Sub>g</Sub></text>

        <text x="150" y={baseY - maxH / 2} textAnchor="middle" fontSize="22" fill="#555">=</text>

        {/* KE + E_th stacked */}
        <rect x="190" y={baseY - keH} width={barW} height={keH} rx="3" fill={COMP_COLOR} />
        <text x={190 + barW / 2} y={baseY + 14} textAnchor="middle" fill={COMP_COLOR} fontSize="11" fontWeight="800">KE</text>

        <text x="270" y={baseY - maxH / 2} textAnchor="middle" fontSize="22" fill="#555">+</text>

        <rect x="290" y={baseY - thH} width={barW} height={thH} rx="3" fill={FRIC_COLOR} />
        <text x={290 + barW / 2} y={baseY + 14} textAnchor="middle" fill={FRIC_COLOR} fontSize="11" fontWeight="800">E<Sub>th</Sub></text>
      </svg>

      <div className="wfd__legend">
        <Key color={PE_COLOR}>PE<sub>g</sub> = energy you started with</Key>
        <Key color={COMP_COLOR}>KE = motion</Key>
        <Key color={FRIC_COLOR}>E<sub>th</sub> = heat lost to friction</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          <span style={{ color: PE_COLOR }}>PE<sub>g</sub></span> = <span style={{ color: COMP_COLOR }}>KE</span> + <span style={{ color: FRIC_COLOR }}>E<sub>th</sub></span>
        </div>
        <div className="wfd__plug">Friction doesn't destroy energy — it turns some into heat.</div>
      </div>
    </div>
  )
}

/* ---------------- L2: braking — KE becomes heat (KE = E_th = F_f·d) ---------------- */
export function BrakingEnergyDiagram() {
  const baseY = 122
  const barH = 86
  const barW = 64
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 156" className="wfd__svg" role="img" aria-label="A moving car's kinetic energy turns entirely into heat as it brakes">
        {/* KE bar (motion, green) */}
        <rect x="64" y={baseY - barH} width={barW} height={barH} rx="3" fill={COMP_COLOR} />
        <text x={64 + barW / 2} y={baseY + 14} textAnchor="middle" fill={COMP_COLOR} fontSize="11" fontWeight="800">KE</text>

        {/* arrow: becomes */}
        <line x1="150" y1={baseY - barH / 2} x2="196" y2={baseY - barH / 2} stroke="#888" strokeWidth="2.5" />
        <polygon points={`204,${baseY - barH / 2} 192,${baseY - barH / 2 - 7} 192,${baseY - barH / 2 + 7}`} fill="#888" />
        <text x="177" y={baseY - barH / 2 - 12} textAnchor="middle" fill="#888" fontSize="10" fontWeight="700">braking</text>

        {/* E_th bar (heat, red) — same size: all of it converts */}
        <rect x="232" y={baseY - barH} width={barW} height={barH} rx="3" fill={FRIC_COLOR} />
        <text x={232 + barW / 2} y={baseY + 14} textAnchor="middle" fill={FRIC_COLOR} fontSize="11" fontWeight="800">E<tspan dy="3" fontSize="8">th</tspan></text>
      </svg>

      <div className="wfd__legend">
        <Key color={COMP_COLOR}>KE = the car's energy of motion</Key>
        <Key color={FRIC_COLOR}>E<sub>th</sub> = heat in the brakes &amp; tires</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          <span style={{ color: COMP_COLOR }}>KE</span> = <span style={{ color: FRIC_COLOR }}>E<sub>th</sub></span> = <span style={{ color: FRIC_COLOR }}>F<sub>f</sub></span> · d
        </div>
        <div className="wfd__plug">Friction does negative work until every joule of motion has become heat — then the car stops.</div>
      </div>
    </div>
  )
}

/* ---------------- L6: P = F·v ---------------- */
export function PowerSpeedDiagram() {
  const groundY = 100
  const carX = 110
  const carW = 88
  const carH = 34
  const cy = groundY - carH / 2 - 6
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 150" className="wfd__svg" role="img" aria-label="A car driving at speed v with engine force F">
        <line x1="14" y1={groundY} x2="346" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

        {/* car body */}
        <rect x={carX} y={groundY - carH - 8} width={carW} height={carH} rx="8" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <rect x={carX + 18} y={groundY - carH - 20} width={carW - 40} height="16" rx="5" fill="#566073" />
        <circle cx={carX + 20} cy={groundY - 6} r="9" fill="#20242c" />
        <circle cx={carX + carW - 20} cy={groundY - 6} r="9" fill="#20242c" />

        {/* engine force F (blue) */}
        <line x1={carX + carW + 4} y1={cy} x2={carX + carW + 70} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${carX + carW + 84},${cy} ${carX + carW + 70},${cy - 9} ${carX + carW + 70},${cy + 9}`} fill={F_COLOR} />
        <text x={carX + carW + 46} y={cy - 14} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>

        {/* velocity v (teal) */}
        <line x1={carX - 4} y1={groundY - carH - 28} x2={carX - 70} y2={groundY - carH - 28} stroke={D_COLOR} strokeWidth="6" strokeLinecap="round" />
        <polygon points={`${carX - 84},${groundY - carH - 28} ${carX - 70},${groundY - carH - 34} ${carX - 70},${groundY - carH - 22}`} fill={D_COLOR} />
        <text x={carX - 48} y={groundY - carH - 34} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">v</text>
      </svg>

      <div className="wfd__legend">
        <Key color={F_COLOR}>F = driving force (N)</Key>
        <Key color={D_COLOR}>v = speed (m/s)</Key>
      </div>

      <div className="wfd__calc">
        <div className="wfd__formula">
          P = <span style={{ color: F_COLOR }}>F</span> · <span style={{ color: D_COLOR }}>v</span>
        </div>
        <div className="wfd__plug">
          P = <span style={{ color: F_COLOR }}>500&nbsp;N</span> × <span style={{ color: D_COLOR }}>20&nbsp;m/s</span> = <strong>10,000&nbsp;W</strong>
        </div>
      </div>
    </div>
  )
}
