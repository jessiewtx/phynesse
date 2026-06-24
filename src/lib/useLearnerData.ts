import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, statusForStepIndex } from './lessons'
import { loadProgress, loadGuestAttempts } from './progress'
import {
  fetchAllLessonProgress,
  fetchAttempts,
  type StepAttemptRecord,
  type StoredLessonProgress,
} from './progressFirestore'
import { getStreak, emptyStats, type StreakStats } from './streak'

export type LearnerData = {
  progressMap: Record<string, StoredLessonProgress>
  attempts: StepAttemptRecord[]
  streak: StreakStats
  isSignedIn: boolean
  ready: boolean
}

/** Event other parts of the app fire after they write progress, so live views refresh. */
const LEARNER_DATA_EVENT = 'phynesse:learner-data'

/** Fire this after any progress / streak write to refresh dashboards in place. */
export function notifyLearnerDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LEARNER_DATA_EVENT))
  }
}

/** One place to load progress, attempts and streak for the current learner. */
export function useLearnerData(): LearnerData {
  const { user, isSignedIn } = useAuth()
  const location = useLocation()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})
  const [attempts, setAttempts] = useState<StepAttemptRecord[]>([])
  const [streak, setStreak] = useState<StreakStats>(() => emptyStats())
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  // Refresh whenever someone signals a write (no full page reload needed).
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(LEARNER_DATA_EVENT, bump)
    return () => window.removeEventListener(LEARNER_DATA_EVENT, bump)
  }, [])

  useEffect(() => {
    let alive = true
    const uid = isSignedIn && user ? user.uid : null
    // Note: we intentionally do NOT flip `ready` back to false on refetches —
    // that would flash loading states every time progress is saved mid-lesson.

    async function run() {
      const streakStats = await getStreak(uid)
      if (!alive) return
      setStreak(streakStats)

      if (uid) {
        const [prog, atts] = await Promise.all([fetchAllLessonProgress(uid), fetchAttempts(uid)])
        if (!alive) return
        setProgressMap(prog)
        setAttempts(atts)
      } else {
        const guest: Record<string, StoredLessonProgress> = {}
        for (const lesson of getAllLessons()) {
          const local = loadProgress(lesson.id)
          if (local) {
            guest[lesson.id] = {
              lessonId: lesson.id,
              stepIndex: local.stepIndex,
              stepDraft: local.stepDraft ?? null,
              status: statusForStepIndex(lesson, local.stepIndex),
              updatedAt: local.updatedAt,
            }
          }
        }
        if (!alive) return
        setProgressMap(guest)
        setAttempts(loadGuestAttempts())
      }
      if (alive) setReady(true)
    }

    void run()
    return () => {
      alive = false
    }
    // location.pathname → refetch on navigation; version → refetch on in-place writes.
  }, [isSignedIn, user, location.pathname, version])

  return { progressMap, attempts, streak, isSignedIn, ready }
}
