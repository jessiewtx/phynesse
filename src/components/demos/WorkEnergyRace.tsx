import { useEffect, useRef, useState } from 'react'

/**
 * Work-energy theorem, shown a new way: a CONSTANT force pushes a block the whole
 * length of the track. As it travels, the work done so far (F·x) and the kinetic
 * energy it has gained (½mv²) climb together and stay exactly equal — live, frame
 * by frame, not just at the end. Pick a different mass to see the same net work
 * always become the same kinetic energy (heavier just ends up slower).
 */

type Props = { onLaunched: () => void }

const F = 20 // N, constant push
const D_M = 4 // m, track length
const MASSES = [1, 2, 4]
// Real kinematics: with a constant force over a fixed distance, travel time
// scales with √mass (t = √(2·d·m / F)). We anchor the 1 kg run at BASE_MS and
// scale up from there, so a heavier block visibly crawls across the track.
const BASE_MS = 950 // ms for the 1 kg block to cross
const durationForMass = (m: number) => BASE_MS * Math.sqrt(m)

const VW = 360
const VH = 150
const GROUND_Y = 96
const BLOCK = 40
const START_X = 70
const FINISH_X = 300
const TRAVEL = FINISH_X - BLOCK - START_X
const ARROW_LEN = 42

const F_COLOR = '#2f7bf6'
const D_COLOR = '#ef7d1a'

export function WorkEnergyRace({ onLaunched }: Props) {
  const [mass, setMass] = useState(2)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [p, setP] = useState(0)
  const raf = useRef<number | null>(null)
  const startT = useRef(0)
  const durationRef = useRef(durationForMass(2))
  const tried = useRef(false)

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])

  const x = p * D_M
  const v = Math.sqrt((2 * F * x) / mass)
  const work = F * x
  const ke = work // equal by the theorem, every frame
  const maxE = F * D_M
  const blockX = START_X + p * TRAVEL
  const finalV = Math.sqrt((2 * F * D_M) / mass)

  const tick = (now: number) => {
    const elapsed = now - startT.current
    const prog = Math.min(1, (elapsed / durationRef.current) ** 2)
    setP(prog)
    if (prog < 1) {
      raf.current = requestAnimationFrame(tick)
    } else {
      setPhase('done')
      if (!tried.current) {
        tried.current = true
        onLaunched()
      }
    }
  }

  const launch = () => {
    if (phase === 'running') return
    setPhase('running')
    setP(0)
    durationRef.current = durationForMass(mass)
    startT.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }
  const reset = () => {
    if (raf.current) cancelAnimationFrame(raf.current)
    setPhase('idle')
    setP(0)
  }
  const pickMass = (m: number) => {
    if (phase === 'running') return
    reset()
    setMass(m)
  }

  const lead =
    phase === 'running'
      ? 'The constant push keeps pouring energy in — watch the two bars rise together.'
      : phase === 'done'
        ? `W_net = ${F} × ${D_M} = ${maxE} J became kinetic energy → final speed ${finalV.toFixed(1)} m/s. Try a heavier block: same energy, slower speed.`
        : `A steady ${F} N pushes the ${mass} kg block the whole ${D_M} m. Launch it and watch work turn into kinetic energy.`

  const arrowTail = blockX - 2 - ARROW_LEN
  const arrowHead = blockX - 2
  const blockMidY = GROUND_Y - BLOCK / 2

  return (
    <div className="push-demo">
      <p className="push-demo__lead">{lead}</p>

      <div className="won__pills" role="group" aria-label="Choose the block's mass">
        {MASSES.map((m) => (
          <button
            key={m}
            type="button"
            className={`won__pill ${m === mass ? 'is-active' : ''}`}
            onClick={() => pickMass(m)}
            disabled={phase === 'running'}
          >
            {m} kg
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="push-demo__svg" style={{ userSelect: 'none' }}>
        <line x1="16" y1={GROUND_Y} x2={VW - 16} y2={GROUND_Y} stroke="rgba(0,0,0,0.14)" strokeWidth="2" />

        {/* finish line */}
        <line x1={FINISH_X} y1={GROUND_Y - 44} x2={FINISH_X} y2={GROUND_Y} stroke="#9aa3ad" strokeWidth="2" strokeDasharray="4 4" />
        <text x={FINISH_X} y={GROUND_Y - 50} textAnchor="middle" fill="#9aa3ad" fontSize="9" fontWeight="700">finish</text>

        {/* distance measure (fixed) */}
        <line x1={START_X} y1={GROUND_Y + 14} x2={START_X + TRAVEL} y2={GROUND_Y + 14} stroke={D_COLOR} strokeWidth="2" />
        <line x1={START_X} y1={GROUND_Y + 10} x2={START_X} y2={GROUND_Y + 18} stroke={D_COLOR} strokeWidth="2" />
        <line x1={START_X + TRAVEL} y1={GROUND_Y + 10} x2={START_X + TRAVEL} y2={GROUND_Y + 18} stroke={D_COLOR} strokeWidth="2" />
        <text x={START_X + TRAVEL / 2} y={GROUND_Y + 28} textAnchor="middle" fill={D_COLOR} fontSize="11" fontWeight="800">d = {D_M} m</text>

        {/* constant force arrow — same length the entire way, riding with the block */}
        <line x1={arrowTail} y1={blockMidY} x2={arrowHead - 12} y2={blockMidY} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${arrowHead},${blockMidY} ${arrowHead - 12},${blockMidY - 8} ${arrowHead - 12},${blockMidY + 8}`} fill={F_COLOR} />
        <text x={(arrowTail + arrowHead) / 2} y={blockMidY - 13} textAnchor="middle" fill={F_COLOR} fontSize="11" fontWeight="800">F = {F} N</text>

        {/* block */}
        <rect x={blockX} y={GROUND_Y - BLOCK} width={BLOCK} height={BLOCK} rx="4" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
        <text x={blockX + BLOCK / 2} y={blockMidY + 1} textAnchor="middle" dominantBaseline="middle" fill="#c0c8d4" fontSize="9">block</text>

        {/* live speed badge */}
        <text x={blockX + BLOCK / 2} y={GROUND_Y - BLOCK - 8} textAnchor="middle" fill="#3a3f4a" fontSize="11" fontWeight="800">
          v = {v.toFixed(1)} m/s
        </text>
      </svg>

      <button
        type="button"
        className="btn btn--primary push-demo__push"
        onClick={phase === 'done' ? reset : launch}
        disabled={phase === 'running'}
      >
        {phase === 'done' ? 'Run again' : 'Launch the block'}
      </button>

      <div className="push-demo__energy">
        <div className="push-demo__bar-row">
          <span className="push-demo__bar-label">W<sub className="phys-sub">net</sub></span>
          <div className="push-demo__bar-track">
            <div className="push-demo__bar-fill push-demo__bar-fill--work" style={{ width: `${(work / maxE) * 100}%` }} />
          </div>
          <span className="push-demo__bar-value">{work.toFixed(0)} J</span>
        </div>
        <div className="push-demo__bar-row">
          <span className="push-demo__bar-label">ΔKE</span>
          <div className="push-demo__bar-track">
            <div className="push-demo__bar-fill push-demo__bar-fill--ke" style={{ width: `${(ke / maxE) * 100}%` }} />
          </div>
          <span className="push-demo__bar-value">{ke.toFixed(0)} J</span>
        </div>
      </div>
    </div>
  )
}
