import { useCallback, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'

const TOTAL = 100

// Ramp surface endpoints, in percent of the stage (top-left = high, bottom = low).
const TOP = { x: 8, y: 18 }
const BOT = { x: 80, y: 88 }

export function ConservationExplorer() {
  // frac: 0 = released at the top, 1 = all the way down.
  const [frac, setFrac] = useState(0)
  const rampRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const ke = TOTAL * frac
  const u = TOTAL - ke
  const balanced = Math.abs(ke - u) <= 4

  const ballX = TOP.x + (BOT.x - TOP.x) * frac
  const ballY = TOP.y + (BOT.y - TOP.y) * frac

  const updateFromClientX = useCallback((clientX: number) => {
    const el = rampRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xPct = ((clientX - rect.left) / rect.width) * 100
    const f = (xPct - TOP.x) / (BOT.x - TOP.x)
    setFrac(Math.max(0, Math.min(1, f)))
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    updateFromClientX(e.clientX)
  }
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      setFrac((f) => Math.min(1, f + 0.05))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      setFrac((f) => Math.max(0, f - 0.05))
      e.preventDefault()
    }
  }

  return (
    <div className="ke-explorer">
      <div className="cons-expl__stage">
        <div
          ref={rampRef}
          className={`cons-expl__ramp${dragging.current ? ' is-dragging' : ''}`}
          role="slider"
          tabIndex={0}
          aria-label="Ball position on the ramp"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(frac * 100)}
          aria-valuetext={`${Math.round(frac * 100)}% of the way down`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <svg className="cons-expl__scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {/* solid ramp wedge: high at top-left, sloping down to the right */}
            <polygon
              points={`${TOP.x},${TOP.y} ${BOT.x},${BOT.y} ${TOP.x},${BOT.y}`}
              fill="#e9ebf6"
              stroke="#c7cbe0"
              strokeWidth="0.6"
            />
            {/* ground line */}
            <line x1="2" y1={BOT.y} x2="98" y2={BOT.y} stroke="#c7cbe0" strokeWidth="0.8" />
            {/* the slope surface the ball rolls on */}
            <line
              x1={TOP.x}
              y1={TOP.y}
              x2={BOT.x}
              y2={BOT.y}
              stroke="#9aa0c0"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>

          <div
            className="cons-expl__ball"
            style={{ left: `${ballX}%`, top: `${ballY}%` }}
          />

          {frac === 0 && <span className="cons-expl__grab-hint">drag me ↓</span>}
        </div>

        <div className="cons-expl__bars">
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--u" style={{ height: `${u}%` }} />
            <span className="cons-expl__bar-cap">PE {u.toFixed(0)}</span>
          </div>
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--ke" style={{ height: `${ke}%` }} />
            <span className="cons-expl__bar-cap">KE {ke.toFixed(0)}</span>
          </div>
          <div className="cons-expl__bar">
            <div className="cons-expl__bar-fill cons-expl__bar-fill--total" style={{ height: '100%' }} />
            <span className="cons-expl__bar-cap">total {TOTAL}</span>
          </div>
        </div>
      </div>

      <div className="ke-explorer__formula">
        KE + PE = {ke.toFixed(0)} + {u.toFixed(0)} = <strong>{TOTAL} J</strong> (always)
      </div>

      <p className={`ke-explorer__goal ${balanced ? 'ke-explorer__goal--hit' : ''}`}>
        {balanced
          ? '✓ Halfway down — KE and PE are equal. The total never budged.'
          : 'Drag the ball down the ramp. Watch PE turn into KE — but the total stays fixed. Can you find where KE = PE?'}
      </p>
    </div>
  )
}
