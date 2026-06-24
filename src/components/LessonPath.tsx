import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Lesson } from '../types/lesson'
import { isLessonUnlocked } from '../lib/lessons'
import type { StoredLessonProgress } from '../lib/progressFirestore'
import { IconLock, IconFlag, IconBolt } from './Illustrations'

const LESSON_COLORS = ['#19c3d6', '#ff4d6d', '#ffc31e', '#1ec487', '#9b5cff', '#ff8a3d']

type Props = {
  lessons: Lesson[]
  progressMap: Record<string, StoredLessonProgress>
}

type StationNode = {
  key: string
  label: string
  color: string
  status: 'done' | 'current' | 'available' | 'locked'
  to?: string
  icon: string
}

type Point = { x: number; y: number }

// Coaster coordinate space (the SVG viewBox). Everything scales with the box.
const VIEW_W = 1000
const VIEW_H = 480
const GROUND = 408
const TRACK_TOP = 64
const TRACK_BOTTOM = 296
const MARGIN_X = 112
// Hilltop/valley profile (0 = top of band, 1 = bottom) — a designed coaster ride.
const PROFILE = [0.62, 0.16, 0.0, 0.5, 0.14, 0.66, 0.36, 0.08]

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Centripetal Catmull-Rom spline (alpha = 0.5) → smooth cubic-bezier path. */
function smoothPath(pts: Point[]) {
  if (pts.length < 2) return `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`
  const alpha = 0.5
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2

    const d01 = Math.pow(dist(p0, p1), alpha)
    const d12 = Math.pow(dist(p1, p2), alpha)
    const d23 = Math.pow(dist(p2, p3), alpha)

    let b1x = p1.x
    let b1y = p1.y
    const den1 = 3 * d01 * (d01 + d12)
    if (den1 > 1e-6) {
      const k = 2 * d01 * d01 + 3 * d01 * d12 + d12 * d12
      b1x = (d01 * d01 * p2.x - d12 * d12 * p0.x + k * p1.x) / den1
      b1y = (d01 * d01 * p2.y - d12 * d12 * p0.y + k * p1.y) / den1
    }

    let b2x = p2.x
    let b2y = p2.y
    const den2 = 3 * d23 * (d23 + d12)
    if (den2 > 1e-6) {
      const k = 2 * d23 * d23 + 3 * d23 * d12 + d12 * d12
      b2x = (d23 * d23 * p1.x - d12 * d12 * p3.x + k * p2.x) / den2
      b2y = (d23 * d23 * p1.y - d12 * d12 * p3.y + k * p2.y) / den2
    }

    d += ` C ${b1x} ${b1y}, ${b2x} ${b2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function LessonPath({ lessons, progressMap }: Props) {
  const currentIndex = lessons.findIndex(
    (l) => isLessonUnlocked(l, progressMap) && progressMap[l.id]?.status !== 'completed',
  )

  const stations: StationNode[] = lessons.map((lesson, i) => {
    const complete = progressMap[lesson.id]?.status === 'completed'
    const locked = !isLessonUnlocked(lesson, progressMap)
    const color = LESSON_COLORS[i % LESSON_COLORS.length]
    const status: StationNode['status'] = complete
      ? 'done'
      : i === currentIndex
        ? 'current'
        : locked
          ? 'locked'
          : 'available'
    return {
      key: lesson.id,
      label: lesson.title,
      color,
      status,
      to: locked ? undefined : `/lesson/${lesson.id}`,
      icon: complete ? 'check' : locked ? 'lock' : String(lesson.order),
    }
  })

  stations.push({
    key: 'capstone',
    label: 'Capstone',
    color: '#9ca3af',
    status: 'locked',
    icon: 'flag',
  })

  const completedCount = lessons.filter((l) => progressMap[l.id]?.status === 'completed').length
  const n = stations.length
  const step = (VIEW_W - MARGIN_X * 2) / (n - 1)

  const stationPts: Point[] = stations.map((_, i) => ({
    x: MARGIN_X + i * step,
    y: TRACK_TOP + PROFILE[i % PROFILE.length] * (TRACK_BOTTOM - TRACK_TOP),
  }))

  // Track runs in from the ground on the left and back down on the right.
  const lead: Point = { x: 6, y: GROUND - 10 }
  const tail: Point = { x: VIEW_W - 6, y: GROUND - 10 }
  const fullPath = smoothPath([lead, ...stationPts, tail])
  const donePath =
    completedCount > 0 ? smoothPath([lead, ...stationPts.slice(0, completedCount)]) : ''

  return (
    <div className="coaster-scroll">
      <div className="coaster">
        <svg
          className="coaster__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* sky + ground */}
          <rect x="0" y={GROUND} width={VIEW_W} height={VIEW_H - GROUND} className="coaster__ground" />
          <line x1="0" y1={GROUND} x2={VIEW_W} y2={GROUND} className="coaster__ground-line" />

          {/* support trestles under each station */}
          {stationPts.map((p, i) => {
            const spread = 26
            const ties = [0.42, 0.74].map((f) => {
              const ty = p.y + (GROUND - p.y) * f
              return { x1: p.x - spread * f, x2: p.x + spread * f, y: ty }
            })
            return (
              <g key={`trestle-${i}`} className="coaster__trestle">
                <line x1={p.x - spread} y1={GROUND} x2={p.x} y2={p.y} />
                <line x1={p.x + spread} y1={GROUND} x2={p.x} y2={p.y} />
                {ties.map((t, k) => (
                  <line key={k} x1={t.x1} y1={t.y} x2={t.x2} y2={t.y} />
                ))}
              </g>
            )
          })}

          {/* track */}
          <path d={fullPath} className="coaster__rail coaster__rail--shadow" />
          <path d={fullPath} className="coaster__rail" />
          {donePath && <path d={donePath} className="coaster__rail coaster__rail--done" />}
        </svg>

        {/* stations (HTML overlay so labels + links stay crisp) */}
        {stations.map((node, i) => {
          const p = stationPts[i]
          const nodeStyle = {
            left: `${(p.x / VIEW_W) * 100}%`,
            top: `${(p.y / VIEW_H) * 100}%`,
            '--c': node.color,
          } as CSSProperties

          const iconContent =
            node.icon === 'lock' ? (
              <IconLock size={28} />
            ) : node.icon === 'flag' ? (
              <IconFlag size={28} />
            ) : node.icon === 'check' ? (
              '✓'
            ) : (
              node.icon
            )
          const circle = (
            <span className="coaster-node__circle">
              <span className="coaster-node__icon">{iconContent}</span>
            </span>
          )

          return (
            <div
              key={node.key}
              className={`coaster-node coaster-node--${node.status}${i % 2 ? ' coaster-node--low' : ''}`}
              style={nodeStyle}
            >
              {node.status === 'current' && (
                <span className="coaster-node__cart">
                  <IconBolt size={13} /> Start
                </span>
              )}
              {node.to ? (
                <Link to={node.to} className="coaster-node__hit" aria-label={node.label}>
                  {circle}
                </Link>
              ) : (
                circle
              )}
              <span className="coaster-node__label">{node.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
