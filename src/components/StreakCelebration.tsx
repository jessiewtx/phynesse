import type { Milestone, StreakStats } from '../lib/streak'

type Props = {
  stats: StreakStats
  milestones: Milestone[]
}

/** Shown on the lesson-complete splash: the satisfying "you're on a streak" moment. */
export function StreakCelebration({ stats, milestones }: Props) {
  const dayWord = stats.currentStreak === 1 ? 'day' : 'days'

  return (
    <div className="streak-celebrate">
      <div className="streak-celebrate__streak">
        <span className="streak-celebrate__flame">🔥</span>
        <span className="streak-celebrate__count">{stats.currentStreak}</span>
        <span className="streak-celebrate__label">{dayWord} in a row</span>
      </div>

      {milestones.length > 0 && (
        <ul className="streak-celebrate__milestones">
          {milestones.map((m) => (
            <li key={m.id} className="streak-celebrate__milestone">
              <span className="streak-celebrate__milestone-icon">{m.icon}</span>
              <span className="streak-celebrate__milestone-text">
                <strong>{m.label}</strong>
                <span>{m.blurb}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
