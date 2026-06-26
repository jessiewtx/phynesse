import { useEffect, useRef, useState } from 'react'

// Scene geometry (SVG viewBox units).
const VIEW_W = 320
const VIEW_H = 116
const WALL_W = 16
const BW = 38
const BH = 50
const REST_LEFT = 150 // block's left edge at natural length (x = 0)
const PX_PER_M = 86 // how many viewBox px one metre of displacement is worth
const X_COMPRESS = 1.0 // metres the block can be pushed toward the wall (x > 0)
const X_STRETCH = 1.0 // metres the block can be pulled away (x < 0)
const SPRING_Y = VIEW_H / 2 - 4

const MAX_U = 0.5 * 400 * X_COMPRESS * X_COMPRESS // for scaling the energy bars
const TARGET = 50
const TARGET_TOL = 2

/** Zig-zag spring path between two x positions. */
function springPath(xStart: number, xEnd: number, y: number, coils = 9, amp = 14) {
  const lead = 6
  const innerStart = xStart + lead
  const innerEnd = xEnd - lead
  const seg = (innerEnd - innerStart) / (coils * 2)
  let d = `M ${xStart} ${y} L ${innerStart} ${y}`
  for (let i = 0; i < coils * 2; i++) {
    const dx = innerStart + seg * (i + 1)
    const dy = y + (i % 2 === 0 ? -amp : amp)
    d += ` L ${dx.toFixed(1)} ${dy.toFixed(1)}`
  }
  d += ` L ${innerEnd} ${y} L ${xEnd} ${y}`
  return d
}

export function ElasticPEExplorer() {
  const [k, setK] = useState(200)
  const [x, setXState] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [animating, setAnimating] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number | null>(null)
  const xRef = useRef(0)
  const kRef = useRef(k)
  const totalERef = useRef(0)

  const setX = (v: number) => {
    xRef.current = v
    setXState(v)
  }
  useEffect(() => {
    kRef.current = k
  }, [k])

  const cancelAnim = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setAnimating(false)
  }
  useEffect(() => () => cancelAnim(), [])

  // Pointer → displacement x. Positive = compressed (toward wall), negative = stretched.
  const clientToX = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return 0
    const r = svg.getBoundingClientRect()
    const vx = ((clientX - r.left) / r.width) * VIEW_W
    const blockLeft = vx - BW / 2
    const disp = (REST_LEFT - blockLeft) / PX_PER_M
    return Math.max(-X_STRETCH, Math.min(X_COMPRESS, disp))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnim()
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setX(clientToX(e.clientX))
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setX(clientToX(e.clientX))
  }
  const release = () => {
    const x0 = xRef.current
    if (Math.abs(x0) < 0.03) {
      setX(0)
      return
    }
    const stiffness = kRef.current
    totalERef.current = 0.5 * stiffness * x0 * x0
    setAnimating(true)
    const omega = Math.sqrt(stiffness) * 0.58
    const damp = 1.7
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const amp = x0 * Math.exp(-damp * t)
      if (Math.abs(amp) < 0.012) {
        setX(0)
        setAnimating(false)
        rafRef.current = null
        return
      }
      const xt = amp * Math.cos(omega * t)
      setX(Math.max(-X_STRETCH, Math.min(X_COMPRESS, xt)))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    release()
  }

  const blockLeft = REST_LEFT - x * PX_PER_M
  const u = 0.5 * k * x * x
  const totalE = animating ? totalERef.current : u
  const ke = Math.max(0, totalE - u)
  const loaded = Math.abs(x) > 0.03
  const mode = x > 0.03 ? 'compressed' : x < -0.03 ? 'stretched' : 'at rest'
  const hit = !animating && Math.abs(u - TARGET) <= TARGET_TOL

  return (
    <div className="ke-explorer">
      <div className="spring-lab">
        <svg
          ref={svgRef}
          className="spring-lab__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* floor */}
          <line x1="0" y1={VIEW_H - 8} x2={VIEW_W} y2={VIEW_H - 8} className="spring-lab__floor" />
          {/* wall */}
          <rect x="0" y="6" width={WALL_W} height={VIEW_H - 14} rx="3" className="spring-lab__wall" />

          {/* natural-length reference: x = 0 (dashed) */}
          <line
            x1={REST_LEFT}
            y1="10"
            x2={REST_LEFT}
            y2={VIEW_H - 8}
            className="spring-lab__zero"
          />
          <text x={REST_LEFT} y={VIEW_H - 1} className="spring-lab__zero-label">
            x = 0
          </text>

          {/* spring */}
          <path d={springPath(WALL_W, blockLeft, SPRING_Y)} className="spring-lab__spring" />
          {/* block (draggable) */}
          <g
            className={`spring-lab__block ${dragging ? 'is-grabbing' : ''}`}
            onPointerDown={onPointerDown}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <rect x={blockLeft} y={(VIEW_H - BH) / 2 - 4} width={BW} height={BH} rx="6" />
            {/* grip lines */}
            <line x1={blockLeft + BW / 2 - 5} y1={SPRING_Y - 9} x2={blockLeft + BW / 2 - 5} y2={SPRING_Y + 9} />
            <line x1={blockLeft + BW / 2} y1={SPRING_Y - 9} x2={blockLeft + BW / 2} y2={SPRING_Y + 9} />
            <line x1={blockLeft + BW / 2 + 5} y1={SPRING_Y - 9} x2={blockLeft + BW / 2 + 5} y2={SPRING_Y + 9} />
          </g>
        </svg>

        {!loaded && !animating && (
          <p className="spring-lab__hint">← push the block in, or pull it out →, then let go</p>
        )}
        {loaded && !animating && (
          <p className="spring-lab__hint">
            {mode} {Math.abs(x).toFixed(2)} m from natural length
          </p>
        )}
      </div>

      {/* Energy split */}
      <div className="spring-energy">
        <div className="spring-energy__row">
          <span className="spring-energy__tag">PE<sub>s</sub></span>
          <div className="spring-energy__track">
            <div className="spring-energy__fill spring-energy__fill--pe" style={{ width: `${(u / MAX_U) * 100}%` }} />
          </div>
          <span className="spring-energy__val">{u.toFixed(1)} J</span>
        </div>
        <div className="spring-energy__row">
          <span className="spring-energy__tag">KE</span>
          <div className="spring-energy__track">
            <div className="spring-energy__fill spring-energy__fill--ke" style={{ width: `${(ke / MAX_U) * 100}%` }} />
          </div>
          <span className="spring-energy__val">{ke.toFixed(1)} J</span>
        </div>
      </div>

      <div className="ke-explorer__formula">
        PE<sub>s</sub> = ½·k·<span className="ke-explorer__sq">x²</span> = ½ × {k} × {(x * x).toFixed(2)} ={' '}
        <strong>{u.toFixed(1)} J</strong>
      </div>

      <div className="ke-explorer__controls">
        <label className="ke-explorer__row">
          <span>Stiffness (k)</span>
          <input
            type="range"
            min={50}
            max={400}
            step={50}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          />
          <span className="ke-explorer__val">k = {k} N/m</span>
        </label>
        <button
          type="button"
          className="btn btn--primary btn--sm spring-lab__launch"
          onClick={release}
          disabled={!loaded || animating}
        >
          Release & launch →
        </button>
      </div>

      <p className={`ke-explorer__goal ${hit ? 'ke-explorer__goal--hit' : ''}`}>
        {hit
          ? '✓ Nice — stored energy ≈ 50 J. Notice a small extra pull adds a lot of energy (x is squared).'
          : 'Goal: load the spring until the stored energy ≈ 50 J — then release and watch it become motion.'}
      </p>
    </div>
  )
}
