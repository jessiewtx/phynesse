import { useRef, type PointerEvent } from 'react'
import { Explorer } from './Explorer'

const G = 9.8
const H_MAX = 10
const H_MIN = 1
const V_MAX = Math.sqrt(2 * G * H_MAX)
const V_GOAL = Math.sqrt(2 * G * 5)

// Scene geometry (SVG user units; viewBox 0 0 220 120).
const X_RELEASE = 40
const X_BOTTOM = 150
const Y_GROUND = 104
// Release-point y at h = H_MAX. Kept low enough that the (possibly fat, arms-up)
// rider still has headroom above it inside the 0–120 viewBox.
const Y_TOP = 38

function releaseY(h: number): number {
  return Y_GROUND - (h / H_MAX) * (Y_GROUND - Y_TOP)
}

/**
 * Conservation in numbers: release a cart from height h on a frictionless track
 * and read its speed at the bottom, v = √(2gh). Drag the release point up/down to
 * set the height; the mass slider is deliberately wired to do nothing to the speed
 * (it only makes the rider fatter) — the payoff insight that speed at the bottom is
 * independent of mass (and of the path's shape).
 */
export function CoasterExplorer() {
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <Explorer
      accent="#34d399"
      unit="m/s"
      maxResult={V_MAX}
      vars={[
        { key: 'h', label: 'Release height', min: H_MIN, max: H_MAX, step: 0.5, unit: 'm', default: 5, hidden: true },
        { key: 'm', label: 'Mass', min: 1, max: 8, step: 1, unit: 'kg', default: 2 },
      ]}
      compute={(v) => Math.sqrt(2 * G * v.h)}
      goal={{
        target: V_GOAL,
        tol: 0.2,
        label: 'Goal: drag the cart to the height that gives v ≈ 9.9 m/s — then drag MASS and watch the needle.',
        hitLabel: '✓ v = √(2gh). Now drag MASS: the speed never moves — at the bottom, mass doesn’t matter!',
      }}
      formula={(v, r) => (
        <>
          v = √(2·g·h) = √(2·9.8·{v.h}) = <strong>{r.toFixed(1)} m/s</strong>
        </>
      )}
      stage={(v, r, setVar) => {
        const rY = releaseY(v.h)

        const heightFromClientY = (clientY: number) => {
          const svg = svgRef.current
          if (!svg) return
          const rect = svg.getBoundingClientRect()
          const userY = ((clientY - rect.top) / rect.height) * 120
          const raw = ((Y_GROUND - userY) / (Y_GROUND - Y_TOP)) * H_MAX
          const snapped = Math.round(raw / 0.5) * 0.5
          setVar('h', Math.max(H_MIN, Math.min(H_MAX, snapped)))
        }
        const onDown = (e: PointerEvent<SVGGElement>) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* no active pointer (e.g. synthetic event) — capture is optional */
          }
          heightFromClientY(e.clientY)
        }
        const onMove = (e: PointerEvent<SVGGElement>) => {
          if (e.buttons !== 0) heightFromClientY(e.clientY)
        }

        return (
          <div className="expl-hstage">
            <svg
              ref={svgRef}
              viewBox="0 0 220 120"
              className="expl-hstage__svg"
              style={{ touchAction: 'none' }}
            >
              {/* ground */}
              <line x1="0" y1={Y_GROUND} x2="220" y2={Y_GROUND} stroke="#c9c7c2" strokeWidth="2" />
              {/* frictionless ramp, redrawn from the current release height */}
              <path
                d={`M ${X_RELEASE} ${rY} L ${X_BOTTOM} ${Y_GROUND} L 212 ${Y_GROUND}`}
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* height marker, ending just under the cart */}
              <line
                x1={X_RELEASE}
                y1={Y_GROUND}
                x2={X_RELEASE}
                y2={rY + 12}
                stroke="#9a9a96"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* label sits inside the open wedge under the ramp, so it never clips */}
              <text
                x={X_RELEASE + 7}
                y={(rY + Y_GROUND) / 2}
                dominantBaseline="middle"
                fill="#0f766e"
                fontSize="11"
                fontWeight="700"
                fontFamily="system-ui"
              >
                h = {v.h} m
              </text>

              <CoasterCritter x={X_RELEASE} y={rY} speed={r} mass={v.m} />

              {/* draggable handle over the cart (transparent, generous hit area) */}
              <g
                onPointerDown={onDown}
                onPointerMove={onMove}
                style={{ cursor: 'grab' }}
              >
                <circle cx={X_RELEASE} cy={rY - 12} r="22" fill="transparent" />
                {/* dashed grab ring + up/down arrows hint at the tip */}
                <circle cx={X_RELEASE} cy={rY - 12} r="17" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
                <text x={X_RELEASE + 22} y={rY - 10} fill="#0f766e" fontSize="8.5" fontWeight="700" fontFamily="system-ui">
                  ↕ drag
                </text>
              </g>
            </svg>
          </div>
        )
      }}
    />
  )
}

/** The unit's purple mascot, riding the cart down the frictionless ramp and
 *  getting visibly more thrilled the faster it goes. Its body also grows/shrinks
 *  with the mass slider — a fatter rider, identical speed, driving home that mass
 *  drops out of v = √(2gh). */
function CoasterCritter({ x, y, speed, mass }: { x: number; y: number; speed: number; mass: number }) {
  const thrill = Math.min(1, speed / V_MAX)
  const excited = speed > 7
  // Body size scales with mass (1–8 kg): wider mostly, a touch taller.
  const rx = 8 + (mass - 1) * 1.05
  const ry = 9 + (mass - 1) * 0.4
  const bodyY = y - ry - 7
  const tilt = excited ? -6 : -2

  // Motion streaks trail up the ramp (behind the cart); they lengthen with speed.
  const ux = -0.827
  const uy = -0.566
  const streakLen = 5 + thrill * 16

  const cartW = rx * 2 + 6
  const wheelDx = rx * 0.6
  const armDx = rx * 0.72
  const eyeDx = rx * 0.36

  return (
    <g>
      {/* speed streaks */}
      {[0, 1, 2].map((i) => {
        const sx = x + 12 + i * 4
        const sy = y - 6 - i * 5
        return (
          <line
            key={i}
            x1={sx}
            y1={sy}
            x2={sx + ux * streakLen}
            y2={sy + uy * streakLen}
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.2 + thrill * 0.6}
          />
        )
      })}

      <g transform={`rotate(${tilt} ${x} ${bodyY})`}>
        {/* little cart */}
        <rect x={x - cartW / 2} y={y - 9} width={cartW} height="8" rx="3" fill="#475569" />
        <circle cx={x - wheelDx} cy={y - 1} r="3.4" fill="#1f2937" />
        <circle cx={x + wheelDx} cy={y - 1} r="3.4" fill="#1f2937" />

        {/* arms — up and cheering when fast, resting when slow */}
        {excited ? (
          <>
            <line x1={x - armDx} y1={bodyY} x2={x - armDx - 7} y2={bodyY - 11} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <line x1={x + armDx} y1={bodyY} x2={x + armDx + 7} y2={bodyY - 11} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <line x1={x - armDx} y1={bodyY} x2={x - armDx - 5} y2={bodyY + 5} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
            <line x1={x + armDx} y1={bodyY} x2={x + armDx + 5} y2={bodyY + 5} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* body — width tracks the mass */}
        <ellipse cx={x} cy={bodyY} rx={rx} ry={ry} fill="#8b5cf6" />
        <ellipse cx={x} cy={bodyY + 3} rx={rx * 0.58} ry={ry * 0.57} fill="#ece4fb" />
        {/* blush */}
        <circle cx={x - eyeDx - 3} cy={bodyY + 1} r="2.6" fill="#ff8fb8" opacity="0.75" />
        <circle cx={x + eyeDx + 3} cy={bodyY + 1} r="2.6" fill="#ff8fb8" opacity="0.75" />
        {/* eyes */}
        <circle cx={x - eyeDx} cy={bodyY - 3} r="2.6" fill="#fff" />
        <circle cx={x + eyeDx} cy={bodyY - 3} r="2.6" fill="#fff" />
        <circle cx={x - eyeDx} cy={bodyY - 3} r="1.3" fill="#2b2240" />
        <circle cx={x + eyeDx} cy={bodyY - 3} r="1.3" fill="#2b2240" />
        {/* mouth — open "wheee" O when fast, gentle smile when slow */}
        {excited ? (
          <ellipse cx={x} cy={bodyY + 3} rx="2.2" ry="2.8" fill="#2b2240" />
        ) : (
          <path d={`M ${x - 3} ${bodyY + 2} Q ${x} ${bodyY + 5} ${x + 3} ${bodyY + 2}`} fill="none" stroke="#2b2240" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </g>

      {excited && (
        <text x={x + rx + 10} y={bodyY - 8} fill="#34d399" fontSize="11" fontWeight="800" fontFamily="system-ui" transform={`rotate(-8 ${x + rx + 10} ${bodyY - 8})`}>
          wheee!
        </text>
      )}
    </g>
  )
}
