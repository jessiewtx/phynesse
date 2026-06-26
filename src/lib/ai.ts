import { getAI, getGenerativeModel, GoogleAIBackend, Schema, type GenerativeModel } from 'firebase/ai'
import { app, isFirebaseConfigured } from './firebase'
import {
  CONCEPTS,
  randomProblem,
  validateProblem,
  type Concept,
  type ConceptId,
} from './physics'

const flagOff = (import.meta.env.VITE_AI_ENABLED as string | undefined) === 'false'

/** OpenAI is the preferred provider (more reliable than Gemini's tiny free tier).
 *  Two ways to enable it:
 *    1. VITE_OPENAI_PROXY_URL — a server-side proxy (Cloudflare Worker) that holds
 *       the key and injects it. The browser never sees the key, so this is the
 *       SAFE option for the deployed site.
 *    2. VITE_OPENAI_API_KEY — calls OpenAI directly with the key. This bakes the
 *       key into the browser bundle, so use it for LOCAL dev ONLY. */
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'
/** Override for company gateways / proxies (no trailing slash). */
const OPENAI_BASE_URL =
  (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://api.openai.com/v1'
/** Server-side proxy endpoint that injects the key (preferred for production). */
const OPENAI_PROXY_URL = (import.meta.env.VITE_OPENAI_PROXY_URL as string | undefined)?.replace(
  /\/$/,
  '',
)
export const openaiEnabled = !!OPENAI_KEY || !!OPENAI_PROXY_URL

/** Master switch. With this false, the app falls back to its non-AI behavior. */
export const aiEnabled = (isFirebaseConfigured || openaiEnabled) && !flagOff

/** Rejects if the wrapped promise hasn't settled in `ms` — guards against a
 *  hanging model call leaving the UI stuck in a loading state. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('ai-timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

/**
 * Google's free tier caps each model to a tiny per-day quota, so we keep a list
 * of candidates and rotate to the next one on a quota/availability error. This
 * multiplies the effective free quota and keeps the AI working when any single
 * model is throttled. A single model can be forced via VITE_AI_MODEL.
 */
const MODEL_CANDIDATES: string[] = import.meta.env.VITE_AI_MODEL
  ? [import.meta.env.VITE_AI_MODEL as string]
  : [
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
    ]

const modelCache = new Map<string, GenerativeModel>()
/** Index of the model that last worked — tried first next time. */
let preferredIdx = 0

function getModelByName(name: string): GenerativeModel | null {
  if (!aiEnabled || !app) return null
  let m = modelCache.get(name)
  if (!m) {
    const ai = getAI(app, { backend: new GoogleAIBackend() })
    m = getGenerativeModel(ai, { model: name })
    modelCache.set(name, m)
  }
  return m
}

type GenReq = Parameters<GenerativeModel['generateContent']>[0]

/**
 * Runs a request against the candidate models in order (preferred first),
 * skipping any that error (e.g. 429 quota). Returns the response text, or null
 * if every candidate fails — callers then fall back to non-AI behavior.
 */
async function generateText(req: GenReq): Promise<string | null> {
  if (!aiEnabled || !app) return null
  const order = [preferredIdx, ...MODEL_CANDIDATES.keys()].filter(
    (v, i, a) => a.indexOf(v) === i,
  )
  for (const idx of order) {
    const name = MODEL_CANDIDATES[idx]
    const m = getModelByName(name)
    if (!m) continue
    try {
      const res = await withTimeout(m.generateContent(req), 15000)
      const text = res.response.text().trim()
      if (text) {
        preferredIdx = idx
        return text
      }
    } catch {
      // try the next candidate (quota, availability, transient, etc.)
    }
  }
  return null
}

type ChatRole = 'system' | 'user' | 'assistant'

/**
 * Calls OpenAI's Chat Completions API. Returns the reply text, or null if no key
 * is set or the request fails — callers then fall back to Gemini / non-AI.
 */
async function openaiComplete(
  messages: { role: ChatRole; content: string }[],
  opts?: { json?: boolean },
): Promise<string | null> {
  if (!OPENAI_KEY && !OPENAI_PROXY_URL) return null
  // Prefer the proxy (key stays server-side); otherwise call OpenAI directly.
  const usingProxy = !!OPENAI_PROXY_URL
  const endpoint = usingProxy ? OPENAI_PROXY_URL! : `${OPENAI_BASE_URL}/chat/completions`
  try {
    const res = await withTimeout(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(usingProxy ? {} : { Authorization: `Bearer ${OPENAI_KEY}` }),
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature: opts?.json ? 0.9 : 0.6,
          ...(opts?.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      }),
      20000,
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  }
}

// ── Feature 1: practice generation ──────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard'

export type GeneratedProblem = {
  conceptId: ConceptId
  params: Record<string, number>
  value: number
  scenario: string
  source: 'ai' | 'fallback'
}

function fallbackScenario(concept: Concept, params: Record<string, number>): string {
  const givens = concept.vars
    .map((v) => `${v.label} = ${params[v.symbol]} ${v.unit}`)
    .join(' and ')
  return `Given ${givens}, find ${concept.resultSymbol}.`
}

/**
 * The AI proposes wording + parameters; the physics core recomputes and
 * validates the answer. If the AI is off or returns something invalid, a
 * deterministic generator produces an equally valid problem.
 */
export async function generatePractice(
  conceptId: ConceptId,
  difficulty: Difficulty = 'medium',
): Promise<GeneratedProblem> {
  const concept = CONCEPTS[conceptId]

  if (aiEnabled) {
    const ranges = concept.vars
      .map((v) => `${v.symbol} (${v.label}, ${v.unit}): ${v.min}–${v.max}, step ${v.step}`)
      .join('; ')
    const prompt =
      `Create one ${difficulty} AP Physics 1 practice problem for ${concept.name} ` +
      `(formula ${concept.display}). Choose parameter values within these ranges, ` +
      `snapped to the step: ${ranges}. Write a single-sentence real-world scenario that ` +
      `states those values and asks the student to find ${concept.resultSymbol} (in ${concept.unit}). ` +
      `Use the numeric values in the sentence. Do NOT include or hint at the answer.`

    try {
      // Provider 1: OpenAI (JSON mode).
      const valueKeys = concept.vars.map((v) => `"${v.symbol}": number`).join(', ')
      let text = await openaiComplete(
        [
          {
            role: 'system',
            content:
              'You write AP Physics 1 practice problems. Respond ONLY with JSON of the form ' +
              `{"scenario": string, "values": { ${valueKeys} } }. Plain text only, no LaTeX.`,
          },
          { role: 'user', content: prompt },
        ],
        { json: true },
      )

      // Provider 2: Gemini (structured schema) when OpenAI is unavailable.
      if (!text) {
        const schema = Schema.object({
          properties: {
            scenario: Schema.string(),
            values: Schema.object({
              properties: Object.fromEntries(
                concept.vars.map((v) => [v.symbol, Schema.number()]),
              ),
            }),
          },
        })
        text = await generateText({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 1,
          },
        })
      }

      if (text) {
        const parsed = JSON.parse(text) as { scenario?: string; values?: Record<string, number> }
        const check = validateProblem(conceptId, parsed.values ?? {})
        if (check.ok && parsed.scenario && parsed.scenario.trim().length > 0) {
          return {
            conceptId,
            params: check.params,
            value: check.value,
            scenario: stripLatex(parsed.scenario),
            source: 'ai',
          }
        }
      }
    } catch {
      // fall through to deterministic generation
    }
  }

  const { params, value } = randomProblem(conceptId)
  return { conceptId, params, value, scenario: fallbackScenario(concept, params), source: 'fallback' }
}

// ── Feature 2: Socratic AI helper (guided, no answer given) ─────────────────

/** Failed attempts on one question before the Socratic helper steps in. */
export const AI_HELP_AFTER = 2

/**
 * The thing the learner wants help with on the CURRENT step. For a numeric
 * problem this carries the engine-verified answer/solution (kept secret by the
 * tutor); for a concept/teaching step the answer fields are omitted and the
 * tutor simply explains the idea.
 */
export type StruggleContext = {
  /** 'problem' = has a numeric answer to protect; 'concept'/'explore' = teach. */
  kind?: 'problem' | 'concept' | 'explore'
  prompt: string
  formulas?: string[]
  givens?: { label: string; value: string }[]
  correctValue?: number
  unit?: string
  /** The full worked solution (ground truth for the tutor — never shown by it). */
  solution?: string
}

export type ChatMessage = { role: 'user' | 'model'; text: string }

/** Converts any LaTeX/markdown math the model emits into plain physics text. */
function stripLatex(s: string): string {
  return s
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .replace(/\$+/g, '')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)')
    .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\,|\\!|\\;|\\:|\\ /g, ' ')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\*\*/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/** Catches a reply that would hand over the final number despite instructions. */
function mentionsAnswer(text: string, value: number): boolean {
  const nums = text.match(/\d+(?:\.\d+)?/g) ?? []
  return nums.some((n) => Math.abs(Number(n) - value) < Math.max(Math.abs(value) * 0.005, 1e-6))
}

/**
 * A Socratic tutor for one stuck question. It is given the verified answer/solution
 * as ground truth but is instructed to NEVER reveal it — instead it asks one short
 * guiding question or hint at a time and leads the learner to the answer. A guard
 * rewrites any reply that slips and states the number.
 */
export async function socraticChat(
  history: ChatMessage[],
  ctx: { lessonTitle: string; question: StruggleContext },
): Promise<string | null> {
  if (!aiEnabled) return null

  const q = ctx.question
  const hasAnswer = typeof q.correctValue === 'number'
  const formulas = q.formulas?.length ? q.formulas.join('; ') : '(the relevant formula)'
  const givens = q.givens?.length ? q.givens.map((g) => `${g.label} = ${g.value}`).join(', ') : ''

  const noLatex =
    `Write in plain text only. Do NOT use LaTeX or markdown math: no "$", no "\\cdot", ` +
    `no "\\frac". Use plain symbols like ·, ×, ÷, ², Δ, and write fractions as a/b.`

  const base =
    `You are a warm, encouraging AP Physics 1 tutor in the lesson "${ctx.lessonTitle}". ` +
    `The student wants help with this:\n${q.prompt}\n` +
    (q.formulas?.length ? `Relevant formula(s): ${formulas}\n` : '') +
    (givens ? `Given: ${givens}\n` : '')

  const preamble = hasAnswer
    ? base +
      `For YOUR reference only, the correct answer is ${q.correctValue} ${q.unit ?? ''} and the ` +
      `worked solution is: ${q.solution ?? '(apply the formula)'}\n\n` +
      `RULES:\n` +
      `- NEVER reveal the final answer or compute the whole thing for them BEFORE they do.\n` +
      `- BUT if the student states the correct final value (${q.correctValue}), confirm warmly ` +
      `that they nailed it and congratulate them — do NOT keep withholding or say "you're close."\n` +
      `- Ask ONE short guiding question or give ONE small hint at a time (1–2 sentences).\n` +
      `- Start by checking what they know (e.g., the right formula), then build step by step.\n` +
      `- Respond to what the student ACTUALLY just said. Don't assume work they haven't mentioned.\n` +
      `- If they ask for the answer, nudge them through one more step instead of giving it.\n` +
      `- ${noLatex}\n` +
      `- Be encouraging and concrete about the quantities in this problem.`
    : base +
      `\nThis is a concept/teaching step — there is no single numeric answer. Your job is to help ` +
      `the student UNDERSTAND it.\n\n` +
      `RULES:\n` +
      `- Answer the student's ACTUAL question clearly and concretely (1–3 sentences).\n` +
      `- Use intuitive explanations, everyday analogies, and small concrete examples.\n` +
      `- You MAY explain why a formula works and walk through the reasoning.\n` +
      `- Keep it conversational; when useful, end with a quick check-for-understanding question.\n` +
      `- ${noLatex}`

  // Provider 1: OpenAI (better at staying Socratic + plain text).
  let raw = await openaiComplete([
    { role: 'system', content: preamble },
    ...history.map((h) => ({
      role: (h.role === 'model' ? 'assistant' : 'user') as ChatRole,
      content: h.text,
    })),
  ])

  // Provider 2: Gemini rotation when OpenAI is unavailable.
  if (!raw) {
    const contents = [
      { role: 'user' as const, parts: [{ text: preamble }] },
      { role: 'model' as const, parts: [{ text: "Understood — I'll guide, not give it away." }] },
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    ]
    raw = await generateText({ contents })
  }

  if (!raw) return null
  const text = stripLatex(raw)
  // Only censor the bot leaking the answer if there IS a numeric answer AND the
  // student hasn't already reached it. Once they state the value, confirm it.
  if (hasAnswer) {
    const lastUser = [...history].reverse().find((h) => h.role === 'user')?.text ?? ''
    const studentHasAnswer = mentionsAnswer(lastUser, q.correctValue!)
    if (!studentHasAnswer && mentionsAnswer(text, q.correctValue!)) {
      return "You're really close — put your numbers into the formula and tell me the value you get."
    }
  }
  return text
}

/** Heuristic: is the learner signalling confusion rather than attempting? */
const CONFUSION_RE =
  /\b(idk|dunno|don'?t\s*(get|know|understand)|no\s*idea|no|nope|nah|not|still|confus|lost|stuck|huh|what'?s?|help|why|how)\b|^\s*[?]+\s*$/i

function isConfusion(text: string): boolean {
  const t = text.trim()
  return t.length <= 3 || CONFUSION_RE.test(t)
}

/** "F", "F and d", or "F, d, and θ" — never with a stray dash near math. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/** The numeric part of a given value, keeping a trailing degree sign. */
function valueNumber(value: string): string {
  const m = value.match(/-?\d+(?:\.\d+)?\s*°?/)
  return (m ? m[0] : value).replace(/\s+/g, '')
}

/**
 * Substitutes each given's value into the formula in place of its symbol, so we
 * can show the learner the set-up expression (numbers in, not yet computed).
 * Returns null if we can't confidently rewrite it.
 */
function substituteFormula(
  formula: string,
  givens: { label: string; value: string }[],
): string | null {
  if (!formula || givens.length === 0) return null
  let out = formula
  for (const g of givens) {
    const sym = g.label.trim()
    if (!sym) continue
    const num = valueNumber(g.value)
    // Replace the standalone symbol (not part of a longer word like "cos").
    const re = new RegExp(`(^|[^A-Za-z])${escapeRe(sym)}(?![A-Za-z])`, 'g')
    out = out.replace(re, (_m, pre) => `${pre}${num}`)
  }
  return out === formula ? null : out
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Deterministic, quota-free Socratic fallback. When the AI is off or every model
 * is exhausted, this keeps the guided chat useful and RESPONSIVE: if the learner
 * signals confusion it steps DOWN to more concrete help (escalating each time
 * they stay stuck); otherwise it advances through formula → givens → substitute →
 * compute. It never states the final number and avoids repeating itself.
 */
export function localSocraticReply(
  history: ChatMessage[],
  ctx: { question: StruggleContext },
): string {
  const q = ctx.question
  const userMsgs = history.filter((m) => m.role === 'user')
  const last = userMsgs[userMsgs.length - 1]?.text ?? ''
  const formula = q.formulas?.[0]
  const givens = q.givens ?? []
  const givenStr = givens.map((g) => `${g.label} = ${g.value}`).join(', ')
  const letters = joinList(givens.map((g) => g.label))
  const substituted = formula ? substituteFormula(formula, givens) : null

  if (isConfusion(last)) {
    let streak = 0
    for (let i = userMsgs.length - 1; i >= 0; i--) {
      if (isConfusion(userMsgs[i].text)) streak++
      else break
    }
    const ladder = [
      formula
        ? `No worries, let's slow right down. The whole formula you need is "${formula}". In it, ${
            letters ? `${letters} are simply the values the problem gives you` : 'each letter is a value from the problem'
          }. Does that part make sense?`
        : `No worries, let's slow down. What two or three quantities does the problem give you?`,
      givenStr
        ? `Here's the key. The problem gives you these values: ${givenStr}. Put each one into "${
            formula ?? 'the formula'
          }" wherever its matching letter appears.`
        : `Pull each number out of the problem and place it into the formula where the matching letter is.`,
      formula
        ? `Next, rewrite "${formula}" with those numbers in place of the letters, then do the arithmetic${
            q.unit ? ` (your answer comes out in ${q.unit})` : ''
          }. Want to try that one step?`
        : `Substitute the numbers in, then do the arithmetic${q.unit ? ` (answer in ${q.unit})` : ''}.`,
      substituted
        ? `Here, I'll set it up for you: ${substituted}. That's everything plugged in — now just work out that expression and the result${
            q.unit ? ` (in ${q.unit})` : ''
          } is your answer.`
        : `Plug your numbers straight into the formula, then compute that expression for your answer${
            q.unit ? ` in ${q.unit}` : ''
          }.`,
      `No problem at all. Tap "Show the full solution" below and you'll see every step worked out, including the final number.`,
    ]
    return ladder[Math.min(streak - 1, ladder.length - 1)]
  }

  const progress = userMsgs.filter((m) => !isConfusion(m.text)).length
  const stages = [
    formula
      ? `Good thinking. The formula here is "${formula}". Which value in the problem goes with each letter?`
      : `Good start. Which formula connects the quantities in this problem?`,
    givenStr
      ? `Nice. Now plug your givens (${givenStr}) into "${formula ?? 'the formula'}". What does it look like with the numbers in?`
      : `Now substitute the values the problem gives you into the formula.`,
    `Great. Now compute that${q.unit ? `, keeping your answer in ${q.unit}` : ''}. What number do you get?`,
    `You're almost there. Finish the arithmetic and that's your answer. If you'd like to check the steps, tap "Show the full solution" below.`,
  ]
  return stages[Math.min(Math.max(progress - 1, 0), stages.length - 1)]
}
