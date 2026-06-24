import { useState } from 'react'
import { PhysicsText } from '../lib/physicsText'
import { IconBulb } from './Illustrations'

type Props = {
  /** Whether the learner has answered correctly yet — gates the solution. */
  solved: boolean
  solution: string
}

/**
 * Always-visible "Why?" button. It stays locked (disabled) until the question
 * is answered correctly, then reveals the full worked solution on demand.
 */
export function WhyPanel({ solved, solution }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="why">
      <button
        type="button"
        className="why__btn"
        disabled={!solved}
        aria-expanded={open}
        title={solved ? 'See the full solution' : 'Answer correctly to unlock the full solution'}
        onClick={() => setOpen((o) => !o)}
      >
        <IconBulb size={16} />
        {solved ? (open ? 'Hide solution' : 'Why?') : 'Why? (answer first)'}
      </button>

      {solved && open && (
        <div className="why__panel">
          <PhysicsText text={solution} block />
        </div>
      )}
    </div>
  )
}
