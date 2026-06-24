import { useEffect } from 'react'
import type { CompletionResult } from '../lib/streak'
import { IconFlame, MilestoneIcon } from './Illustrations'

type Props = {
  result: CompletionResult
  onDismiss: () => void
}

function headline(result: CompletionResult): { title: string; sub: string } {
  const n = result.stats.currentStreak
  if (result.streakStarted) {
    return {
      title: 'Streak started!',
      sub: 'You finished a lesson today. Come back tomorrow to keep the flame alive.',
    }
  }
  if (result.streakIncreased) {
    return {
      title: `${n} day streak!`,
      sub: 'You showed up again. Momentum is building — keep it going.',
    }
  }
  return {
    title: `${n} day streak`,
    sub: 'Another lesson done today. Nice work.',
  }
}

/** Full-screen, Duolingo-style celebration shown after completing a lesson. */
export function StreakCelebrationOverlay({ result, onDismiss }: Props) {
  const { title, sub } = headline(result)
  const n = result.stats.currentStreak

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div className="streak-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="streak-overlay__card">
        <div className="streak-overlay__flame" aria-hidden="true"><IconFlame size={84} /></div>

        <div className="streak-overlay__number">{n}</div>
        <div className="streak-overlay__unit">{n === 1 ? 'day streak' : 'day streak'}</div>

        <h2 className="streak-overlay__title">{title}</h2>
        <p className="streak-overlay__sub">{sub}</p>

        {result.milestones.length > 0 && (
          <ul className="streak-overlay__milestones">
            {result.milestones.map((m) => (
              <li key={m.id} className="streak-overlay__milestone">
                <span className="streak-overlay__milestone-icon"><MilestoneIcon id={m.id} size={26} /></span>
                <span className="streak-overlay__milestone-text">
                  <strong>{m.label}</strong>
                  <span>{m.blurb}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="btn btn--primary streak-overlay__btn" onClick={onDismiss}>
          Continue
        </button>
      </div>
    </div>
  )
}
