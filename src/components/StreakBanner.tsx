import { earnedMilestones, type StreakStats } from '../lib/streak'

type Props = {
  stats: StreakStats
  totalLessons: number
}

/** Compact habit-loop summary for the homepage: streak, lessons done, best streak, milestones. */
export function StreakBanner({ stats, totalLessons }: Props) {
  const done = stats.completedLessons.length
  const milestones = earnedMilestones(stats)
  const started = stats.lastActiveDay !== null || done > 0

  if (!started) {
    return (
      <div className="streak-banner streak-banner--empty">
        <span className="streak-banner__hint">
          🔥 Finish a lesson today to start your streak.
        </span>
      </div>
    )
  }

  return (
    <div className="streak-banner">
      <div className="streak-banner__stats">
        <div className="streak-stat">
          <span className="streak-stat__value">🔥 {stats.currentStreak}</span>
          <span className="streak-stat__label">day streak</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat__value">{done}/{totalLessons}</span>
          <span className="streak-stat__label">lessons done</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat__value">🏅 {stats.longestStreak}</span>
          <span className="streak-stat__label">best streak</span>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="streak-banner__badges">
          {milestones.map((m) => (
            <span key={m.id} className="streak-badge" title={m.blurb}>
              {m.icon} {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
