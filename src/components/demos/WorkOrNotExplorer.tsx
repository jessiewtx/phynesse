import { useState } from 'react'

/**
 * Misconception-buster opener: the learner taps real situations and immediately
 * sees whether work is done and *why*. Directly attacks "effort = work" and the
 * perpendicular-force trap before any formula appears.
 */

type Force = 'right' | 'up'
type Scenario = {
  id: string
  label: string
  force: Force
  moves: 'right' | 'none'
  work: boolean
  wall?: boolean
  verdict: string
  reason: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'push',
    label: 'Push a cart (it rolls)',
    force: 'right',
    moves: 'right',
    work: true,
    verdict: 'Work IS done',
    reason: 'The person keeps up a steady, continuous push and the cart moves the same way, so energy is transferred to it. This is the only case here that does work.',
  },
  {
    id: 'hold',
    label: 'Hold a box still',
    force: 'up',
    moves: 'none',
    work: false,
    verdict: 'No work (W = 0)',
    reason: 'Your arms strain, but the box never moves: d = 0. Effort is not the same as work — with no motion, no work is done.',
  },
  {
    id: 'carry',
    label: 'Carry a box across',
    force: 'up',
    moves: 'right',
    work: false,
    verdict: 'No work (W = 0)',
    reason: 'You push UP to support it, but it moves SIDEWAYS. The force is perpendicular to the motion, so this force does no work on the box.',
  },
  {
    id: 'wall',
    label: 'Ram a box into a wall',
    force: 'right',
    moves: 'none',
    work: false,
    wall: true,
    verdict: 'No work (W = 0)',
    reason: "The wall blocks the box, so it can't move: d = 0. You can push with everything you've got — without motion, the work is still zero.",
  },
]

const F_COLOR = '#2f7bf6'
const UP_COLOR = '#1f9d6b'
const D_COLOR = '#ef7d1a'
const PERSON = '#5b6580'

const W = 360
const H = 190
const GROUND_Y = 156
const BX = 150
const BW = 46
const BH = 40

/** Stick figure leaning in to push something to the right (a steady, continuous push). */
function PushPerson({ px, handX, handY }: { px: number; handX: number; handY: number }) {
  const hipY = GROUND_Y - 22
  const shoulderX = px + 9
  const shoulderY = GROUND_Y - 44
  return (
    <g stroke={PERSON} strokeWidth="3.5" strokeLinecap="round" fill="none">
      <line x1={px} y1={hipY} x2={px - 11} y2={GROUND_Y} />
      <line x1={px} y1={hipY} x2={px + 11} y2={GROUND_Y} />
      <line x1={px} y1={hipY} x2={shoulderX} y2={shoulderY} />
      <circle cx={shoulderX + 3} cy={shoulderY - 9} r="7.5" fill={PERSON} stroke="none" />
      <line x1={shoulderX} y1={shoulderY + 1} x2={handX} y2={handY} />
    </g>
  )
}

/** Stick figure standing under a box, holding it overhead with both arms (a steady hold). */
function HoldPerson({ px, boxLeft, boxRight, boxBottom }: { px: number; boxLeft: number; boxRight: number; boxBottom: number }) {
  const hipY = GROUND_Y - 22
  const shoulderY = GROUND_Y - 44
  return (
    <g stroke={PERSON} strokeWidth="3.5" strokeLinecap="round" fill="none">
      <line x1={px} y1={hipY} x2={px - 11} y2={GROUND_Y} />
      <line x1={px} y1={hipY} x2={px + 11} y2={GROUND_Y} />
      <line x1={px} y1={hipY} x2={px} y2={shoulderY} />
      <circle cx={px} cy={shoulderY - 9} r="7.5" fill={PERSON} stroke="none" />
      <line x1={px} y1={shoulderY + 1} x2={boxLeft + 8} y2={boxBottom} />
      <line x1={px} y1={shoulderY + 1} x2={boxRight - 8} y2={boxBottom} />
    </g>
  )
}

/** Box rammed flush against a fixed wall — the wall blocks it, so it can't move. */
function WallScene({ s }: { s: Scenario }) {
  const WALLW = 26
  const wallX = W - WALLW
  const boxRight = wallX
  const boxX = wallX - BW
  const objTop = GROUND_Y - BH
  const objCy = objTop + BH / 2
  const px = boxX - 60

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="won__scene" role="img" aria-label={s.label}>
      <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

      {/* fixed wall */}
      <rect x={wallX} y={GROUND_Y - 124} width={WALLW} height={124} fill="#9aa3ad" stroke="#7a8390" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={wallX}
          y1={GROUND_Y - 108 + i * 24}
          x2={wallX + WALLW}
          y2={GROUND_Y - 124 + i * 24}
          stroke="#7a8390"
          strokeWidth="1"
        />
      ))}

      {/* the person pushing the box into the wall */}
      <PushPerson px={px} handX={boxX - 2} handY={objCy} />

      {/* the box, flush against the wall */}
      <rect x={boxX} y={objTop} width={BW} height={BH} rx="5" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      <text x={boxX + BW / 2} y={objTop + 12} textAnchor="middle" fill="#c0c8d4" fontSize="9">box</text>

      {/* force arrow — pushing right, straight into the wall */}
      <g>
        <line x1={boxX - 6} y1={objTop - 16} x2={boxRight - 2} y2={objTop - 16} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
        <polygon points={`${boxRight + 12},${objTop - 16} ${boxRight - 2},${objTop - 25} ${boxRight - 2},${objTop - 7}`} fill={F_COLOR} />
        <text x={(boxX + boxRight) / 2} y={objTop - 30} textAnchor="middle" fill={F_COLOR} fontSize="12" fontWeight="800">force</text>
      </g>

      <text x={boxX + BW / 2} y={GROUND_Y + 26} textAnchor="middle" fill="#9aa3ad" fontSize="12" fontWeight="800">✕ doesn't move</text>
    </svg>
  )
}

function Scene({ s }: { s: Scenario }) {
  if (s.wall) return <WallScene s={s} />
  const isUp = s.force === 'up'
  const objH = BH
  const objTop = isUp ? 44 : GROUND_Y - objH
  const objBottom = objTop + objH
  const objCx = BX + BW / 2
  const objCy = objTop + objH / 2
  const objRight = BX + BW
  const objLabel = s.id === 'push' ? 'cart' : 'box'
  const handY = objCy

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="won__scene" role="img" aria-label={s.label}>
      <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />

      {/* the person applying the continuous force */}
      {isUp ? (
        <HoldPerson px={objCx} boxLeft={BX} boxRight={objRight} boxBottom={objBottom} />
      ) : (
        <PushPerson px={88} handX={BX - 2} handY={handY} />
      )}

      {/* the object */}
      <rect x={BX} y={objTop} width={BW} height={objH} rx="5" fill="#3d4450" stroke="#8b95a8" strokeWidth="1.5" />
      <text x={objCx} y={objTop + 12} textAnchor="middle" fill="#c0c8d4" fontSize="9">
        {objLabel}
      </text>

      {/* force arrow */}
      {!isUp ? (
        <g>
          <line x1={objRight} y1={handY} x2={objRight + 50} y2={handY} stroke={F_COLOR} strokeWidth="7" strokeLinecap="round" />
          <polygon points={`${objRight + 64},${handY} ${objRight + 50},${handY - 9} ${objRight + 50},${handY + 9}`} fill={F_COLOR} />
          <text x={objRight + 28} y={handY - 13} textAnchor="middle" fill={F_COLOR} fontSize="12" fontWeight="800">force</text>
        </g>
      ) : (
        <g>
          <line x1={objCx} y1={objTop} x2={objCx} y2={objTop - 24} stroke={UP_COLOR} strokeWidth="7" strokeLinecap="round" />
          <polygon points={`${objCx},${objTop - 38} ${objCx - 9},${objTop - 24} ${objCx + 9},${objTop - 24}`} fill={UP_COLOR} />
          <text x={objCx + 15} y={objTop - 22} textAnchor="start" fill={UP_COLOR} fontSize="12" fontWeight="800">force</text>
        </g>
      )}

      {/* motion indicator */}
      {s.moves === 'right' ? (
        isUp ? (
          <g>
            <line x1={objRight} y1={objCy} x2={objRight + 65} y2={objCy} stroke={D_COLOR} strokeWidth="5" strokeLinecap="round" />
            <polygon points={`${objRight + 76},${objCy} ${objRight + 64},${objCy - 6} ${objRight + 64},${objCy + 6}`} fill={D_COLOR} />
            <text x={objRight + 34} y={objCy - 11} textAnchor="middle" fill={D_COLOR} fontSize="11" fontWeight="800">moves →</text>
          </g>
        ) : (
          <g>
            <line x1={objCx} y1={GROUND_Y + 18} x2={objCx + 85} y2={GROUND_Y + 18} stroke={D_COLOR} strokeWidth="5" strokeLinecap="round" />
            <polygon points={`${objCx + 96},${GROUND_Y + 18} ${objCx + 84},${GROUND_Y + 13} ${objCx + 84},${GROUND_Y + 23}`} fill={D_COLOR} />
            <text x={objCx + 40} y={GROUND_Y + 34} textAnchor="middle" fill={D_COLOR} fontSize="11" fontWeight="800">moves →</text>
          </g>
        )
      ) : isUp ? (
        <text x={objRight + 16} y={objCy + 4} textAnchor="start" fill="#9aa3ad" fontSize="12" fontWeight="800">✕ holds still</text>
      ) : (
        <text x={objCx} y={GROUND_Y + 26} textAnchor="middle" fill="#9aa3ad" fontSize="12" fontWeight="800">✕ doesn't move</text>
      )}
    </svg>
  )
}

export function WorkOrNotExplorer() {
  const [i, setI] = useState(0)
  const s = SCENARIOS[i]
  return (
    <div className="won">
      <div className="won__pills" role="tablist">
        {SCENARIOS.map((sc, idx) => (
          <button
            key={sc.id}
            type="button"
            role="tab"
            aria-selected={idx === i}
            className={`won__pill ${idx === i ? 'is-active' : ''}`}
            onClick={() => setI(idx)}
          >
            {sc.label}
          </button>
        ))}
      </div>

      <Scene s={s} />

      <div className={`won__verdict ${s.work ? 'is-work' : 'is-nowork'}`}>
        <span className="won__badge">{s.work ? '✓' : '0'}</span>
        <div>
          <strong>{s.verdict}</strong>
          <p className="won__reason">{s.reason}</p>
        </div>
      </div>
    </div>
  )
}
