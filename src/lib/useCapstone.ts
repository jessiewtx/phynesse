import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadCapstone, type CapstoneResult } from './capstone'

export type CapstoneData = {
  result: CapstoneResult | null
  ready: boolean
}

const CAPSTONE_EVENT = 'phynesse:capstone-changed'

/** Fire after recording a capstone attempt so live views refresh. */
export function notifyCapstoneChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CAPSTONE_EVENT))
  }
}

/** Loads the learner's capstone result and keeps it fresh across writes + navigation. */
export function useCapstone(): CapstoneData {
  const { user, isSignedIn } = useAuth()
  const location = useLocation()
  const [result, setResult] = useState<CapstoneResult | null>(null)
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(CAPSTONE_EVENT, bump)
    return () => window.removeEventListener(CAPSTONE_EVENT, bump)
  }, [])

  useEffect(() => {
    let alive = true
    const uid = isSignedIn && user ? user.uid : null
    void loadCapstone(uid).then((loaded) => {
      if (!alive) return
      setResult(loaded)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [isSignedIn, user, location.pathname, version])

  return { result, ready }
}
