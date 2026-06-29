import { useMemo, useState, type DragEvent, type ReactNode } from 'react'
import type { FillBlanksStep, StepDraft } from '../../types/lesson'
import { PhysicsText } from '../../lib/physicsText'
import { Feedback } from '../Feedback'
import { WhyPanel } from '../WhyPanel'
import { ProblemVisualView } from '../diagrams/ProblemVisualView'
import { useEnterAdvance } from '../../lib/useEnterAdvance'

type Props = {
  step: FillBlanksStep
  draft: StepDraft | null
  onDraftChange: (draft: StepDraft | null) => void
  onCorrect: () => void
  onAttempt?: (answer: string, correct: boolean, hint?: string) => void
}

type Placements = Record<string, string | null>

const SLOT_RE = /\{(\w+)\}/g

function parseDraft(draft: StepDraft | null, blanks: FillBlanksStep['blanks']): Placements {
  const placements: Placements = {}
  for (const b of blanks) placements[b.id] = null
  if (typeof draft?.answer === 'string') {
    try {
      const parsed = JSON.parse(draft.answer) as Placements
      for (const b of blanks) {
        if (typeof parsed[b.id] === 'string') placements[b.id] = parsed[b.id]
      }
    } catch {
      /* corrupt draft — start blank */
    }
  }
  return placements
}

/**
 * Drag-the-words classification step. The learner reasons qualitatively (e.g.
 * positive / negative / zero work) by dragging — or tapping — bank words into
 * the blanks. Tap-to-place keeps it reliable on touch; native drag is layered on
 * for desktop. Each bank word is used at most once.
 */
export function FillBlanksStepView({ step, draft, onDraftChange, onCorrect, onAttempt }: Props) {
  const [placements, setPlacements] = useState<Placements>(() => parseDraft(draft, step.blanks))
  const [selected, setSelected] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(draft?.attemptCount ?? 0)
  const [solved, setSolved] = useState(draft?.solved ?? false)
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    () =>
      draft?.solved
        ? { variant: 'success', text: 'Exactly right — every sign checks out.' }
        : draft?.showWrongFeedback && draft.feedbackText
          ? { variant: 'error', text: draft.feedbackText }
          : null,
  )

  useEnterAdvance(onCorrect, solved)

  const usedValues = useMemo(
    () => new Set(Object.values(placements).filter(Boolean) as string[]),
    [placements],
  )
  const bankChips = step.bank.filter((v) => !usedValues.has(v))
  const allFilled = step.blanks.every((b) => placements[b.id])

  const persist = (
    next: Placements,
    opts?: { solved?: boolean; wrong?: string; attempts?: number },
  ) => {
    onDraftChange({
      answer: JSON.stringify(next),
      showWrongFeedback: !!opts?.wrong,
      feedbackText: opts?.wrong,
      attemptCount: opts?.attempts ?? attempt,
      solved: opts?.solved,
    })
  }

  const place = (blankId: string, value: string) => {
    if (solved) return
    setPlacements((prev) => {
      const next = { ...prev }
      // A word lives in one place at a time — pull it from any slot it's in.
      for (const k of Object.keys(next)) if (next[k] === value) next[k] = null
      next[blankId] = value
      persist(next)
      return next
    })
    setSelected(null)
  }

  const onSlotClick = (blankId: string) => {
    if (solved) return
    if (selected) {
      place(blankId, selected)
    } else if (placements[blankId]) {
      // No word held → pick the one already in this slot back up.
      const held = placements[blankId]!
      setPlacements((prev) => {
        const next = { ...prev, [blankId]: null }
        persist(next)
        return next
      })
      setSelected(held)
    }
  }

  const onChipClick = (value: string) => {
    if (solved) return
    setSelected((s) => (s === value ? null : value))
  }

  const onChipDragStart = (e: DragEvent, value: string) => {
    e.dataTransfer.setData('text/plain', value)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onSlotDrop = (e: DragEvent, blankId: string) => {
    e.preventDefault()
    const value = e.dataTransfer.getData('text/plain')
    if (value) place(blankId, value)
  }

  const submit = () => {
    if (!allFilled || solved) return
    const wrongIds = step.blanks.filter((b) => placements[b.id] !== b.answer).map((b) => b.id)
    if (wrongIds.length === 0) {
      setSolved(true)
      setFeedback({ variant: 'success', text: 'Exactly right — every sign checks out.' })
      onAttempt?.(JSON.stringify(placements), true)
      persist(placements, { solved: true })
    } else {
      const nextAttempt = attempt + 1
      setAttempt(nextAttempt)
      const n = wrongIds.length
      const text =
        step.hint ??
        `${n} blank${n > 1 ? 's are' : ' is'} off. Compare each force's direction with the motion.`
      setFeedback({ variant: 'error', text })
      onAttempt?.(JSON.stringify(placements), false, text)
      persist(placements, { wrong: text, attempts: nextAttempt })
    }
  }

  const renderLine = (line: string, li: number): ReactNode => {
    const nodes: ReactNode[] = []
    let last = 0
    let k = 0
    let m: RegExpExecArray | null
    SLOT_RE.lastIndex = 0
    while ((m = SLOT_RE.exec(line)) !== null) {
      if (m.index > last) {
        nodes.push(<PhysicsText key={`t${li}-${k}`} text={line.slice(last, m.index)} />)
      }
      const id = m[1]
      const value = placements[id]
      const wrongHere = solved && value !== step.blanks.find((b) => b.id === id)?.answer
      nodes.push(
        <button
          type="button"
          key={`s${li}-${id}`}
          className={[
            'fb-slot',
            value ? 'fb-slot--filled' : 'fb-slot--empty',
            solved ? (wrongHere ? 'fb-slot--wrong' : 'fb-slot--right') : '',
            selected && !value ? 'fb-slot--target' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSlotClick(id)}
          onDragOver={(e) => {
            if (!solved) e.preventDefault()
          }}
          onDrop={(e) => onSlotDrop(e, id)}
          disabled={solved}
          aria-label={value ? `Blank filled with ${value}` : 'Empty blank'}
        >
          {value ?? ''}
        </button>,
      )
      last = m.index + m[0].length
      k++
    }
    if (last < line.length) {
      nodes.push(<PhysicsText key={`t${li}-end`} text={line.slice(last)} />)
    }
    return (
      <p key={`line${li}`} className="fb-line">
        {nodes}
      </p>
    )
  }

  return (
    <div className="step step--fill-blanks">
      <p className="step__prompt">
        <PhysicsText text={step.prompt} />
      </p>

      {step.visual && <ProblemVisualView visual={step.visual} />}

      <div className="fb-lines">{step.lines.map(renderLine)}</div>

      {!solved && (
        <>
          <div className="fb-bank" role="list" aria-label="Word bank">
            {bankChips.length === 0 ? (
              <span className="fb-bank__empty">All words placed — hit Check.</span>
            ) : (
              bankChips.map((value) => (
                <button
                  type="button"
                  key={value}
                  role="listitem"
                  className={`fb-chip${selected === value ? ' fb-chip--selected' : ''}`}
                  draggable
                  onDragStart={(e) => onChipDragStart(e, value)}
                  onClick={() => onChipClick(value)}
                >
                  {value}
                </button>
              ))
            )}
          </div>
          <p className="fb-tip">
            Tap a word, then tap a blank — or drag it in. Tap a filled blank to send it back.
          </p>
        </>
      )}

      {feedback && <Feedback variant={feedback.variant}>{feedback.text}</Feedback>}

      <WhyPanel solved={solved} solution={step.solution} />

      {solved ? (
        <button type="button" className="btn btn--primary" onClick={onCorrect}>
          Continue →
        </button>
      ) : (
        <button type="button" className="btn btn--primary" onClick={submit} disabled={!allFilled}>
          {feedback?.variant === 'error' ? 'Try again' : allFilled ? 'Check' : 'Fill every blank'}
        </button>
      )}
    </div>
  )
}
