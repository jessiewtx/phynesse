/**
 * Schematic, symbol-labelled diagrams for the numeric problem pages. They show
 * the *setup* (forces, distances, angles) using symbols — never the answer — so
 * every problem has a picture to anchor it. The actual numbers live in the
 * "givens" chips below each prompt.
 */

const F_COLOR = '#2f7bf6'
const FRIC_COLOR = '#e0533b'
const D_COLOR = '#ef7d1a'
const H_COLOR = '#1f9d6b'
const V_COLOR = '#0e9aa7'
const X_COLOR = '#ef7d1a'

function Key({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="wfd__key" style={{ color }}>
      <span className="wfd__dot" style={{ background: color }} /> {children}
    </span>
  )
}

function Box({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      {label && (
        <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#c0c8d4" fontSize="9">
          {label}
        </text>
      )}
    </g>
  )
}

function Frame({ children, legend }: { children: React.ReactNode; legend: React.ReactNode }) {
  return (
    <div className="wfd">
      <svg viewBox="0 0 360 150" className="wfd__svg" role="img">
        {children}
      </svg>
      <div className="wfd__legend">{legend}</div>
    </div>
  )
}

/* ---------------- L1 wagon: pull at an angle ---------------- */
export function AnglePullProblem() {
  const groundY = 96
  const boxX = 70
  const BOX = 40
  const ox = boxX + BOX
  const oy = groundY - BOX / 2
  const theta = (33 * Math.PI) / 180
  const L = 80
  const tx = ox + L * Math.cos(theta)
  const ty = oy - L * Math.sin(theta)
  // arrowhead oriented along the rope direction
  const ux = Math.cos(theta)
  const uy = -Math.sin(theta)
  const aLen = 15
  const aHalf = 7
  const baseX = tx - ux * aLen
  const baseY = ty - uy * aLen
  const perpX = -uy
  const perpY = ux
  const dx = boxX + BOX / 2
  const dEnd = dx + 180
  return (
    <Frame
      legend={
        <>
          <Key color={F_COLOR}>F = pull</Key>
          <Key color="#555">θ = angle</Key>
          <Key color={D_COLOR}>d = distance</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

      {/* little red wagon full of toys */}
      <g>
        {/* toy blocks poking out of the tub */}
        <rect x="66" y="50" width="15" height="15" rx="2" fill="#f2b134" />
        <rect x="83" y="46" width="17" height="18" rx="2" fill="#1f9d6b" />
        <rect x="101" y="52" width="13" height="13" rx="2" fill="#9b5cff" />
        <circle cx="73.5" cy="57.5" r="2.4" fill="#fff" opacity="0.85" />
        {/* tub */}
        <path d="M60 62 L118 62 L114 84 L64 84 Z" fill="#cf4646" stroke="#a83232" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="60" y="60" width="58" height="5" rx="2.5" fill="#e25b5b" />
        {/* wheels */}
        <circle cx="76" cy="88" r="8" fill="#2b2f36" stroke="#8b95a8" strokeWidth="1.5" />
        <circle cx="76" cy="88" r="2.6" fill="#c0c8d4" />
        <circle cx="104" cy="88" r="8" fill="#2b2f36" stroke="#8b95a8" strokeWidth="1.5" />
        <circle cx="104" cy="88" r="2.6" fill="#c0c8d4" />
      </g>

      {/* rope tied to the wagon, with a little natural sag, running up to the kid's hands */}
      <path
        d={`M ${ox} ${oy} Q ${(ox + tx) / 2} ${(oy + ty) / 2 + 12} ${tx} ${ty}`}
        fill="none"
        stroke="#8a5a2c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* attachment loop where the rope ties onto the wagon */}
      <circle cx={ox} cy={oy} r="4.2" fill="none" stroke="#5d3f23" strokeWidth="2.4" />

      {/* the kid, leaning back into the pull, hands gripping the rope end */}
      <g stroke="#3d4450" strokeWidth="3.2" strokeLinecap="round" fill="none">
        <line x1="201" y1="58" x2="197" y2="76" />
        <line x1="197" y1="76" x2="188" y2="96" />
        <line x1="197" y1="76" x2="210" y2="95" />
        <line x1="200" y1="62" x2={tx} y2={ty + 3} />
        <line x1="203" y1="64" x2={tx + 3} y2={ty + 4} />
      </g>
      <circle cx="204" cy="50" r="7.5" fill="#3d4450" />
      {/* fist gripping the rope */}
      <circle cx={tx + 1} cy={ty + 3} r="3.4" fill="#3d4450" />

      {/* rope / pull force */}
      <line x1={ox} y1={oy} x2={baseX} y2={baseY} stroke={F_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon
        points={`${tx},${ty} ${baseX + perpX * aHalf},${baseY + perpY * aHalf} ${baseX - perpX * aHalf},${baseY - perpY * aHalf}`}
        fill={F_COLOR}
      />
      <text x={tx - 10} y={ty - 9} textAnchor="end" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>
      {/* horizontal reference (the 0° baseline the angle is measured from) */}
      <line x1={ox} y1={oy} x2={ox + 52} y2={oy} stroke="#b8bdc6" strokeWidth="1.4" strokeDasharray="4 4" />
      {/* angle */}
      <path d={`M ${ox + 26} ${oy} A 26 26 0 0 0 ${ox + 26 * Math.cos(theta)} ${oy - 26 * Math.sin(theta)}`} fill="none" stroke="#555" strokeWidth="1.4" />
      <text x={ox + 32} y={oy - 9} fill="#555" fontSize="11" fontWeight="700">θ</text>
      {/* distance */}
      <line x1={dx} y1={groundY + 14} x2={dEnd - 11} y2={groundY + 14} stroke={D_COLOR} strokeWidth="2.5" />
      <polygon points={`${dEnd},${groundY + 14} ${dEnd - 12},${groundY + 8} ${dEnd - 12},${groundY + 20}`} fill={D_COLOR} />
      <text x={dx + 90} y={groundY + 32} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
    </Frame>
  )
}

/* ---------------- basic push: force over a distance ---------------- */
export function SimplePushProblem() {
  const groundY = 92
  const boxX = 90
  const BOX = 46
  const cy = groundY - BOX / 2
  return (
    <Frame
      legend={
        <>
          <Key color={F_COLOR}>F = push</Key>
          <Key color={D_COLOR}>d = distance moved</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      <Box x={boxX} y={groundY - BOX} w={BOX} h={BOX} label="crate" />
      {/* push */}
      <line x1={boxX + BOX} y1={cy} x2={boxX + BOX + 70} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
      <polygon points={`${boxX + BOX + 84},${cy} ${boxX + BOX + 70},${cy - 9} ${boxX + BOX + 70},${cy + 9}`} fill={F_COLOR} />
      <text x={boxX + BOX + 48} y={cy - 13} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>
      {/* distance */}
      <line x1={boxX + BOX / 2} y1={groundY + 14} x2={boxX + BOX / 2 + 160} y2={groundY + 14} stroke={D_COLOR} strokeWidth="2" />
      <polygon points={`${boxX + BOX / 2 + 160},${groundY + 14} ${boxX + BOX / 2 + 150},${groundY + 10} ${boxX + BOX / 2 + 150},${groundY + 18}`} fill={D_COLOR} />
      <text x={boxX + BOX / 2 + 80} y={groundY + 32} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
    </Frame>
  )
}

/* ---------------- L1 crate: push vs friction ---------------- */
export function PushFrictionProblem() {
  const groundY = 92
  const boxX = 150
  const BOX = 46
  const cy = groundY - BOX / 2
  return (
    <Frame
      legend={
        <>
          <Key color={F_COLOR}>F = your push</Key>
          <Key color={FRIC_COLOR}>f = friction</Key>
          <Key color={D_COLOR}>d = distance</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      <Box x={boxX} y={groundY - BOX} w={BOX} h={BOX} label="crate" />
      {/* push */}
      <line x1={boxX + BOX} y1={cy} x2={boxX + BOX + 64} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
      <polygon points={`${boxX + BOX + 78},${cy} ${boxX + BOX + 64},${cy - 9} ${boxX + BOX + 64},${cy + 9}`} fill={F_COLOR} />
      <text x={boxX + BOX + 44} y={cy - 13} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>
      {/* friction */}
      <line x1={boxX} y1={cy} x2={boxX - 40} y2={cy} stroke={FRIC_COLOR} strokeWidth="7" strokeLinecap="round" />
      <polygon points={`${boxX - 54},${cy} ${boxX - 40},${cy - 9} ${boxX - 40},${cy + 9}`} fill={FRIC_COLOR} />
      <text x={boxX - 28} y={cy - 13} textAnchor="middle" fill={FRIC_COLOR} fontSize="13" fontWeight="800">f</text>
      {/* distance */}
      <line x1={boxX + BOX / 2} y1={groundY + 14} x2={boxX + BOX / 2 + 120} y2={groundY + 14} stroke={D_COLOR} strokeWidth="2" />
      <polygon points={`${boxX + BOX / 2 + 120},${groundY + 14} ${boxX + BOX / 2 + 110},${groundY + 10} ${boxX + BOX / 2 + 110},${groundY + 18}`} fill={D_COLOR} />
      <text x={boxX + BOX / 2 + 60} y={groundY + 32} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
    </Frame>
  )
}

/* ---------------- L2 sled: push that builds kinetic energy ---------------- */
export function ForceDistanceProblem() {
  const groundY = 110
  const boxX = 128
  const boxW = 54
  const boxH = 26
  const boxTop = groundY - 8 - boxH
  const cy = boxTop + boxH / 2
  return (
    <Frame
      legend={
        <>
          <Key color={F_COLOR}>F = your push</Key>
          <Key color={D_COLOR}>d = distance pushed</Key>
          <Key color={V_COLOR}>v = final speed</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      {/* sled load */}
      <rect x={boxX} y={boxTop} width={boxW} height={boxH} rx="4" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      <text x={boxX + boxW / 2} y={boxTop + boxH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#c0c8d4" fontSize="9">sled</text>
      {/* sled supports + runner with an upturned front (motion is to the right) */}
      <line x1={boxX + 8} y1={boxTop + boxH} x2={boxX + 8} y2={groundY - 4} stroke="#8b95a8" strokeWidth="2" />
      <line x1={boxX + boxW - 8} y1={boxTop + boxH} x2={boxX + boxW - 8} y2={groundY - 4} stroke="#8b95a8" strokeWidth="2" />
      <path d={`M ${boxX - 2} ${groundY - 4} H ${boxX + boxW + 6} Q ${boxX + boxW + 22} ${groundY - 4} ${boxX + boxW + 20} ${groundY - 16}`} fill="none" stroke="#9aa3b2" strokeWidth="3.5" strokeLinecap="round" />
      {/* push */}
      <line x1={boxX - 66} y1={cy} x2={boxX - 16} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
      <polygon points={`${boxX - 4},${cy} ${boxX - 18},${cy - 9} ${boxX - 18},${cy + 9}`} fill={F_COLOR} />
      <text x={boxX - 40} y={cy - 13} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>
      {/* final speed */}
      <line x1={boxX + boxW + 30} y1={cy} x2={boxX + boxW + 92} y2={cy} stroke={V_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon points={`${boxX + boxW + 106},${cy} ${boxX + boxW + 92},${cy - 8} ${boxX + boxW + 92},${cy + 8}`} fill={V_COLOR} />
      <text x={boxX + boxW + 66} y={cy - 12} textAnchor="middle" fill={V_COLOR} fontSize="13" fontWeight="800">v</text>
      {/* distance */}
      <line x1={boxX} y1={groundY + 14} x2={boxX + 160} y2={groundY + 14} stroke={D_COLOR} strokeWidth="2" />
      <polygon points={`${boxX + 160},${groundY + 14} ${boxX + 150},${groundY + 10} ${boxX + 150},${groundY + 18}`} fill={D_COLOR} />
      <text x={boxX + 80} y={groundY + 32} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
    </Frame>
  )
}

/* ---------------- L2 car braking ---------------- */
export function BrakingProblem() {
  const groundY = 104
  const carX = 70
  const carW = 78
  const carH = 30
  const cy = groundY - carH - 6
  return (
    <Frame
      legend={
        <>
          <Key color={V_COLOR}>v = speed</Key>
          <Key color={FRIC_COLOR}>f = braking friction</Key>
          <Key color={D_COLOR}>d = stopping distance</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      {/* car */}
      <rect x={carX} y={groundY - carH - 8} width={carW} height={carH} rx="7" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      <rect x={carX + 16} y={groundY - carH - 19} width={carW - 34} height="14" rx="4" fill="#566073" />
      <circle cx={carX + 18} cy={groundY - 6} r="8" fill="#20242c" />
      <circle cx={carX + carW - 18} cy={groundY - 6} r="8" fill="#20242c" />
      {/* velocity */}
      <line x1={carX + carW + 4} y1={cy} x2={carX + carW + 60} y2={cy} stroke={V_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon points={`${carX + carW + 74},${cy} ${carX + carW + 60},${cy - 8} ${carX + carW + 60},${cy + 8}`} fill={V_COLOR} />
      <text x={carX + carW + 40} y={cy - 12} textAnchor="middle" fill={V_COLOR} fontSize="13" fontWeight="800">v</text>
      {/* friction backward */}
      <line x1={carX} y1={groundY - 6} x2={carX - 36} y2={groundY - 6} stroke={FRIC_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon points={`${carX - 48},${groundY - 6} ${carX - 36},${groundY - 12} ${carX - 36},${groundY}`} fill={FRIC_COLOR} />
      <text x={carX - 26} y={groundY - 14} textAnchor="middle" fill={FRIC_COLOR} fontSize="12" fontWeight="800">f</text>
      {/* stopping distance */}
      <line x1={carX + carW / 2} y1={groundY + 14} x2={300} y2={groundY + 14} stroke={D_COLOR} strokeWidth="2" strokeDasharray="5 4" />
      <line x1={300} y1={groundY + 6} x2={300} y2={groundY + 22} stroke={D_COLOR} strokeWidth="2" />
      <text x={(carX + carW / 2 + 300) / 2} y={groundY + 32} textAnchor="middle" fill={D_COLOR} fontSize="13" fontWeight="800">d (skid to stop)</text>
    </Frame>
  )
}

/* ---------------- ramp (down-slide) ---------------- */
function RampBase({ friction }: { friction: boolean }) {
  const ax = 56
  const ay = 120
  const bx = 300
  const cy = 36
  const t = 0.46
  const blkx = bx + (ax - bx) * t
  const blky = cy + (ay - cy) * t
  return (
    <>
      <polygon points={`${ax},${ay} ${bx},${ay} ${bx},${cy}`} fill="rgba(123,92,255,0.07)" stroke="#9aa3ad" strokeWidth="1.5" />
      {/* slope length d */}
      <line x1={ax} y1={ay} x2={bx} y2={cy} stroke={D_COLOR} strokeWidth="4" />
      <text x={(ax + bx) / 2 - 14} y={(ay + cy) / 2 - 6} fill={D_COLOR} fontSize="13" fontWeight="800">d</text>
      {/* height h */}
      <line x1={bx + 14} y1={cy} x2={bx + 14} y2={ay} stroke={H_COLOR} strokeWidth="3" />
      <polygon points={`${bx + 14},${cy} ${bx + 10},${cy + 10} ${bx + 18},${cy + 10}`} fill={H_COLOR} />
      <polygon points={`${bx + 14},${ay} ${bx + 10},${ay - 10} ${bx + 18},${ay - 10}`} fill={H_COLOR} />
      <text x={bx + 22} y={(cy + ay) / 2} fill={H_COLOR} fontSize="13" fontWeight="800">h</text>
      {/* angle */}
      <text x={ax + 30} y={ay - 8} fill="#555" fontSize="11" fontWeight="700">θ</text>
      <path d={`M ${ax + 36} ${ay} A 36 36 0 0 0 ${ax + 36 * Math.cos(Math.atan2(ay - cy, bx - ax))} ${ay - 36 * Math.sin(Math.atan2(ay - cy, bx - ax))}`} fill="none" stroke="#555" strokeWidth="1.4" />
      {/* block */}
      <rect x={blkx - 13} y={blky - 22} width="26" height="18" rx="3" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" transform={`rotate(-32 ${blkx} ${blky - 11})`} />
      {friction && (
        <>
          <text x={blkx - 30} y={blky + 6} fill={FRIC_COLOR} fontSize="12" fontWeight="800">f</text>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${blkx + 6 + i * 7} ${blky - 26} q 3 -5 6 0`} fill="none" stroke={FRIC_COLOR} strokeWidth="1.4" />
          ))}
        </>
      )}
    </>
  )
}

export function RampProblem() {
  return (
    <Frame
      legend={
        <>
          <Key color={D_COLOR}>d = slope length</Key>
          <Key color={H_COLOR}>h = vertical height</Key>
          <Key color="#555">θ = ramp angle</Key>
        </>
      }
    >
      <RampBase friction={false} />
    </Frame>
  )
}

export function RampFrictionProblem() {
  return (
    <Frame
      legend={
        <>
          <Key color={D_COLOR}>d = slope length</Key>
          <Key color={H_COLOR}>h = vertical height</Key>
          <Key color={FRIC_COLOR}>f = friction (heat)</Key>
        </>
      }
    >
      <RampBase friction />
    </Frame>
  )
}

/* ---------------- L4 spring launch ---------------- */
export function SpringLaunchProblem() {
  const groundY = 104
  const wallX = 60
  const blockX = 150
  return (
    <Frame
      legend={
        <>
          <Key color="#7b5cff">k = stiffness</Key>
          <Key color={X_COLOR}>x = compression</Key>
          <Key color={V_COLOR}>v = launch speed</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      {/* wall */}
      <rect x={wallX - 12} y={groundY - 64} width="12" height="64" fill="#9aa3ad" />
      {/* spring */}
      <path d={`M ${wallX} ${groundY - 28} l 12 0 l 8 -10 l 12 20 l 12 -20 l 12 20 l 12 -20 l 8 10 l 14 0`} fill="none" stroke="#6b7480" strokeWidth="2.5" />
      {/* block */}
      <rect x={blockX} y={groundY - 44} width="34" height="44" rx="4" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      {/* compression x */}
      <line x1={wallX} y1={groundY + 14} x2={blockX} y2={groundY + 14} stroke={X_COLOR} strokeWidth="2" />
      <text x={(wallX + blockX) / 2} y={groundY + 30} textAnchor="middle" fill={X_COLOR} fontSize="13" fontWeight="800">x</text>
      {/* launch v */}
      <line x1={blockX + 42} y1={groundY - 22} x2={blockX + 104} y2={groundY - 22} stroke={V_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon points={`${blockX + 118},${groundY - 22} ${blockX + 104},${groundY - 30} ${blockX + 104},${groundY - 14}`} fill={V_COLOR} />
      <text x={blockX + 78} y={groundY - 30} textAnchor="middle" fill={V_COLOR} fontSize="13" fontWeight="800">v</text>
    </Frame>
  )
}

/* ---------------- L6 power: car at steady speed ---------------- */
export function PowerCarProblem() {
  const groundY = 104
  const carX = 110
  const carW = 90
  const carH = 34
  const cy = groundY - carH / 2 - 6
  return (
    <Frame
      legend={
        <>
          <Key color={F_COLOR}>F = drive force</Key>
          <Key color={V_COLOR}>v = constant speed</Key>
        </>
      }
    >
      <line x1="20" y1={groundY} x2="340" y2={groundY} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
      <rect x={carX} y={groundY - carH - 8} width={carW} height={carH} rx="8" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      <rect x={carX + 18} y={groundY - carH - 20} width={carW - 40} height="16" rx="5" fill="#566073" />
      <circle cx={carX + 20} cy={groundY - 6} r="9" fill="#20242c" />
      <circle cx={carX + carW - 20} cy={groundY - 6} r="9" fill="#20242c" />
      <line x1={carX + carW + 4} y1={cy} x2={carX + carW + 64} y2={cy} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
      <polygon points={`${carX + carW + 78},${cy} ${carX + carW + 64},${cy - 9} ${carX + carW + 64},${cy + 9}`} fill={F_COLOR} />
      <text x={carX + carW + 44} y={cy - 14} textAnchor="middle" fill={F_COLOR} fontSize="13" fontWeight="800">F</text>
      <line x1={carX - 4} y1={groundY - carH - 28} x2={carX - 64} y2={groundY - carH - 28} stroke={V_COLOR} strokeWidth="6" strokeLinecap="round" />
      <polygon points={`${carX - 78},${groundY - carH - 28} ${carX - 64},${groundY - carH - 34} ${carX - 64},${groundY - carH - 22}`} fill={V_COLOR} />
      <text x={carX - 44} y={groundY - carH - 34} textAnchor="middle" fill={V_COLOR} fontSize="13" fontWeight="800">v</text>
    </Frame>
  )
}

/* ---------------- L6 stairs sprint ---------------- */
export function StairsProblem() {
  const baseY = 124
  const baseX = 60
  const step = 26
  const rise = 17
  const steps = [0, 1, 2, 3, 4]
  return (
    <Frame
      legend={
        <>
          <Key color={H_COLOR}>h = vertical rise</Key>
          <Key color="#555">steady pace (no Δv)</Key>
        </>
      }
    >
      {/* stairs */}
      {steps.map((i) => (
        <rect key={i} x={baseX + i * step} y={baseY - (i + 1) * rise} width={step} height={(i + 1) * rise} fill="rgba(0,0,0,0.06)" stroke="#9aa3ad" strokeWidth="1.2" />
      ))}
      {/* person (simple) */}
      <g stroke="#3d4450" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <circle cx={baseX + 3.4 * step} cy={baseY - 4 * rise - 30} r="7" fill="#3d4450" stroke="none" />
        <line x1={baseX + 3.4 * step} y1={baseY - 4 * rise - 22} x2={baseX + 3.4 * step + 2} y2={baseY - 4 * rise - 6} />
        <line x1={baseX + 3.4 * step} y1={baseY - 4 * rise - 16} x2={baseX + 3.4 * step + 16} y2={baseY - 4 * rise - 22} />
        <line x1={baseX + 3.4 * step + 2} y1={baseY - 4 * rise - 6} x2={baseX + 3.4 * step + 14} y2={baseY - 4 * rise} />
        <line x1={baseX + 3.4 * step + 2} y1={baseY - 4 * rise - 6} x2={baseX + 3.4 * step - 8} y2={baseY - 4 * rise + 2} />
      </g>
      {/* height h */}
      <line x1={baseX + 5 * step + 18} y1={baseY} x2={baseX + 5 * step + 18} y2={baseY - 5 * rise} stroke={H_COLOR} strokeWidth="3" />
      <polygon points={`${baseX + 5 * step + 18},${baseY - 5 * rise} ${baseX + 5 * step + 14},${baseY - 5 * rise + 10} ${baseX + 5 * step + 22},${baseY - 5 * rise + 10}`} fill={H_COLOR} />
      <polygon points={`${baseX + 5 * step + 18},${baseY} ${baseX + 5 * step + 14},${baseY - 10} ${baseX + 5 * step + 22},${baseY - 10}`} fill={H_COLOR} />
      <text x={baseX + 5 * step + 26} y={baseY - 2.5 * rise} fill={H_COLOR} fontSize="13" fontWeight="800">h</text>
    </Frame>
  )
}
