import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

/**
 * Gravitational PE "hoist & drop" lab.
 *
 * A cute critter is lifted on a crane: drag it up/down to set its height, and
 * make it heavier/lighter (it visibly chonks up). The energy meter fills with
 * stored PE toward a goal — then snip the rope with scissors and watch that
 * stored PE pour into kinetic energy on the way down. The critter even gets
 * nervous up high and goes dizzy on landing.
 */

const G = 9.8
const MAX_H = 5
const MAX_M = 5
const MAX_PE = MAX_M * G * MAX_H // 245 J — full-scale for the meter

type Phase = 'idle' | 'cutting' | 'falling' | 'landed'
type Mood = 'calm' | 'nervous' | 'falling' | 'dizzy'

/** A round purple critter that fattens with mass and reacts to what's happening.
 *  Its feet sit on a fixed baseline (so it lands on the ground), and a short rope
 *  tail above its head lines up with the crane rope — and stays as a "cut" stub. */
function Critter({ mass, mood }: { mass: number; mood: Mood }) {
  const f = (mass - 1) / (MAX_M - 1) // 0 → 1
  const cx = 50
  const baseY = 90 // feet rest here, regardless of mass
  const ry = 26 + f * 8
  const rx = 18 + f * 25
  const cy = baseY - ry
  const headTop = cy - ry
  const hookY = headTop - 5

  const eyeDX = rx * 0.34
  const eyeY = cy - ry * 0.24
  const eyeR = mood === 'falling' ? 7.5 : 6.5
  const lookDown = mood === 'nervous' ? 2.2 : 0
  const pupilR = mood === 'falling' ? 3.6 : 3.1
  const mouthY = cy + ry * 0.4

  return (
    <svg viewBox="0 0 100 96" className="gpe-critter__svg" role="img" aria-label={`${mass} kg critter`}>
      {/* rope tail: bridges from the top edge down to the hook (continues the
          crane rope while hoisted, and reads as a cut stub once it's falling) */}
      <line x1={cx} y1={0} x2={cx} y2={hookY} stroke="#a8967c" strokeWidth="3" strokeDasharray="4 4" />
      <circle cx={cx} cy={hookY} r="5" fill="none" stroke="#6d4ad1" strokeWidth="3" />

      {/* little feet on the baseline */}
      <g fill="#6d4ad1">
        <ellipse cx={cx - rx * 0.42} cy={baseY} rx="6" ry="4.5" />
        <ellipse cx={cx + rx * 0.42} cy={baseY} rx="6" ry="4.5" />
      </g>

      {/* body + belly */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#8b5cf6" />
      <ellipse cx={cx} cy={cy + ry * 0.26} rx={rx * 0.62} ry={ry * 0.54} fill="#ece4fb" />

      {/* cheeks */}
      <circle cx={cx - eyeDX - 3} cy={eyeY + 7} r="4" fill="#ff8fb8" opacity="0.7" />
      <circle cx={cx + eyeDX + 3} cy={eyeY + 7} r="4" fill="#ff8fb8" opacity="0.7" />

      {/* eyes */}
      <circle cx={cx - eyeDX} cy={eyeY} r={eyeR} fill="#fff" />
      <circle cx={cx + eyeDX} cy={eyeY} r={eyeR} fill="#fff" />
      <circle cx={cx - eyeDX} cy={eyeY + lookDown} r={pupilR} fill="#2b2240" />
      <circle cx={cx + eyeDX} cy={eyeY + lookDown} r={pupilR} fill="#2b2240" />

      {/* mouth — changes with mood */}
      {mood === 'calm' && (
        <path d={`M ${cx - 6} ${mouthY} Q ${cx} ${mouthY + 5} ${cx + 6} ${mouthY}`}
          fill="none" stroke="#2b2240" strokeWidth="2" strokeLinecap="round" />
      )}
      {mood === 'nervous' && <ellipse cx={cx} cy={mouthY} rx="3.6" ry="4.4" fill="#2b2240" />}
      {mood === 'falling' && <ellipse cx={cx} cy={mouthY} rx="5" ry="6.5" fill="#2b2240" />}
      {mood === 'dizzy' && (
        <path d={`M ${cx - 6} ${mouthY} q 3 -4 6 0 q 3 4 6 0`}
          fill="none" stroke="#2b2240" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* sweat drop when nervous */}
      {mood === 'nervous' && (
        <path d={`M ${cx + eyeDX + 9} ${eyeY - 2} q 3 5 0 7 q -3 -2 0 -7 Z`} fill="#7fd4ff" />
      )}
    </svg>
  )
}

export function GravityPEExplorer() {
  const [mass, setMass] = useState(2)
  const [height, setHeight] = useState(2)
  const [phase, setPhase] = useState<Phase>('idle')
  const [fallH, setFallH] = useState(2)

  const sceneRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const rafRef = useRef<number | null>(null)
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const liveH = phase === 'idle' ? height : fallH
  const peInitial = mass * G * height
  const pe = mass * G * liveH
  const ke = Math.max(0, peInitial - pe)
  const hFrac = liveH / MAX_H

  const mood: Mood =
    phase === 'falling'
      ? 'falling'
      : phase === 'landed'
        ? 'dizzy'
        : hFrac > 0.55
          ? 'nervous'
          : 'calm'

  const clearTimers = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (cutTimer.current) clearTimeout(cutTimer.current)
    cutTimer.current = null
  }

  const setHeightFromClientY = useCallback((clientY: number) => {
    const el = sceneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const top = rect.top + 18
    const bottom = rect.bottom - 22
    const usable = bottom - top
    const ratio = Math.max(0, Math.min(1, (bottom - clientY) / usable))
    setHeight(Math.round(ratio * MAX_H * 2) / 2)
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'idle') return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus()
    setHeightFromClientY(e.clientY)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) setHeightFromClientY(e.clientY)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'idle') return
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      setHeight((h) => Math.min(MAX_H, h + 0.5))
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setHeight((h) => Math.max(0, h - 0.5))
    }
  }

  const startFall = (h0: number) => {
    setPhase('falling')
    // Real free-fall is under a second, so the energy swap is a blink. Stretch it
    // into watchable slow-motion (still accelerating like real gravity) so you can
    // see the PE bar drain down while the KE bar climbs up.
    const totalT = 1600 + h0 * 300 // ms
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / totalT
      if (t >= 1) {
        setFallH(0)
        setPhase('landed')
        rafRef.current = null
        return
      }
      setFallH(h0 * (1 - t * t)) // distance grows with t² — accelerating fall
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const cut = () => {
    if (phase !== 'idle' || height <= 0) return
    const h0 = height
    setPhase('cutting') // scissors snip, then it falls
    cutTimer.current = setTimeout(() => startFall(h0), 430)
  }

  const reset = () => {
    clearTimers()
    setPhase('idle')
    setFallH(height)
  }

  useEffect(() => () => clearTimers(), [])
  useEffect(() => {
    if (phase === 'idle') setFallH(height)
  }, [height, phase])

  const roped = phase === 'idle' || phase === 'cutting'
  const critterBottom = `calc(17px + ${hFrac} * (100% - 17px - 86px))`

  return (
    <div className="gpe">
      <div className="gpe__stage-wrap">
        <div className="gpe__ruler">
          {Array.from({ length: MAX_H + 1 }, (_, i) => MAX_H - i).map((m) => (
            <span key={m} className="gpe__tick">
              {m}m
            </span>
          ))}
        </div>

        <div className="gpe-scene" ref={sceneRef}>
          <span className="gpe-scene__sun" />
          <span className="gpe-scene__cloud gpe-scene__cloud--a" />
          <span className="gpe-scene__cloud gpe-scene__cloud--b" />

          {/* overhead crane */}
          <div className="gpe-scene__beam" />
          <div className="gpe-scene__pulley" />
          {/* short severed stub left dangling from the pulley after the cut */}
          {!roped && <span className="gpe-scene__stub" />}

          <div
            className={`gpe-critter${phase === 'idle' ? ' is-draggable' : ''} is-${mood}`}
            style={{ bottom: critterBottom }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            tabIndex={phase === 'idle' ? 0 : -1}
            role="slider"
            aria-label="Critter height"
            aria-valuemin={0}
            aria-valuemax={MAX_H}
            aria-valuenow={height}
          >
            {roped && <span className="gpe-critter__rope" />}

            {phase === 'cutting' && (
              <span className="gpe-critter__scissors">
                <span className="gpe-critter__scissors-i">✂️</span>
              </span>
            )}

            <Critter mass={mass} mood={mood} />

            {phase === 'idle' && (
              <span className="gpe-critter__cue" aria-hidden="true">
                <svg viewBox="0 0 16 30" width="14" height="26">
                  <path d="M8 1 L14 8 L2 8 Z" fill="#7c5ce0" />
                  <path d="M8 29 L14 22 L2 22 Z" fill="#7c5ce0" />
                </svg>
              </span>
            )}

            <span className="gpe-critter__tag">
              {liveH.toFixed(1)} m · {mass} kg
            </span>
          </div>

          <div className="gpe-scene__ground" />
        </div>

        <div className="gpe__meter">
          <div className="gpe__bars">
            <div className="gpe__col">
              <div className="gpe__bar">
                <div className="gpe__bar-pe" style={{ height: `${(pe / MAX_PE) * 100}%` }} />
              </div>
              <span className="gpe__bar-label gpe__bar-label--pe">PE {pe.toFixed(0)}</span>
            </div>
            <div className="gpe__col">
              <div className="gpe__bar">
                <div className="gpe__bar-ke" style={{ height: `${(ke / MAX_PE) * 100}%` }} />
              </div>
              <span className="gpe__bar-label gpe__bar-label--ke">KE {ke.toFixed(0)}</span>
            </div>
          </div>
          <span className="gpe__bar-unit">joules</span>
        </div>
      </div>

      <div className="gpe__formula">
        PE<sub>g</sub> = m·g·h = {mass} × 9.8 × {liveH.toFixed(1)} ={' '}
        <strong>{pe.toFixed(0)} J</strong>
      </div>

      <div className="gpe__controls">
        <div className="gpe__mass-ctrl">
          <span className="gpe__ctrl-label">Make it</span>
          <button
            type="button"
            onClick={() => setMass((m) => Math.max(1, m - 1))}
            disabled={phase !== 'idle'}
            aria-label="Lighter"
          >
            −
          </button>
          <span className="gpe__ctrl-val">{mass} kg</span>
          <button
            type="button"
            onClick={() => setMass((m) => Math.min(MAX_M, m + 1))}
            disabled={phase !== 'idle'}
            aria-label="Heavier"
          >
            +
          </button>
        </div>

        {phase === 'idle' ? (
          <button type="button" className="gpe__drop" onClick={cut} disabled={height <= 0}>
            ✂ Cut the rope ↓
          </button>
        ) : (
          <button
            type="button"
            className="gpe__drop gpe__drop--reset"
            onClick={reset}
            disabled={phase === 'cutting'}
          >
            ↺ Hoist it back up
          </button>
        )}
      </div>

      <p className={`gpe__goal-text${phase === 'landed' ? ' is-hit' : ''}`}>
        {phase === 'landed'
          ? 'See it? Every joule of purple PE became green KE on the way down — energy moved, it didn’t vanish.'
          : phase === 'falling'
            ? 'Falling… stored PE is pouring into kinetic energy!'
            : phase === 'cutting'
              ? 'Snip!'
              : 'Drag the critter higher and add weight to store more PE — then cut the rope and watch it all become KE.'}
      </p>
    </div>
  )
}
