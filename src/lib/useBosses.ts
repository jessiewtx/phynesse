import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { activeBosses, loadBosses, type BossRecord } from './bosses'

export type BossData = {
  items: BossRecord[]
  active: BossRecord[]
  ready: boolean
}

const BOSS_EVENT = 'phynesse:bosses-changed'

/** Fire after recording a miss / defeating a boss so live views refresh. */
export function notifyBossesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BOSS_EVENT))
  }
}

/** Loads the learner's boss list and keeps it fresh across writes + navigation. */
export function useBosses(): BossData {
  const { user, isSignedIn } = useAuth()
  const location = useLocation()
  const [items, setItems] = useState<BossRecord[]>([])
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(BOSS_EVENT, bump)
    return () => window.removeEventListener(BOSS_EVENT, bump)
  }, [])

  useEffect(() => {
    let alive = true
    const uid = isSignedIn && user ? user.uid : null
    void loadBosses(uid).then((loaded) => {
      if (!alive) return
      setItems(loaded)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [isSignedIn, user, location.pathname, version])

  return { items, active: activeBosses(items), ready }
}
