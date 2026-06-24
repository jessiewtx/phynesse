import { useEffect } from 'react'

/** A flat, palm-up cartoon hand. The two hands bob up & down out of phase to
 *  mimic the "six... seven" weighing gesture. No emojis — pure vector. */
function MemeHand({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="42"
      height="48"
      viewBox="0 0 36 46"
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <g fill="#fff" stroke="rgba(60,30,90,0.25)" strokeWidth="1.2" strokeLinejoin="round">
        {/* fingers */}
        <rect x="8.5" y="9" width="5" height="20" rx="2.5" />
        <rect x="14.4" y="5" width="5" height="24" rx="2.5" />
        <rect x="20.3" y="6" width="5" height="23" rx="2.5" />
        <rect x="26" y="11" width="5" height="18" rx="2.5" />
        {/* thumb */}
        <rect x="1.5" y="21" width="5" height="13" rx="2.5" transform="rotate(-30 4 27)" />
        {/* palm */}
        <rect x="7" y="22" width="22" height="17" rx="8" />
      </g>
      {/* cuff */}
      <rect x="8.5" y="36" width="19" height="6" rx="3" fill="#ffd36e" stroke="rgba(60,30,90,0.18)" strokeWidth="1" />
    </svg>
  )
}

/** Easter egg: when an answer lands on 6.7, the kids get the "six seven" meme. */
export function SixSevenPopup({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="six-seven" role="status" aria-label="Six seven">
      <button type="button" className="six-seven__x" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="six-seven__row">
        <span className="six-seven__hand six-seven__hand--l" aria-hidden="true">
          <MemeHand />
        </span>
        <span className="six-seven__big">6<span className="six-seven__7">7</span></span>
        <span className="six-seven__hand six-seven__hand--r" aria-hidden="true">
          <MemeHand flip />
        </span>
      </div>
      <div className="six-seven__cap">SIX&nbsp;SEVENNN</div>
      <div className="six-seven__sub">you hit the funny number</div>
    </div>
  )
}
