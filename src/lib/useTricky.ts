import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dueItems, loadTricky, upcomingItems, type TrickyItem } from './tricky'

export type TrickyData = {
  items: TrickyItem[]
  due: TrickyItem[]
  upcoming: TrickyItem[]
  ready: boolean
  refresh: () => void
}

const TRICKY_EVENT = 'phynesse:tricky-changed'

/** Fire after capturing / grading a tricky problem so live views refresh. */
export function notifyTrickyChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRICKY_EVENT))
  }
}

/** Loads the learner's tricky-problems notebook and keeps it fresh. */
export function useTricky(): TrickyData {
  const { user, isSignedIn } = useAuth()
  const location = useLocation()
  const [items, setItems] = useState<TrickyItem[]>([])
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(TRICKY_EVENT, bump)
    return () => window.removeEventListener(TRICKY_EVENT, bump)
  }, [])

  useEffect(() => {
    let alive = true
    const uid = isSignedIn && user ? user.uid : null
    void loadTricky(uid).then((loaded) => {
      if (!alive) return
      setItems(loaded)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [isSignedIn, user, location.pathname, version])

  return { items, due: dueItems(items), upcoming: upcomingItems(items), ready, refresh }
}
