/** Number of wrong attempts before we stop hinting and walk the learner through it. */
export const STUCK_THRESHOLD = 3

type Props = {
  answer: string
  explanation?: string
  /** What the learner should do next, e.g. "Set the bar to this, then tap Check." */
  nudge?: string
}

/**
 * Shown after repeated wrong attempts. Instead of another red X, it reveals the
 * worked answer + the fullest explanation so the learner can recover and move on.
 */
export function StuckHelp({ answer, explanation, nudge }: Props) {
  return (
    <div className="stuck-help">
      <p className="stuck-help__title">Stuck? Let's walk through it.</p>
      {explanation && <p className="stuck-help__body">{explanation}</p>}
      <p className="stuck-help__answer">
        Answer: <strong>{answer}</strong>
      </p>
      {nudge && <p className="stuck-help__nudge">{nudge}</p>}
    </div>
  )
}
