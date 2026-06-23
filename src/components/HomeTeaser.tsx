import { useRef, useState, type PointerEvent } from 'react'

const BARS = [
  { label: 'W', color: '#4f8cff', init: 0.62 },
  { label: 'KE', color: '#34d399', init: 0.82 },
  { label: 'U', color: '#8b5cf6', init: 0.46 },
  { label: 'P', color: '#06b6d4', init: 0.7 },
]

// In-memory so the teaser keeps its position across navigation within a session,
// but resets to defaults on a full page reload / new tab.
let liveVals: number[] = BARS.map((b) => b.init)

export function HomeTeaser() {
  const [vals, setVals] = useState(() => liveVals)
  const dragging = useRef<number | null>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const update = (next: number[]) => {
    liveVals = next
    setVals(next)
  }

  const setFromY = (i: number, clientY: number) => {
    const el = refs.current[i]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0.05, Math.min(1, (rect.bottom - clientY) / rect.height))
    update(vals.map((x, idx) => (idx === i ? ratio : x)))
  }

  const onDown = (i: number, e: PointerEvent<HTMLDivElement>) => {
    dragging.current = i
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromY(i, e.clientY)
  }
  const onMove = (i: number, e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current !== i) return
    setFromY(i, e.clientY)
  }
  const onUp = () => {
    dragging.current = null
  }

  const nudge = (i: number, delta: number) => {
    update(vals.map((x, idx) => (idx === i ? Math.max(0.05, Math.min(1, x + delta)) : x)))
  }

  return (
    <div className="home-teaser">
      <div className="home-teaser__bars">
        {BARS.map((b, i) => (
          <div key={b.label} className="home-teaser__col">
            <div
              ref={(el) => {
                refs.current[i] = el
              }}
              className="home-teaser__track"
              onPointerDown={(e) => onDown(i, e)}
              onPointerMove={(e) => onMove(i, e)}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  nudge(i, 0.06)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  nudge(i, -0.06)
                }
              }}
              tabIndex={0}
              role="slider"
              aria-label={b.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(vals[i] * 100)}
            >
              <div
                className="home-teaser__fill"
                style={{ height: `${vals[i] * 100}%`, background: b.color }}
              />
              <div
                className="home-teaser__grip"
                style={{ bottom: `calc(${vals[i] * 100}% - 5px)`, borderColor: b.color }}
              />
            </div>
            <span className="home-teaser__label">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
