import { useRef, useState, type PointerEvent } from 'react'
import { PhysicsEquation } from '../../lib/physicsText'

type Props = { onTried: () => void; onPushed?: (force: number, distance: number) => void }

const W = 340
const H = 118
const GROUND_Y = 86
const BLOCK_W = 44
const BLOCK_H = 38
const BLOCK_START_X = 96
const MIN_FORCE = 2
const MAX_FORCE = 20
const MIN_DIST = 1
const MAX_DIST = 5
const MARKER_MIN_X = BLOCK_START_X + BLOCK_W + 28
const MARKER_MAX_X = W - 24

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function distanceToMarkerX(d: number) {
  return MARKER_MIN_X + ((d - MIN_DIST) / (MAX_DIST - MIN_DIST)) * (MARKER_MAX_X - MARKER_MIN_X)
}

function markerXToDistance(x: number) {
  const ratio = (x - MARKER_MIN_X) / (MARKER_MAX_X - MARKER_MIN_X)
  return Math.round(clamp(MIN_DIST + ratio * (MAX_DIST - MIN_DIST), MIN_DIST, MAX_DIST))
}

const ARROW_TIP_X = BLOCK_START_X - 4  // fixed arrowhead tip, always at block
const BLOCK_MID_Y = GROUND_Y - BLOCK_H / 2
const MIN_ARROW_LEN = 32  // px at MIN_FORCE — enough to always look like an arrow
const MAX_ARROW_LEN = 78  // px at MAX_FORCE
const SHAFT_H = 8          // arrow shaft thickness (fixed)
const HEAD_W = 14          // arrowhead depth (fixed)
const HEAD_H = 22          // arrowhead full height (fixed)

function forceToArrowLen(f: number) {
  return MIN_ARROW_LEN + ((f - MIN_FORCE) / (MAX_FORCE - MIN_FORCE)) * (MAX_ARROW_LEN - MIN_ARROW_LEN)
}

function arrowLenToForce(len: number) {
  return Math.round(MIN_FORCE + ((len - MIN_ARROW_LEN) / (MAX_ARROW_LEN - MIN_ARROW_LEN)) * (MAX_FORCE - MIN_FORCE))
}

export function PushWorkDemo({ onTried, onPushed }: Props) {
  const [force, setForce] = useState(5)
  const [distance, setDistance] = useState(2)
  const [phase, setPhase] = useState<'idle' | 'pushing' | 'done' | 'resetting'>('idle')
  const [blockOffset, setBlockOffset] = useState(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const forceDragging = useRef(false)
  const distDragging = useRef(false)

  const work = force * distance
  const maxWork = MAX_FORCE * MAX_DIST
  const workPct = Math.min(100, (work / maxWork) * 100)

  const arrowLen = forceToArrowLen(force)
  const tailX = ARROW_TIP_X - arrowLen  // left edge of arrow (tail)
  const headBaseX = ARROW_TIP_X - HEAD_W // where shaft ends and head begins
  const markerX = distanceToMarkerX(distance)

  // Force drag — horizontal: drag tail left = more force
  const onForcePtrDown = (e: PointerEvent<SVGElement>) => {
    if (phase !== 'idle') return
    forceDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onForcePtrMove = (e: PointerEvent<SVGElement>) => {
    if (!forceDragging.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const len = clamp(ARROW_TIP_X - svgX, MIN_ARROW_LEN, MAX_ARROW_LEN)

    setForce(arrowLenToForce(len))
  }
  const onForcePtrUp = () => { forceDragging.current = false }

  // Distance drag
  const onDistPtrDown = (e: PointerEvent<SVGRectElement>) => {
    if (phase !== 'idle') return
    distDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDistPtrMove = (e: PointerEvent<SVGRectElement>) => {
    if (!distDragging.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    setDistance(markerXToDistance(svgX))
  }
  const onDistPtrUp = () => { distDragging.current = false }

  const push = () => {
    if (phase === 'pushing') return
    const targetOffset = markerX - (BLOCK_START_X + BLOCK_W)
    setPhase('pushing')
    setBlockOffset(0)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setBlockOffset(targetOffset))
    )
    setTimeout(() => {
      setPhase('done')
      onTried()
      onPushed?.(force, distance)
    }, 780)
  }

  const reset = () => {
    setPhase('resetting')
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setBlockOffset(0))
    )
    setTimeout(() => setPhase('idle'), 450)
  }

  return (
    <div className="push-demo">
      <p className="push-demo__lead">
        {phase === 'idle'
          ? 'Drag the arrow left or right to set force. Drag the flag to set distance.'
          : phase === 'pushing'
            ? 'Transferring energy…'
            : phase === 'resetting'
              ? 'Resetting…'
              : `${force} N × ${distance} m = ${work} J`}
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="push-demo__svg"
      >

        {/* ground */}
        <line x1={16} y1={GROUND_Y} x2={W - 16} y2={GROUND_Y} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />

        {/* distance span */}
        <line
          x1={BLOCK_START_X + BLOCK_W}
          y1={GROUND_Y + 9}
          x2={markerX}
          y2={GROUND_Y + 9}
          stroke="#fb923c"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={(BLOCK_START_X + BLOCK_W + markerX) / 2}
          y={GROUND_Y + 21}
          textAnchor="middle"
          fill="#fb923c"
          fontSize="10"
          fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          d = {distance} m
        </text>

        {/* block */}
        <g
          style={{
            transform: `translateX(${blockOffset}px)`,
            transition: phase === 'pushing' ? 'transform 0.75s cubic-bezier(0.25,0,0.5,1)' : phase === 'resetting' ? 'transform 0.4s ease-in' : 'none',
          }}
        >
          <rect
            x={BLOCK_START_X}
            y={GROUND_Y - BLOCK_H}
            width={BLOCK_W}
            height={BLOCK_H}
            rx="4"
            fill="#3d4450"
            stroke="#8b95a8"
            strokeWidth="1.5"
          />
          <text
            x={BLOCK_START_X + BLOCK_W / 2}
            y={BLOCK_MID_Y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#c0c8d4"
            fontSize="9"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            block
          </text>
        </g>

        {/* force arrow — draggable when idle, static when done */}
        {(phase === 'idle' || phase === 'done') && (
          <>
            <polygon
              points={[
                `${tailX},${BLOCK_MID_Y - SHAFT_H / 2}`,
                `${headBaseX},${BLOCK_MID_Y - SHAFT_H / 2}`,
                `${headBaseX},${BLOCK_MID_Y - HEAD_H / 2}`,
                `${ARROW_TIP_X},${BLOCK_MID_Y}`,
                `${headBaseX},${BLOCK_MID_Y + HEAD_H / 2}`,
                `${headBaseX},${BLOCK_MID_Y + SHAFT_H / 2}`,
                `${tailX},${BLOCK_MID_Y + SHAFT_H / 2}`,
              ].join(' ')}
              fill="#4f8cff"
              opacity={phase === 'done' ? 0.6 : 0.9}
              style={{ pointerEvents: 'none' }}
            />

            {/* grip lines — only when idle */}
            {phase === 'idle' && [0, 4, 8].map(dx => (
              <line
                key={dx}
                x1={tailX + 3 + dx}
                y1={BLOCK_MID_Y - SHAFT_H / 2 + 2}
                x2={tailX + 3 + dx}
                y2={BLOCK_MID_Y + SHAFT_H / 2 - 2}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
            ))}

            {/* drag hit area — only when idle */}
            {phase === 'idle' && (
              <rect
                x={tailX - 4}
                y={BLOCK_MID_Y - 16}
                width={arrowLen * 0.55}
                height={32}
                fill="transparent"
                style={{ cursor: 'ew-resize' }}
                onPointerDown={onForcePtrDown}
                onPointerMove={onForcePtrMove}
                onPointerUp={onForcePtrUp}
                onPointerCancel={onForcePtrUp}
              />
            )}

            <text
              x={(tailX + ARROW_TIP_X) / 2}
              y={BLOCK_MID_Y - 14}
              textAnchor="middle"
              fill="#4f8cff"
              fontSize="11"
              fontWeight="700"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              F = {force} N
            </text>
          </>
        )}

        {/* distance flag (always visible) */}
        <line
          x1={markerX}
          y1={GROUND_Y - 34}
          x2={markerX}
          y2={GROUND_Y}
          stroke="#fb923c"
          strokeWidth="2"
        />
        <polygon
          points={`${markerX},${GROUND_Y - 34} ${markerX + 18},${GROUND_Y - 27} ${markerX},${GROUND_Y - 20}`}
          fill="#fb923c"
        />
        {/* drag hit area (larger than flag for easy touch) */}
        <rect
          x={markerX - 14}
          y={GROUND_Y - 42}
          width={50}
          height={48}
          fill="transparent"
          style={{ cursor: phase === 'idle' ? 'ew-resize' : 'default' }}
          onPointerDown={onDistPtrDown}
          onPointerMove={onDistPtrMove}
          onPointerUp={onDistPtrUp}
          onPointerCancel={onDistPtrUp}
        />
      </svg>

      <button
        type="button"
        className="btn btn--primary push-demo__push"
        onClick={phase === 'done' ? reset : push}
        disabled={phase === 'pushing' || phase === 'resetting'}
      >
        {phase === 'done' ? 'Push again' : 'Push the block!'}
      </button>

      {/* energy bars */}
      <div className="push-demo__energy">
        <div className="push-demo__bar-row">
          <span className="push-demo__bar-label">
            W<sub className="phys-sub">net</sub>
          </span>
          <div className="push-demo__bar-track">
            <div
              className="push-demo__bar-fill push-demo__bar-fill--work"
              style={{ width: phase === 'idle' ? '0%' : `${workPct}%` }}
            />
          </div>
          <span className="push-demo__bar-value">{phase === 'idle' ? '—' : `${work} J`}</span>
        </div>
        <div className="push-demo__bar-row">
          <span className="push-demo__bar-label">ΔKE</span>
          <div className="push-demo__bar-track">
            <div
              className="push-demo__bar-fill push-demo__bar-fill--ke"
              style={{ width: phase === 'idle' ? '0%' : `${workPct}%` }}
            />
          </div>
          <span className="push-demo__bar-value">{phase === 'idle' ? '—' : `${work} J`}</span>
        </div>
      </div>

      {phase === 'done' && (
        <div className="push-demo__insight">
          {force} × {distance} = {work} J, so <PhysicsEquation text="W_net = ΔKE" />.
        </div>
      )}
    </div>
  )
}
