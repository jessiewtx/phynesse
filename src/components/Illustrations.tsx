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

export function IconFlame({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 4 C 15 14, 19 22, 16 28 C 13 35, 18 44, 26 43 C 35 42, 39 32, 33 22 C 32 26, 29 25, 30 20 C 31 13, 28 8, 24 4 Z"
        fill="#ff6a3d"
      />
      <path
        d="M25 22 C 21 27, 23 30, 21 33 C 19 37, 23 41, 27 39 C 32 37, 31 30, 27 26 C 27 29, 24 28, 25 22 Z"
        fill="#ffc31e"
      />
    </svg>
  )
}

export function IconParty({ size = 48, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M7 41 L19 19 L29 29 Z" fill="#ff8a3d" />
      <path d="M7 41 L19 19 L29 29 Z" fill="none" stroke="#ff6a3d" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 31 L23 33" stroke="#ff6a3d" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <circle cx="30" cy="12" r="2.5" fill="#19c3d6" />
      <rect x="35" y="17" width="4.5" height="4.5" rx="1.2" fill="#1ec487" transform="rotate(20 37 19)" />
      <circle cx="41" cy="28" r="2.3" fill="#9b5cff" />
      <rect x="23" y="7" width="4.5" height="4.5" rx="1.2" fill="#ffc31e" transform="rotate(-15 25 9)" />
      <path d="M31 22 q4 -3 8 -1" stroke="#ff4d6d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="37" r="2" fill="#ffc31e" />
    </svg>
  )
}

function IconCheckBadge({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="8" width="32" height="32" rx="9" fill="#1ec487" />
      <path d="M16 24 L22 30 L33 17" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconStar({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 6 L29.6 18 L42 19.6 L33 28.4 L35.3 41 L24 35 L12.7 41 L15 28.4 L6 19.6 L18.4 18 Z"
        fill="#ffc31e"
        stroke="#f0a500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTrophy({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M15 9 h18 v7 a9 9 0 0 1 -18 0 Z" fill="#ffc31e" stroke="#f0a500" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 12 H10 a4 4 0 0 0 5 6.5" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 12 H38 a4 4 0 0 1 -5 6.5" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" />
      <rect x="22" y="25" width="4" height="6" fill="#f0a500" />
      <rect x="15" y="31" width="18" height="4.5" rx="1.6" fill="#f0a500" />
    </svg>
  )
}

function IconBook({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 12 C 20 9, 12 9, 9 11 V36 C 12 34, 20 34, 24 37 C 28 34, 36 34, 39 36 V11 C 36 9, 28 9, 24 12 Z"
        fill="#19c3d6"
        stroke="#0e9aa7"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="24" y1="12" x2="24" y2="37" stroke="#0e9aa7" strokeWidth="1.5" />
    </svg>
  )
}

function IconCap({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M24 11 L43 18 L24 25 L5 18 Z" fill="#9b5cff" stroke="#7b3fe4" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 21 V29 a10 4.5 0 0 0 20 0 V21" fill="none" stroke="#7b3fe4" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="40" y1="19" x2="40" y2="30" stroke="#ffc31e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="31.5" r="2.2" fill="#ffc31e" />
    </svg>
  )
}

/** Maps a streak/lesson milestone id to a cute vector instead of an emoji. */
export function MilestoneIcon({ id, size = 28, className }: IconProps & { id: string }) {
  switch (id) {
    case 'streak-3':
      return <IconFlame size={size} className={className} />
    case 'streak-7':
      return <IconBolt size={size} className={className} />
    case 'streak-14':
      return <IconStar size={size} className={className} />
    case 'streak-30':
      return <IconTrophy size={size} className={className} />
    case 'lessons-1':
      return <IconCheckBadge size={size} className={className} />
    case 'lessons-3':
      return <IconBook size={size} className={className} />
    case 'lessons-6':
      return <IconCap size={size} className={className} />
    default:
      return <IconStar size={size} className={className} />
  }
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
