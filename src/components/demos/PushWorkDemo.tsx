import { useRef, useState, type PointerEvent } from 'react'
import { PhysicsEquation } from '../../lib/physicsText'

type Props = { onTried: () => void }

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

const HANDLE_X = 22
const ARROW_TIP_X = BLOCK_START_X - 5
const BLOCK_MID_Y = GROUND_Y - BLOCK_H / 2

export function PushWorkDemo({ onTried }: Props) {
  const [force, setForce] = useState(8)
  const [distance, setDistance] = useState(2)
  const [phase, setPhase] = useState<'idle' | 'pushing' | 'done'>('idle')
  const [blockOffset, setBlockOffset] = useState(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const forceDragging = useRef(false)
  const distDragging = useRef(false)
  const forceAnchorY = useRef(0)
  const forceAnchorVal = useRef(8)

  const work = force * distance
  const maxWork = MAX_FORCE * MAX_DIST
  const workPct = Math.min(100, (work / maxWork) * 100)

  const forceRatio = (force - MIN_FORCE) / (MAX_FORCE - MIN_FORCE)
  const arrowStrokeW = 2.5 + forceRatio * 4.5
  const markerX = distanceToMarkerX(distance)

  // Force drag
  const onForcePtrDown = (e: PointerEvent<SVGCircleElement>) => {
    if (phase !== 'idle') return
    forceDragging.current = true
    forceAnchorY.current = e.clientY
    forceAnchorVal.current = force
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onForcePtrMove = (e: PointerEvent<SVGCircleElement>) => {
    if (!forceDragging.current) return
    const dy = forceAnchorY.current - e.clientY
    const dF = (dy / 55) * (MAX_FORCE - MIN_FORCE)
    setForce(Math.round(clamp(forceAnchorVal.current + dF, MIN_FORCE, MAX_FORCE)))
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
    }, 780)
  }

  const reset = () => {
    setBlockOffset(0)
    setPhase('idle')
  }

  return (
    <div className="push-demo">
      <p className="push-demo__lead">
        {phase === 'idle'
          ? 'Drag the handle ↕ to set force · drag the flag ↔ to set distance'
          : phase === 'pushing'
            ? 'Transferring energy…'
            : `${force} N × ${distance} m = ${work} J`}
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="push-demo__svg"
      >
        <defs>
          <marker id="arrowF" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#4f8cff" />
          </marker>
        </defs>

        {/* ground */}
        <line x1={16} y1={GROUND_Y} x2={W - 16} y2={GROUND_Y} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />

        {/* distance span */}
        <line
          x1={BLOCK_START_X + BLOCK_W}
          y1={GROUND_Y + 9}
          x2={markerX}
          y2={GROUND_Y + 9}
          stroke="#34d399"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={(BLOCK_START_X + BLOCK_W + markerX) / 2}
          y={GROUND_Y + 21}
          textAnchor="middle"
          fill="#34d399"
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
            transition: phase === 'pushing' ? 'transform 0.75s cubic-bezier(0.25,0,0.5,1)' : 'none',
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

        {/* force arrow + drag handle (only while idle) */}
        {phase === 'idle' && (
          <>
            <line
              x1={HANDLE_X + 14}
              y1={BLOCK_MID_Y}
              x2={ARROW_TIP_X}
              y2={BLOCK_MID_Y}
              stroke="#4f8cff"
              strokeWidth={arrowStrokeW}
              strokeLinecap="round"
              markerEnd="url(#arrowF)"
            />

            {/* drag handle circle */}
            <circle
              cx={HANDLE_X + 14}
              cy={BLOCK_MID_Y}
              r={15}
              fill="#4f8cff"
              opacity={0.88}
              style={{ cursor: 'ns-resize' }}
              onPointerDown={onForcePtrDown}
              onPointerMove={onForcePtrMove}
              onPointerUp={onForcePtrUp}
              onPointerCancel={onForcePtrUp}
            />
            {/* up/down hint glyphs */}
            <text
              x={HANDLE_X + 14}
              y={BLOCK_MID_Y - 3}
              textAnchor="middle"
              dominantBaseline="auto"
              fill="white"
              fontSize="9"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >▲</text>
            <text
              x={HANDLE_X + 14}
              y={BLOCK_MID_Y + 10}
              textAnchor="middle"
              dominantBaseline="auto"
              fill="white"
              fontSize="9"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >▼</text>

            {/* force label */}
            <text
              x={(HANDLE_X + 14 + ARROW_TIP_X) / 2}
              y={BLOCK_MID_Y - 11}
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
          stroke="#34d399"
          strokeWidth="2"
        />
        <polygon
          points={`${markerX},${GROUND_Y - 34} ${markerX + 18},${GROUND_Y - 27} ${markerX},${GROUND_Y - 20}`}
          fill="#34d399"
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
        disabled={phase === 'pushing'}
      >
        {phase === 'done' ? 'Reset' : 'Push the block!'}
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
