import { useCallback, useEffect, useRef, useState } from 'react'
import {
  generatePractice,
  localSocraticReply,
  socraticChat,
  type ChatMessage,
  type GeneratedProblem,
  type StruggleContext,
} from '../lib/ai'
import type { ConceptId } from '../lib/physics'
import { CONCEPTS } from '../lib/physics'
import { toBarDragStep } from '../lib/practiceProblem'
import { PhysicsText } from '../lib/physicsText'
import { BarDragStepView } from './steps/BarDragStepView'

type Tab = 'guided' | 'practice'

type Props = {
  lessonTitle: string
  conceptId?: ConceptId
  question: StruggleContext
  onClose: () => void
}

export function AiTutorSidebar({ lessonTitle, conceptId, question, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('guided')

  return (
    <>
      <div className="tutor-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="tutor" role="dialog" aria-label="AI study helper">
        <header className="tutor__head">
          <button type="button" className="tutor__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <span className="tutor__avatar">
            <img src="/brock.png" alt="Brock the broccoli tutor" />
          </span>
          <div className="tutor__brandtext">
            <span className="tutor__eyebrow">Ask Brock</span>
            <h2 className="tutor__title">Your study buddy</h2>
          </div>
        </header>

        <nav className="tutor__tabs">
          <button
            type="button"
            className={`tutor__tab ${tab === 'guided' ? 'is-active' : ''}`}
            onClick={() => setTab('guided')}
          >
            Guided help
          </button>
          <button
            type="button"
            className={`tutor__tab ${tab === 'practice' ? 'is-active' : ''}`}
            onClick={() => setTab('practice')}
          >
            Easier practice
          </button>
        </nav>

        <div className="tutor__body">
          {tab === 'guided' ? (
            <GuidedTab lessonTitle={lessonTitle} conceptId={conceptId} question={question} />
          ) : (
            <PracticeTab conceptId={conceptId} />
          )}
        </div>
      </aside>
    </>
  )
}

function openingLine(question: StruggleContext, conceptId?: ConceptId): string {
  if (typeof question.correctValue !== 'number') {
    return "Ask me anything about this step — I can explain it a different way, give an example, or break down why it works. What's tripping you up?"
  }
  const formula = conceptId ? `the formula for ${CONCEPTS[conceptId].name}` : 'which formula applies here'
  return `Let's work through this together — I won't just hand you the answer. First: do you remember ${formula}?`
}

function GuidedTab({
  lessonTitle,
  conceptId,
  question,
}: {
  lessonTitle: string
  conceptId?: ConceptId
  question: StruggleContext
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: openingLine(question, conceptId) },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const send = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    const next: ChatMessage[] = [...messages, { role: 'user', text: trimmed }]
    setMessages(next)
    setInput('')
    setSending(true)
    // Only the learner turns are sent as history; the opening line is ours.
    const history = next.filter((_, i) => i > 0)
    const reply = await socraticChat(history, { lessonTitle, question })
    setMessages([
      ...next,
      { role: 'model', text: reply ?? localSocraticReply(history, { question }) },
    ])
    setSending(false)
  }, [input, sending, messages, lessonTitle, question])

  return (
    <div className="tutor__chat">
      <div className="tutor__messages">
        {messages.map((m, i) =>
          m.role === 'model' ? (
            <div key={i} className="tutor__row">
              <span className="tutor__msg-avatar">
                <img src="/brock.png" alt="" />
              </span>
              <div className="tutor__msg tutor__msg--model">
                <PhysicsText text={m.text} />
              </div>
            </div>
          ) : (
            <div key={i} className="tutor__msg tutor__msg--user">
              <PhysicsText text={m.text} />
            </div>
          ),
        )}
        {sending && (
          <div className="tutor__row">
            <span className="tutor__msg-avatar">
              <img src="/brock.png" alt="" />
            </span>
            <div className="tutor__msg tutor__msg--model tutor__msg--typing">
              <span className="tutor__dot" />
              <span className="tutor__dot" />
              <span className="tutor__dot" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="tutor__compose">
        <input
          className="tutor__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Ask Brock…"
          aria-label="Ask Brock a question"
        />
        <button
          type="button"
          className="btn btn--primary tutor__send"
          onClick={() => void send()}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>

      {question.solution && (
        <div className="tutor__reveal">
          {showSolution ? (
            <div className="tutor__solution">
              <p className="tutor__section-label">Full solution</p>
              <PhysicsText text={question.solution} block className="tutor__walkthrough-body" />
            </div>
          ) : (
            <button
              type="button"
              className="tutor__reveal-btn"
              onClick={() => setShowSolution(true)}
            >
              Still stuck? Show the full solution
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PracticeTab({ conceptId }: { conceptId?: ConceptId }) {
  const [problem, setProblem] = useState<GeneratedProblem | null>(null)
  const [loading, setLoading] = useState(true)
  const [keyN, setKeyN] = useState(0)
  const [solved, setSolved] = useState(0)

  const load = useCallback(async () => {
    if (!conceptId) return
    setLoading(true)
    const next = await generatePractice(conceptId, 'easy')
    setProblem(next)
    setKeyN((k) => k + 1)
    setLoading(false)
  }, [conceptId])

  useEffect(() => {
    void load()
  }, [load])

  if (!conceptId) {
    return (
      <div className="tutor__pane">
        <p className="tutor__empty">
          Fresh practice isn't available for this topic yet — try the Guided help tab.
        </p>
      </div>
    )
  }

  const step = problem ? toBarDragStep(problem) : null

  return (
    <div className="tutor__practice tutor__pane">
      <p className="tutor__section-label">
        Easier {CONCEPTS[conceptId].name} reps · {solved} solved
      </p>
      {loading || !step ? (
        <div className="tutor__loading">
          <span className="tutor__spinner" /> Generating an easier problem…
        </div>
      ) : (
        <BarDragStepView
          key={keyN}
          step={step}
          draft={null}
          onDraftChange={() => {}}
          onCorrect={() => void load()}
          onAttempt={(_a, correct) => {
            if (correct) setSolved((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
