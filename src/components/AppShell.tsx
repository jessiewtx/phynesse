import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

const DESKTOP_MIN = 900
const STORAGE_KEY = 'phynesse_nav_open'

function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_MIN
}

/** App-wide layout: a slide-out left nav (open by default on desktop, drawer on mobile). */
export function AppShell() {
  const [open, setOpen] = useState(() => {
    if (!isDesktop()) return false
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  // Keep the desktop preference; collapse automatically when shrinking to mobile.
  useEffect(() => {
    const onResize = () => {
      if (!isDesktop()) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (isDesktop()) localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const closeOnMobile = () => {
    if (!isDesktop()) setOpen(false)
  }

  return (
    <div className={`app-shell ${open ? 'app-shell--open' : ''}`}>
      <header className="app-topbar">
        <button
          type="button"
          className="app-hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={toggle}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="app-topbar__brand">Phynesse</span>
      </header>

      <div className="app-body">
        {open && <div className="app-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
        <aside className="app-sidebar">
          <AppSidebar onNavigate={closeOnMobile} />
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
