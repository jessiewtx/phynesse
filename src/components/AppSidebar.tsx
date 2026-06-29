import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons } from '../lib/lessons'
import { useLearnerData } from '../lib/useLearnerData'
import { useTricky } from '../lib/useTricky'
import { useBosses } from '../lib/useBosses'
import { useCapstone } from '../lib/useCapstone'
import { buildMastery, levelMeta } from '../lib/mastery'
import { displayFirstName } from '../lib/displayName'
import { SignInPanel } from './SignInPanel'

type Props = {
  /** Called when a nav item is chosen — lets the shell close the drawer on mobile. */
  onNavigate?: () => void
}

/** Tiny progress ring used per-lesson in the sidebar (shows partial progress). */
function LessonRing({ frac, color, label, done }: { frac: number; color: string; label: string; done: boolean }) {
  const size = 28
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, frac)))
  return (
    <span className="sb-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {frac > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="sb-ring__bar"
          />
        )}
      </svg>
      <span className="sb-ring__label" style={done ? { color } : undefined}>{label}</span>
    </span>
  )
}

export function AppSidebar({ onNavigate }: Props) {
  const { user, isSignedIn, signOut } = useAuth()
  const location = useLocation()
  const lessons = getAllLessons()
  const { progressMap, attempts, streak } = useLearnerData()
  const { due } = useTricky()
  const { active: activeBoss } = useBosses()
  const { result: capstoneResult } = useCapstone()

  const m = useMemo(() => buildMastery(lessons, progressMap, attempts), [lessons, progressMap, attempts])

  const currentLessonId = location.pathname.startsWith('/lesson/')
    ? location.pathname.split('/lesson/')[1]
    : undefined

  return (
    <div className="app-sidebar__inner">
      {!isSignedIn && (
        <div className="app-sidebar__signin">
          <p className="app-sidebar__signin-title">Save your progress</p>
          <SignInPanel compact />
        </div>
      )}

      <nav className="app-sidebar__nav">
        <Link
          to="/"
          className={`app-sidebar__link ${location.pathname === '/' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">🏠</span>
          Lesson plan overview
        </Link>
        <Link
          to="/progress"
          className={`app-sidebar__link ${location.pathname === '/progress' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">📊</span>
          Progress &amp; mastery
        </Link>
        <Link
          to="/review"
          className={`app-sidebar__link ${location.pathname === '/review' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">🧠</span>
          Tricky problems
          {due.length > 0 && <span className="app-sidebar__badge">{due.length}</span>}
        </Link>
        {activeBoss.length > 0 && (
          <Link
            to="/boss"
            className={`app-sidebar__link ${location.pathname === '/boss' ? 'app-sidebar__link--active' : ''}`}
            onClick={onNavigate}
          >
            <span className="app-sidebar__link-icon">⚔️</span>
            Boss battles
            <span className="app-sidebar__badge app-sidebar__badge--boss">{activeBoss.length}</span>
          </Link>
        )}
        <Link
          to="/capstone"
          className={`app-sidebar__link ${location.pathname === '/capstone' ? 'app-sidebar__link--active' : ''}`}
          onClick={onNavigate}
        >
          <span className="app-sidebar__link-icon">{capstoneResult?.passed ? '🏆' : '🔀'}</span>
          Mixed practice
        </Link>
      </nav>

      <div className="app-sidebar__mastery">
        <div className="app-sidebar__mastery-bar">
          <div className="app-sidebar__mastery-fill" style={{ width: `${m.overall}%` }} />
        </div>
        <span className="app-sidebar__mastery-num">{m.overall}% mastery</span>
      </div>

      <p className="app-sidebar__label">Lessons</p>
      <nav className="app-sidebar__list">
        {lessons.map((lesson) => {
          const prog = progressMap[lesson.id]
          const complete = prog?.status === 'completed'
          const current = lesson.id === currentLessonId
          const lm = m.byId[lesson.id]
          const frac = complete ? 1 : (lm?.progressFraction ?? 0)
          const color = lm ? levelMeta(lm.level).color : 'var(--border-mid)'

          return (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className={`app-sidebar__item ${current ? 'app-sidebar__item--current' : ''}`}
              aria-current={current ? 'page' : undefined}
              onClick={onNavigate}
            >
              <LessonRing
                frac={frac}
                color={color}
                label={complete ? '✓' : String(lesson.order)}
                done={complete}
              />
              <span className="app-sidebar__lesson-title">{lesson.title}</span>
              {lm?.dueForReview && <span className="app-sidebar__review" title="Due for review">↻</span>}
            </Link>
          )
        })}
      </nav>

      <div className="app-sidebar__footer">
        <span className="app-sidebar__streak">🔥 {streak.currentStreak} day streak</span>
        {isSignedIn && user && (
          <div className="app-sidebar__account">
            <span className="app-sidebar__name">{displayFirstName(user)}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                onNavigate?.()
                void signOut()
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
