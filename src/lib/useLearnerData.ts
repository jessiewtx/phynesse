import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllLessons, statusForStepIndex } from './lessons'
import { loadProgress } from './progress'
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

/** One place to load progress, attempts and streak for the current learner. */
export function useLearnerData(): LearnerData {
  const { user, isSignedIn } = useAuth()
  const [progressMap, setProgressMap] = useState<Record<string, StoredLessonProgress>>({})
  const [attempts, setAttempts] = useState<StepAttemptRecord[]>([])
  const [streak, setStreak] = useState<StreakStats>(() => emptyStats())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    const uid = isSignedIn && user ? user.uid : null
    setReady(false)

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
              simParams: local.simParams,
              stepDraft: local.stepDraft ?? null,
              status: statusForStepIndex(lesson, local.stepIndex),
              updatedAt: local.updatedAt,
            }
          }
        }
        if (!alive) return
        setProgressMap(guest)
        setAttempts([])
      }
      if (alive) setReady(true)
    }

    void run()
    return () => {
      alive = false
    }
  }, [isSignedIn, user])

  return { progressMap, attempts, streak, isSignedIn, ready }
}
