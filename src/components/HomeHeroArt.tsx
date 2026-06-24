/**
 * Simple, purely decorative hero graphic for the landing page. Flat and minimal
 * on purpose so it never reads as an interactive control. Pick one with `variant`.
 */

export type HeroVariant = 'hill' | 'bolt' | 'coaster' | 'pendulum' | 'orbit'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 360 240" className="home-hero-art__svg" role="img">
      <defs>
        <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef6ff" />
          <stop offset="1" stopColor="#f7f1ff" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="240" rx="24" fill="url(#heroSky)" />
      {children}
    </svg>
  )
}

function Hill() {
  return (
    <>
      <circle cx="290" cy="64" r="24" fill="#ffc31e" />
      <path
        d="M0 240 C 90 240 120 120 210 120 C 290 120 300 200 360 200 L 360 240 Z"
        fill="#9b5cff"
        opacity="0.18"
      />
      <path
        d="M0 240 C 90 240 120 120 210 120 C 290 120 300 200 360 200"
        fill="none"
        stroke="#9b5cff"
        strokeOpacity="0.5"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="210" cy="104" r="16" fill="#1ec487" stroke="#fff" strokeWidth="5" />
    </>
  )
}

function Bolt() {
  return (
    <>
      <circle cx="180" cy="120" r="72" fill="#9b5cff" opacity="0.14" />
      <path
        d="M196 56 L150 132 L178 132 L164 184 L214 104 L184 104 Z"
        fill="#ffc31e"
        stroke="#ff8a3d"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </>
  )
}

function Coaster() {
  return (
    <>
      <circle cx="300" cy="58" r="22" fill="#ffc31e" />
      <path
        d="M10 210 C 70 210 80 90 150 90 C 210 90 220 170 270 170 C 310 170 320 120 350 120"
        fill="none"
        stroke="#19c3d6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="150" cy="78" r="14" fill="#ff4d6d" stroke="#fff" strokeWidth="5" />
    </>
  )
}

function Pendulum() {
  return (
    <>
      {/* support bar */}
      <rect x="96" y="44" width="168" height="9" rx="4" fill="#b9a48c" />
      {/* string + bob (resting to one side) */}
      <line x1="180" y1="50" x2="118" y2="150" stroke="#6b5bd0" strokeWidth="3" />
      <circle cx="118" cy="150" r="18" fill="#9b5cff" stroke="#fff" strokeWidth="5" />
      {/* faint arc showing the swing path */}
      <path
        d="M118 150 A 118 118 0 0 1 242 150"
        fill="none"
        stroke="#9b5cff"
        strokeOpacity="0.3"
        strokeWidth="3"
        strokeDasharray="5 7"
      />
    </>
  )
}

function Orbit() {
  return (
    <>
      <circle cx="180" cy="120" r="76" fill="none" stroke="#19c3d6" strokeOpacity="0.45" strokeWidth="3" />
      <ellipse cx="180" cy="120" rx="100" ry="44" fill="none" stroke="#ff8a3d" strokeOpacity="0.4" strokeWidth="3" />
      <circle cx="180" cy="120" r="18" fill="#ffc31e" />
      <circle cx="280" cy="120" r="11" fill="#1ec487" stroke="#fff" strokeWidth="4" />
      <circle cx="180" cy="44" r="9" fill="#ff4d6d" stroke="#fff" strokeWidth="4" />
    </>
  )
}

function renderVariant(variant: HeroVariant) {
  switch (variant) {
    case 'bolt':
      return <Bolt />
    case 'coaster':
      return <Coaster />
    case 'pendulum':
      return <Pendulum />
    case 'orbit':
      return <Orbit />
    case 'hill':
    default:
      return <Hill />
  }
}

export function HomeHeroArt({ variant = 'hill' }: { variant?: HeroVariant }) {
  return (
    <div className="home-hero-art" aria-hidden="true">
      <Frame>{renderVariant(variant)}</Frame>
    </div>
  )
}
