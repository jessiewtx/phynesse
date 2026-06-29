import type { Confidence } from '../types/lesson'
import { CONFIDENCE_META, CONFIDENCE_ORDER } from '../lib/calibration'

type Props = {
  value: Confidence | null
  onChange: (c: Confidence) => void
  disabled?: boolean
}

/** Three-way confidence selector shown before checking a calibrated answer. */
export function ConfidencePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="confidence">
      <span className="confidence__label">How sure are you?</span>
      <div className="confidence__options" role="radiogroup" aria-label="Confidence">
        {CONFIDENCE_ORDER.map((c) => {
          const meta = CONFIDENCE_META[c]
          const active = value === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              className={`confidence__btn${active ? ' confidence__btn--active' : ''}`}
              data-confidence={c}
              onClick={() => onChange(c)}
            >
              <span className="confidence__emoji" aria-hidden>
                {meta.emoji}
              </span>
              {meta.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}
