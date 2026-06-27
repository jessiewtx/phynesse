import { useRef, type PointerEvent as RPointer, type KeyboardEvent as RKey } from 'react'

type SceneKind = 'distance' | 'speed' | 'height' | 'spring' | 'time'

type Props = {
  scene: SceneKind
  v: number
  base: number
  min: number
  max: number
  stepSize: number
  unit: string
  varName: string
  constLabel?: string
  disabled: boolean
  moved: boolean
  onChange: (v: number) => void
}

const W = 620
const H = 210
const GROUND_Y = 158

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

// Build a spring zigzag path from (x0,y) to (x1,y) with `coils` zigzags.
function springPath(x0: number, x1: number, y: number, coils: number, amp: number): string {
  const span = x1 - x0
  const lead = 12
  const inner = span - lead * 2
  const seg = inner / (coils * 2)
  let d = `M ${x0} ${y} L ${x0 + lead} ${y}`
  let x = x0 + lead
  for (let i = 0; i < coils * 2; i++) {
    x += seg
    const yy = i % 2 === 0 ? y - amp : y + amp
    d += ` L ${x} ${yy}`
  }
  d += ` L ${x1} ${y}`
  return d
}

export function CompareScene({
  scene,
  v,
  base,
  min,
  max,
  stepSize,
  unit,
  varName,
  constLabel,
  disabled,
  moved,
  onChange,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const snap = (raw: number) => onChange(Math.round(raw / stepSize) * stepSize)

  // each scene maps a pointer position to a value
  const toValue = (lx: number, ly: number): number => {
    switch (scene) {
      case 'distance': {
        const ORIGIN_X = 80
        const pxPerM = (W - 70 - 42 - ORIGIN_X) / max
        return (lx - ORIGIN_X) / pxPerM
      }
      case 'spring': {
        const SP_WALL = 72
        const NAT = 380
        const sc = (NAT - 80) / max
        return (SP_WALL + NAT - lx) / sc
      }
      case 'height': {
        const VTRACK = GROUND_Y - 30
        const pxPerM = VTRACK / max
        return (GROUND_Y - ly) / pxPerM
      }
      case 'time': {
        const PAD_L = 120
        const TTRACK = W - PAD_L - 70
        return min + ((lx - PAD_L) / TTRACK) * (max - min)
      }
      case 'speed':
      default: {
        const PAD_L = 80
        const STRACK = W - PAD_L - 170
        return min + ((lx - PAD_L) / STRACK) * (max - min)
      }
    }
  }

  const setFromClient = (cx: number, cy: number) => {
    const svg = ref.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const lx = ((cx - r.left) / r.width) * W
    const ly = ((cy - r.top) / r.height) * H
    snap(toValue(lx, ly))
  }

  const onPointerDown = (e: RPointer<SVGSVGElement>) => {
    if (disabled) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setFromClient(e.clientX, e.clientY)
  }
  const onPointerMove = (e: RPointer<SVGSVGElement>) => {
    if (dragging.current) setFromClient(e.clientX, e.clientY)
  }
  const onPointerUp = () => {
    dragging.current = false
  }
  const onKeyDown = (e: RKey<SVGSVGElement>) => {
    if (disabled) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      snap(v - stepSize)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      snap(v + stepSize)
    }
  }

  return (
    <div className="cmp__stage">
      <svg
        ref={ref}
        className={`cmp__scene cmp__scene--${scene}`}
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Drag to set ${varName}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={`${fmt(v)} ${unit}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {scene === 'distance' && <DistanceScene v={v} base={base} max={max} unit={unit} moved={moved} constLabel={constLabel} />}
        {scene === 'speed' && <SpeedScene v={v} base={base} min={min} max={max} unit={unit} moved={moved} />}
        {scene === 'spring' && <SpringScene v={v} base={base} max={max} unit={unit} moved={moved} />}
        {scene === 'height' && <HeightScene v={v} base={base} max={max} unit={unit} moved={moved} />}
        {scene === 'time' && <TimeScene v={v} base={base} min={min} max={max} unit={unit} moved={moved} />}
      </svg>
      <p className="cmp__hint-drag">{dragHint(scene)}</p>
    </div>
  )
}

function dragHint(scene: SceneKind): string {
  switch (scene) {
    case 'distance':
      return 'Drag the flag → the box moves with it'
    case 'speed':
      return 'Drag the block → faster means longer motion streaks'
    case 'spring':
      return 'Drag the block → squeeze the spring against the wall'
    case 'height':
      return 'Drag the critter up and down the pole'
    case 'time':
      return 'Drag the stopwatch marker to set the time'
    default:
      return 'Drag to change the value'
  }
}

/* ---------------- distance: person pushes a box, end flag ---------------- */
function DistanceScene({ v, base, max, unit, moved, constLabel }: { v: number; base: number; max: number; unit: string; moved: boolean; constLabel?: string }) {
  const ORIGIN_X = 80
  const BOX = 42
  const pxPerM = (W - 70 - BOX - ORIGIN_X) / max
  const boxX = ORIGIN_X + v * pxPerM
  const boxRight = boxX + BOX
  const baseBoxX = ORIGIN_X + base * pxPerM
  return (
    <>
      <Ground />
      <line x1={ORIGIN_X} y1={GROUND_Y - 96} x2={ORIGIN_X} y2={GROUND_Y} className="cmp__start-line" />
      <text x={ORIGIN_X} y={GROUND_Y - 102} className="cmp__start-label">start</text>

      {moved && (
        <g className="cmp__ghost">
          <rect x={baseBoxX} y={GROUND_Y - BOX} width={BOX} height={BOX} rx="6" />
          <text x={baseBoxX + BOX / 2} y={GROUND_Y - BOX - 8}>{fmt(base)} {unit}</text>
        </g>
      )}

      <Measure x1={ORIGIN_X} x2={boxX} label={`d = ${fmt(v)} ${unit}`} />

      <g className="cmp__person" transform={`translate(${boxX - 34}, 0)`}>
        <line x1="6" y1={GROUND_Y} x2="14" y2={GROUND_Y - 22} />
        <line x1="22" y1={GROUND_Y} x2="14" y2={GROUND_Y - 22} />
        <line x1="14" y1={GROUND_Y - 22} x2="16" y2={GROUND_Y - 44} />
        <circle cx="16" cy={GROUND_Y - 52} r="8" />
        <line x1="16" y1={GROUND_Y - 42} x2="34" y2={GROUND_Y - 30} />
      </g>

      <g className="cmp__force">
        <line x1={boxX - 26} y1={GROUND_Y - 58} x2={boxX - 2} y2={GROUND_Y - 58} />
        <path d={`M ${boxX - 2} ${GROUND_Y - 58} l -8 -4 l 0 8 z`} />
        <text x={boxX - 14} y={GROUND_Y - 66} className="cmp__force-label">{constLabel ? `F = ${constLabel}` : 'F'}</text>
      </g>

      <rect x={boxX} y={GROUND_Y - BOX} width={BOX} height={BOX} rx="6" className="cmp__box" />

      <g className="cmp__flag">
        <line x1={boxRight} y1={GROUND_Y} x2={boxRight} y2={GROUND_Y - 64} />
        <path d={`M ${boxRight} ${GROUND_Y - 64} L ${boxRight + 26} ${GROUND_Y - 57} L ${boxRight} ${GROUND_Y - 48} Z`} />
        <circle cx={boxRight} cy={GROUND_Y - 64} r="11" className="cmp__flag-grab" />
      </g>
    </>
  )
}

/* ---------------- speed: draggable block with motion streaks ---------------- */
function SpeedScene({ v, base, min, max, unit, moved }: { v: number; base: number; min: number; max: number; unit: string; moved: boolean }) {
  const PAD_L = 80
  const STRACK = W - PAD_L - 170
  const frac = (v - min) / (max - min)
  const baseFrac = (base - min) / (max - min)
  const CARW = 56
  const CARH = 30
  const blockX = PAD_L + frac * STRACK
  const baseBlockX = PAD_L + baseFrac * STRACK
  const cy = GROUND_Y - CARH / 2
  const streaks = [0, 1, 2, 3]
  return (
    <>
      <Ground />
      {moved && (
        <g className="cmp__ghost">
          <rect x={baseBlockX} y={GROUND_Y - CARH} width={CARW} height={CARH} rx="6" />
          <text x={baseBlockX + CARW / 2} y={GROUND_Y - CARH - 8}>{fmt(base)} {unit}</text>
        </g>
      )}

      {streaks.map((i) => {
        const len = 14 + frac * 60
        const sx = blockX - 10 - i * (len / 3 + 6)
        const sy = GROUND_Y - 8 - i * 6
        return <line key={i} className="cmp__streak" x1={sx} y1={sy} x2={sx - len} y2={sy} style={{ opacity: 0.25 + frac * 0.65 }} />
      })}

      <rect x={blockX} y={GROUND_Y - CARH} width={CARW} height={CARH} rx="7" className="cmp__box" />
      <circle cx={blockX + 14} cy={GROUND_Y} r="7" className="cmp__wheel" />
      <circle cx={blockX + CARW - 14} cy={GROUND_Y} r="7" className="cmp__wheel" />

      <g className="cmp__vel">
        <line x1={blockX + CARW + 6} y1={cy} x2={blockX + CARW + 6 + (18 + frac * 40)} y2={cy} />
        <path d={`M ${blockX + CARW + 6 + (18 + frac * 40)} ${cy} l -9 -5 l 0 10 z`} />
      </g>

      <text x={blockX + CARW / 2} y={GROUND_Y - CARH - 12} className="cmp__measure-label">v = {fmt(v)} {unit}</text>
    </>
  )
}

/* ---------------- spring: drag block to compress against a wall ---------------- */
function SpringScene({ v, base, max, unit, moved }: { v: number; base: number; max: number; unit: string; moved: boolean }) {
  const SP_WALL = 72
  const NAT = 380
  const sc = (NAT - 80) / max
  const natX = SP_WALL + NAT
  const blockX = natX - v * sc
  const baseBlockX = natX - base * sc
  const BBOX = 40
  const cy = GROUND_Y - 30
  return (
    <>
      <Ground />
      {/* wall */}
      <rect x={SP_WALL - 14} y={GROUND_Y - 92} width="14" height="92" className="cmp__wall" />
      {/* natural length line (x = 0) */}
      <line x1={natX} y1={GROUND_Y - 96} x2={natX} y2={GROUND_Y} className="cmp__nat-line" />
      <text x={natX} y={GROUND_Y - 102} className="cmp__nat-label">x = 0</text>

      {moved && <rect className="cmp__ghost-rect" x={baseBlockX} y={GROUND_Y - 56} width={BBOX} height="44" rx="6" />}

      <path className="cmp__spring" d={springPath(SP_WALL, blockX, cy, 7, 16)} />

      <rect x={blockX} y={GROUND_Y - 56} width={BBOX} height="44" rx="6" className="cmp__box" />

      {/* compression measure */}
      <Measure x1={blockX} x2={natX} label={`x = ${fmt(v)} ${unit}`} />
    </>
  )
}

/* ---------------- height: drag a critter up a pole ---------------- */
function HeightScene({ v, base, max, unit, moved }: { v: number; base: number; max: number; unit: string; moved: boolean }) {
  const TOP = 30
  const VTRACK = GROUND_Y - TOP
  const pxPerM = VTRACK / max
  const poleX = 176
  const boxBottom = GROUND_Y - v * pxPerM
  const baseBottom = GROUND_Y - base * pxPerM
  const critterCx = poleX + 46
  return (
    <>
      <Ground />
      {/* pole */}
      <line x1={poleX} y1={GROUND_Y} x2={poleX} y2={TOP} className="cmp__pole" />

      {moved && (
        <g className="cmp__ghost">
          <ellipse cx={critterCx} cy={baseBottom - 22} rx="25" ry="22" />
          <text x={critterCx} y={baseBottom - 50}>{fmt(base)} {unit}</text>
        </g>
      )}

      {/* vertical measure — label sits well left of the pole */}
      <g className="cmp__measure">
        <line x1={poleX} y1={GROUND_Y} x2={poleX} y2={boxBottom} className="cmp__measure-line" />
        <line x1={poleX - 8} y1={GROUND_Y} x2={poleX + 8} y2={GROUND_Y} className="cmp__measure-tick" />
        <line x1={poleX - 8} y1={boxBottom} x2={poleX + 8} y2={boxBottom} className="cmp__measure-tick" />
        <text x={poleX - 18} y={(GROUND_Y + boxBottom) / 2 + 5} className="cmp__measure-label cmp__measure-label--end">
          h = {fmt(v)} {unit}
        </text>
      </g>

      {/* platform ledge the critter stands on */}
      <rect x={poleX} y={boxBottom - 3} width="74" height="6" rx="3" className="cmp__ledge" />

      <MiniCritter cx={critterCx} footY={boxBottom} />
    </>
  )
}

/* a small purple critter (matches the PE explorer) standing on its feet */
function MiniCritter({ cx, footY }: { cx: number; footY: number }) {
  const rx = 25
  const ry = 22
  const cy = footY - ry
  const eyeDX = 8
  const eyeY = cy - 5
  return (
    <g className="cmp__critter">
      <ellipse cx={cx - 11} cy={footY} rx="6" ry="4" fill="#6d4ad1" />
      <ellipse cx={cx + 11} cy={footY} rx="6" ry="4" fill="#6d4ad1" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#8b5cf6" />
      <ellipse cx={cx} cy={cy + 6} rx={rx * 0.6} ry={ry * 0.55} fill="#ece4fb" />
      <circle cx={cx - eyeDX - 4} cy={eyeY + 6} r="3.4" fill="#ff8fb8" opacity="0.7" />
      <circle cx={cx + eyeDX + 4} cy={eyeY + 6} r="3.4" fill="#ff8fb8" opacity="0.7" />
      <circle cx={cx - eyeDX} cy={eyeY} r="5" fill="#fff" />
      <circle cx={cx + eyeDX} cy={eyeY} r="5" fill="#fff" />
      <circle cx={cx - eyeDX} cy={eyeY} r="2.5" fill="#2b2240" />
      <circle cx={cx + eyeDX} cy={eyeY} r="2.5" fill="#2b2240" />
      <path d={`M ${cx - 5} ${cy + 8} Q ${cx} ${cy + 12} ${cx + 5} ${cy + 8}`}
        fill="none" stroke="#2b2240" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  )
}

/* ---------------- time: stopwatch + draggable duration marker ---------------- */
function TimeScene({ v, base, min, max, unit, moved }: { v: number; base: number; min: number; max: number; unit: string; moved: boolean }) {
  const PAD_L = 120
  const TTRACK = W - PAD_L - 70
  const trackY = 120
  const frac = (v - min) / (max - min)
  const baseFrac = (base - min) / (max - min)
  const knobX = PAD_L + frac * TTRACK
  const baseKnobX = PAD_L + baseFrac * TTRACK
  // clock hand angle: full range sweeps 300deg
  const angle = -120 + frac * 300
  const cx = 56
  const ccy = trackY
  const r = 30
  const handX = cx + Math.cos((angle * Math.PI) / 180) * (r - 8)
  const handY = ccy + Math.sin((angle * Math.PI) / 180) * (r - 8)
  return (
    <>
      {/* stopwatch */}
      <circle cx={cx} cy={ccy} r={r} className="cmp__clock-face" />
      <line x1={cx} y1={ccy - r - 6} x2={cx} y2={ccy - r} className="cmp__clock-stem" />
      <line x1={cx} y1={ccy} x2={handX} y2={handY} className="cmp__clock-hand" />
      <circle cx={cx} cy={ccy} r="3" className="cmp__clock-pin" />

      {/* duration track */}
      <line x1={PAD_L} y1={trackY} x2={PAD_L + TTRACK} y2={trackY} className="cmp__track" />
      <line x1={PAD_L} y1={trackY} x2={knobX} y2={trackY} className="cmp__track-fill" />
      {moved && <circle cx={baseKnobX} cy={trackY} r="7" className="cmp__ghost-knob" />}
      <circle cx={knobX} cy={trackY} r="13" className="cmp__knob" />

      <text x={PAD_L + TTRACK / 2} y={trackY + 40} className="cmp__measure-label">Δt = {fmt(v)} {unit}</text>
      <text x={PAD_L} y={trackY - 18} className="cmp__track-end">faster</text>
      <text x={PAD_L + TTRACK} y={trackY - 18} className="cmp__track-end" textAnchor="end">slower</text>
    </>
  )
}

/* ---------------- shared sub-parts ---------------- */
function Ground() {
  return (
    <>
      <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} className="cmp__ground" />
      <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} className="cmp__ground-line" />
    </>
  )
}

function Measure({ x1, x2, label }: { x1: number; x2: number; label: string }) {
  return (
    <g className="cmp__measure">
      <line x1={x1} y1={GROUND_Y + 22} x2={x2} y2={GROUND_Y + 22} className="cmp__measure-line" />
      <line x1={x1} y1={GROUND_Y + 14} x2={x1} y2={GROUND_Y + 30} className="cmp__measure-tick" />
      <line x1={x2} y1={GROUND_Y + 14} x2={x2} y2={GROUND_Y + 30} className="cmp__measure-tick" />
      <text x={(x1 + x2) / 2} y={GROUND_Y + 44} className="cmp__measure-label">{label}</text>
    </g>
  )
}
