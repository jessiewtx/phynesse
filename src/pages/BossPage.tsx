import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BarDragStepView } from '../components/steps/BarDragStepView'
import { AiTutorSidebar } from '../components/AiTutorSidebar'
import { generatePractice, aiEnabled, AI_HELP_AFTER, type GeneratedProblem } from '../lib/ai'
import { toBarDragStep } from '../lib/practiceProblem'
import { tutorContextForStep } from '../lib/tutorContext'
import { CONCEPTS } from '../lib/physics'
import { CONCEPT_COLOR } from '../lib/practiceConcepts'
import {
  BOSS_CATALOG,
  BOSS_HP,
  activeBosses,
  defeatBoss,
  loadBosses,
  type BossRecord,
} from '../lib/bosses'
import { notifyBossesChanged } from '../lib/useBosses'

type Phase = 'loading' | 'none' | 'intro' | 'battle' | 'won'

/**
 * Feature: Boss battles — targeted misconception confrontation.
 *
 * A boss is a concept+slip the learner keeps repeating (detected by the engine in
 * lessons/review). To "defeat" it they must clear BOSS_HP problems of that concept
 * IN A ROW, cleanly — a miss heals the boss back to full. Every problem is
 * engine-generated and engine-verified; the boss layer only chooses the concept
 * and frames the fix. Direct misconception confrontation > generic practice.
 */
export function BossPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [params] = useSearchParams()
  const requestedId = params.get('id')

  const [phase, setPhase] = useState<Phase>('loading')
  const [boss, setBoss] = useState<BossRecord | null>(null)
  const [problem, setProblem] = useState<GeneratedProblem | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [keyN, setKeyN] = useState(0)
  const [streak, setStreak] = useState(0)

  const streakRef = useRef(0)
  const missedRef = useRef(false)
  const wrongCount = useRef(0)
  const [tutorOpen, setTutorOpen] = useState(false)

  useEffect(() => {
    let alive = true
    void loadBosses(uid).then((items) => {
      if (!alive) return
      const active = activeBosses(items)
      const chosen =
        (requestedId ? active.find((b) => b.id === requestedId) : undefined) ?? active[0] ?? null
      setBoss(chosen)
      setPhase(chosen ? 'intro' : 'none')
    })
    return () => {
      alive = false
    }
  }, [uid, requestedId])

  const meta = boss ? BOSS_CATALOG[boss.misconceptionId] : null
  const concept = boss ? CONCEPTS[boss.conceptId] : null
  const accent = boss ? CONCEPT_COLOR[boss.conceptId] : '#7b5cff'

  const loadProblem = useCallback(async () => {
    if (!boss) return
    setGenLoading(true)
    const p = await generatePractice(boss.conceptId, 'hard')
    setProblem(p)
    setKeyN((k) => k + 1)
    setGenLoading(false)
  }, [boss])

  const begin = () => {
    streakRef.current = 0
    setStreak(0)
    missedRef.current = false
    wrongCount.current = 0
    setPhase('battle')
    void loadProblem()
  }

  const handleAttempt = (_answer: number, correct: boolean) => {
    if (correct) {
      // Counts toward the streak only if this problem was solved cleanly.
      if (!missedRef.current) {
        streakRef.current += 1
        setStreak(streakRef.current)
      }
      return
    }
    // A miss heals the boss to full — clean streak resets.
    missedRef.current = true
    wrongCount.current += 1
    if (streakRef.current !== 0) {
      streakRef.current = 0
      setStreak(0)
    }
    if (aiEnabled && wrongCount.current >= AI_HELP_AFTER) setTutorOpen(true)
  }

  const handleContinue = () => {
    if (streakRef.current >= BOSS_HP && boss) {
      void defeatBoss(uid, boss.id).then(() => notifyBossesChanged())
      setPhase('won')
      return
    }
    missedRef.current = false
    wrongCount.current = 0
    setTutorOpen(false)
    void loadProblem()
  }

  if (phase === 'loading') {
    return (
      <div className="practice">
        <div className="practice__loading">
          <span className="practice__spinner" />
          <span>Scanning for bosses…</span>
        </div>
      </div>
    )
  }

  if (phase === 'none' || !boss || !meta || !concept) {
    return (
      <div className="practice practice--empty">
        <div className="boss-empty">
          <div className="boss-empty__icon">🛡️</div>
          <h1 className="boss-empty__title">No bosses right now</h1>
          <p className="boss-empty__note">
            A boss appears when you make the <em>same kind</em> of mistake a few times — a dropped
            ½, a forgotten square, a g mix-up. Then you fight it: clear {BOSS_HP} of those problems
            in a row to crush the habit for good. Keep learning and they’ll show up here.
          </p>
          <Link to="/" className="btn btn--primary">
            Back to course
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'won') {
    return (
      <div className="practice practice--empty">
        <div className="boss-won">
          <div className="boss-won__burst" aria-hidden>
            <span className="boss-won__boss">{meta.emoji}</span>
            <span className="boss-won__pow">DEFEATED</span>
          </div>
          <h1 className="boss-won__title">You beat {meta.name}!</h1>
          <p className="boss-won__note">
            {BOSS_HP} clean solves in a row — that slip is out of your system. It’ll only come back
            if the mistake does.
          </p>
          <div className="boss-won__actions">
            <Link to="/" className="btn btn--primary">
              Back to course
            </Link>
            <Link to="/progress" className="btn btn--ghost">
              View mastery
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="practice">
        <header className="practice__header">
          <Link to="/" className="practice__back">
            ← Back
          </Link>
          <div className="practice__title-block">
            <span className="practice__eyebrow">Boss battle</span>
            <h1 className="practice__title">A boss appeared</h1>
          </div>
          <span />
        </header>

        <div className="boss-intro" style={{ ['--accent' as string]: accent }}>
          <div className="boss-intro__avatar">{meta.emoji}</div>
          <h2 className="boss-intro__name">{meta.name}</h2>
          <p className="boss-intro__tagline">{meta.tagline}</p>

          <div className="boss-intro__tip">
            <span className="boss-intro__tip-avatar">
              <img src="/brock.png" alt="Brock" />
            </span>
            <span className="boss-intro__tip-text">{meta.tip}</span>
          </div>

          <div className="boss-intro__rules">
            <span className="boss-intro__hp-label">Boss HP</span>
            <div className="boss-hp" role="img" aria-label={`${BOSS_HP} hit points`}>
              {Array.from({ length: BOSS_HP }, (_, i) => (
                <span key={i} className="boss-hp__pip boss-hp__pip--full" />
              ))}
            </div>
            <p className="boss-intro__rules-text">
              Solve <strong>{BOSS_HP} {concept.name} problems in a row</strong> — cleanly. One miss
              heals it back to full.
            </p>
          </div>

          <button type="button" className="btn btn--primary btn--lg" onClick={begin}>
            Start the battle →
          </button>
        </div>
      </div>
    )
  }

  // phase === 'battle'
  const step = problem ? toBarDragStep(problem) : null
  const tutorContext = step ? tutorContextForStep(step) : null

  return (
    <div className="practice">
      <header className="practice__header">
        <Link to="/" className="practice__back">
          ← Retreat
        </Link>
        <div className="practice__title-block">
          <span className="practice__eyebrow">Boss · {meta.name}</span>
          <h1 className="practice__title" style={{ color: accent }}>
            {concept.name}
          </h1>
        </div>
        <span className="practice__count">
          {streak}/{BOSS_HP}
        </span>
      </header>

      <div className="boss-hud" style={{ ['--accent' as string]: accent }}>
        <span className="boss-hud__avatar">{meta.emoji}</span>
        <div className="boss-hud__bar">
          <div className="boss-hud__name">{meta.name}</div>
          <div className="boss-hp">
            {Array.from({ length: BOSS_HP }, (_, i) => (
              <span
                key={i}
                className={`boss-hp__pip ${i < BOSS_HP - streak ? 'boss-hp__pip--full' : 'boss-hp__pip--down'}`}
              />
            ))}
          </div>
        </div>
        <span className="boss-hud__streak">🔥 {streak} in a row</span>
      </div>

      {genLoading || !step ? (
        <div className="practice__loading">
          <span className="practice__spinner" />
          <span>Summoning the next challenge…</span>
        </div>
      ) : (
        <div className="practice__card">
          <BarDragStepView
            key={keyN}
            step={step}
            draft={null}
            onDraftChange={() => {}}
            onCorrect={handleContinue}
            onAttempt={handleAttempt}
          />
        </div>
      )}

      {aiEnabled && tutorContext && !tutorOpen && (
        <button type="button" className="tutor-fab" onClick={() => setTutorOpen(true)}>
          <span className="tutor-fab__avatar">
            <img src="/brock.png" alt="" />
          </span>
          Ask Brock
        </button>
      )}

      {aiEnabled && tutorOpen && tutorContext && (
        <AiTutorSidebar
          key={keyN}
          lessonTitle={`Boss: ${meta.name}`}
          conceptId={boss.conceptId}
          question={tutorContext}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </div>
  )
}
