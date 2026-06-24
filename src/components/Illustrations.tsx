type IconProps = {
  size?: number
  className?: string
}

/** Cute, on-palette vector icons (replace stock emojis). */

export function IconTarget({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="21" cy="27" r="15" fill="#ffe7dd" />
      <circle cx="21" cy="27" r="15" fill="none" stroke="#ff6a3d" strokeWidth="3" />
      <circle cx="21" cy="27" r="8.5" fill="#fff" stroke="#ff6a3d" strokeWidth="3" />
      <circle cx="21" cy="27" r="3" fill="#ff6a3d" />
      <path d="M27 21 L41 7" stroke="#19c3d6" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M36 7 L42 6 L41 12" stroke="#19c3d6" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IconBars({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="26" width="8.5" height="13" rx="3" fill="#19c3d6" />
      <rect x="19.5" y="15" width="8.5" height="24" rx="3" fill="#1ec487" />
      <rect x="31" y="21" width="8.5" height="18" rx="3" fill="#ffc31e" />
      <line x1="6" y1="40" x2="42" y2="40" stroke="#cdbfb0" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconScale({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="9" r="3" fill="#9b5cff" />
      <line x1="24" y1="11" x2="24" y2="34" stroke="#9b5cff" strokeWidth="3" strokeLinecap="round" />
      <line x1="11" y1="14" x2="37" y2="14" stroke="#9b5cff" strokeWidth="3" strokeLinecap="round" />
      <line x1="11" y1="14" x2="11" y2="19" stroke="#ff4d6d" strokeWidth="2" />
      <path d="M5 19 A6 4.5 0 0 0 17 19" fill="#ffd6df" stroke="#ff4d6d" strokeWidth="2" strokeLinejoin="round" />
      <line x1="37" y1="14" x2="37" y2="19" stroke="#19c3d6" strokeWidth="2" />
      <path d="M31 19 A6 4.5 0 0 0 43 19" fill="#d6f3f7" stroke="#19c3d6" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 38 L24 33 L30 38" stroke="#9b5cff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPencil({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(45 24 24)">
        <rect x="19" y="9" width="10" height="22" rx="2.5" fill="#ffc31e" />
        <rect x="19" y="9" width="10" height="5" rx="2.5" fill="#ff8a3d" />
        <path d="M19 31 L24 40 L29 31 Z" fill="#f4e6c6" />
        <path d="M22 36 L24 40 L26 36 Z" fill="#3a322c" />
        <rect x="19" y="13.5" width="10" height="2.4" fill="#ff8a3d" opacity="0.7" />
      </g>
    </svg>
  )
}

export function IconLock({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 22 V16 a8 8 0 0 1 16 0 V22"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="12" y="21" width="24" height="18" rx="5" fill="currentColor" />
      <circle cx="24" cy="28.5" r="2.8" fill="#c3cad6" />
      <rect x="22.7" y="28.5" width="2.6" height="6" rx="1.3" fill="#c3cad6" />
    </svg>
  )
}

export function IconFlag({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <line x1="14" y1="9" x2="14" y2="40" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <g fill="currentColor">
        <rect x="14" y="10" width="6" height="6" />
        <rect x="26" y="10" width="6" height="6" />
        <rect x="20" y="16" width="6" height="6" />
        <rect x="32" y="16" width="6" height="6" />
        <rect x="14" y="22" width="6" height="6" />
        <rect x="26" y="22" width="6" height="6" />
      </g>
    </svg>
  )
}

export function IconBolt({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2 L4 14 H10.5 L9 22 L20 9 H12.5 Z" />
    </svg>
  )
}

export function IconBulb({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 a6.5 6.5 0 0 0 -4 11.6 c0.7 0.6 1 1.1 1.1 1.9 h5.8 c0.1 -0.8 0.4 -1.3 1.1 -1.9 A6.5 6.5 0 0 0 12 3 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <rect x="9" y="18" width="6" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="10" y="20.8" width="4" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  )
}
