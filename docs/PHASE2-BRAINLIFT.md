# Phynesse — Phase 2 (AI Features) Brainlift

**Decision record.** What we considered, what we're shipping, and what we deliberately left out.

**Unit:** AP Physics 1 — Unit 4: Work, Power & Energy (6 lessons, L1–L6).
**Stack:** React 19 + TypeScript + Vite + Firebase v12. Auth + Firestore already wired; Firebase AI Logic (Gemini) is available client-side. Planned physics core: [`math.js`](https://mathjs.org).

---

## 1. Context

Phynesse is a learn-by-doing physics app. Each lesson is **structured JSON**, not prose: a sequence of typed steps (`concept`, `compare_slider`, gradeable `bar_drag` / `predict_numeric`, and `complete`) defined in `src/types/lesson.ts`. Every gradeable step already carries the exact fields an AI feature needs — `correctValue`, `tolerance`, `hints[]`, `givens`, `formulas`, and a worked `solution`. Grading is deterministic (`src/lib/grading.ts`), and every attempt is logged to Firestore via `logStepAttempt` with `{ answer, correct, hintShown, stepType, lessonId, stepIndex }` (`src/lib/progressFirestore.ts`).

The Phase 2 goal is to add AI that **genuinely helps a learner**, with four hard constraints:

1. Ground every AI feature in the lesson's **structured state**, never raw text scraping.
2. **Verify anything checkable** against subject logic — the AI must never surface a wrong number.
3. Use a **math engine** to recompute, so correctness is owned by code, not the model.
4. The MVP must keep working with **AI turned off** — AI is additive, never load-bearing.

---

## 2. Guiding principle

> **AI proposes, a deterministic physics engine disposes.**

The AI never produces the answer or the grade. A small **physics core** built on `math.js` evaluates the closed-form formulas this unit already teaches and recomputes/verifies every AI output *before* a learner sees it:

| Quantity | Formula | Appears in |
| --- | --- | --- |
| Work | `W = F·d` (and `W = F·d·cos θ`) | L1 |
| Kinetic energy | `KE = ½mv²` | L2 |
| Gravitational PE | `U_g = mgh` | L3 |
| Elastic PE | `U_s = ½kx²` | L4 |
| Power | `P = W/Δt` (and `P = F·v`) | L6 |

Why this satisfies the rubric directly:

- **"Verify against subject logic"** — the engine *is* the subject logic. AI-proposed parameters are plugged into the canonical formula and the result is the source of truth.
- **"AI never gives a wrong answer"** — the AI's number is discarded; only the engine's recomputed value is ever shown or graded. A model hallucination can at worst be *rejected*, never *displayed as correct*.

---

## 3. Options considered

The rubric offered four candidate AI features. Assessed against *this* app:

### (a) Generate new practice problems at the right difficulty
- **Fit: high.** A `bar_drag` / `predict_numeric` step is just `{ givens, formula, correctValue, tolerance, hints }` — a small, fully-specified schema the AI can fill.
- **Value: high.** A 6-lesson unit runs out of practice fast; infinite fresh problems is the highest-leverage win.
- **Verifiability: high.** The engine recomputes `correctValue` from the AI's `givens`, so the answer is never trusted to the model.

### (b) Targeted hint when stuck, without giving the answer
- **Fit: high.** Every step already has `hints[]` and a worked `solution` for grounding and fallback.
- **Value: high.** The current `hintForNumeric` just walks a static array by attempt index; AI can tailor phrasing to the learner's actual wrong answer.
- **Verifiability: medium** — but tractable. We can mechanically check the AI's text does **not** contain `correctValue`, and fall back to the static hint if it does.

### (c) Adapt the path / pick the next lesson based on struggles
- **Fit: low for the core unit.** L1→L6 is a deliberate linear conceptual build (work → KE → PE → conservation → power). Re-ordering it would break pedagogy.
- **Value: medium, but only at the end.** Firestore attempt logs make a *review set* feasible, not a live re-route.
- **Verifiability: high** (it just selects existing/generated problems). Deferred to **Stretch**.

### (d) Explain a wrong answer in plain language, tuned to what the learner did
- **Fit: high.** `givens` + `correctValue` + the learner's logged `answer` is exactly enough to diagnose *which* misconception produced that number.
- **Value: high.** "You got 9 J because you swapped m and v" beats a generic "try again."
- **Verifiability: high.** We compute the misconception values deterministically; the AI only phrases the diagnosis. Folded into Feature 2 alongside hints.

---

## 4. What we're shipping

Both features consume the same grounded state object and are gated behind a single `aiEnabled` flag. With the flag off, the app behaves exactly as the current MVP.

```ts
type AiContext = {
  concept: string          // e.g. "Kinetic Energy"
  formula: string          // e.g. "KE = ½mv²"
  params: Record<string, number>   // AI-proposed, engine-validated
  givens: { label: string; value: string }[]
  correctValue: number     // always the engine's value, never the AI's
  learnerAnswer?: number
  attempt: number
}
```

### Feature 1 — Infinite practice generator

- AI returns **structured params + scenario wording** as JSON via Gemini `responseSchema` (e.g. `{ scenario, formulaId, givens: { m, v }, unit }`) — it does **not** return the answer.
- The **physics core recomputes** `correctValue` from the returned `givens` using `math.js`, then runs **range + sanity validation**: params within pedagogically sane bounds, no negative masses, result is a "nice" number (sensible magnitude and rounding for the step's `tolerance`). Anything failing validation is rejected and regenerated.
- The validated problem renders as a **normal `bar_drag` / `predict_numeric` step** — identical UI, identical deterministic grading via `gradeNumeric`, identical Firestore logging. The AI output becomes plain lesson content.
- **Deterministic template fallback:** with AI off (or on validation failure), a hand-built parametric template (same formula, randomized in-range givens) produces a valid problem. The feature degrades, it doesn't disappear.

*Example:* generator emits `KE = ½mv²` with `m = 3, v = 2`; the engine computes `correctValue = ½·3·2² = 6 J`, confirms it's nicely bounded, and ships it as a `predict_numeric` step.

### Feature 2 — Tuned hints + wrong-answer explanations

- **Deterministic misconception diagnosis first.** When a learner submits a wrong answer, the engine computes what they *would* have gotten under each common error, and matches against their logged `answer`:
  - forgot the **½** → `mv²`
  - **forgot to square v** / used `v` not `v²` → `½mv`
  - **swapped m and v** → e.g. `m=3, v=2` gives `6 J`, but `½·2·3² = 9 J` (catches the classic "9").
  - used **g = 10** instead of 9.8 (L3/L6).
- **Then the AI phrases it** — turning the matched misconception into a friendly, one-sentence nudge grounded in `{ concept, formula, givens, learnerAnswer, attempt }`.
- **Guardrails:**
  - hint text is rejected if it contains the `correctValue` number (regex check) — it must not leak the answer.
  - hard **length cap** on output.
  - on any failure (no match, leak, timeout, AI off) → fall back to the **existing static `hints[]`** via `hintForNumeric`.

Both features are **grounded in structured state**, never free text, and both have a deterministic path that runs unchanged when `aiEnabled === false`.

---

## 5. Stretch (not in initial scope)

**End-of-unit adaptive review set.** After L6, read the learner's Firestore attempt logs (`fetchAttempts`), rank concepts by error rate and hint usage, and assemble a targeted review set — reusing Feature 1's generator to mint fresh problems on the weakest formulas. This is the *realistic* form of "adapt the path" for a short linear unit: it personalizes **what you review**, not the lesson order. Deferred because it depends on a meaningful volume of logged attempts and on Feature 1 being stable.

---

## 6. Deliberately left out (and why)

- **Generic chatbot tutor** — ungrounded and unverifiable free-text Q&A. Explicitly discouraged by the rubric; it has no anchor in the structured state and no way to guarantee correctness.
- **AI grading of free-text answers** — correctness must be owned by the engine (`gradeNumeric` + `tolerance`). Letting a model decide right/wrong directly violates "AI never gives a wrong answer."
- **AI authoring whole new lessons / diagrams** — concept copy and the hand-tuned `visual` / `demo` interactives are a quality and safety surface we won't hand to a model; not cleanly verifiable.
- **Full branching adaptive path** — overkill and pedagogically wrong for a 6-lesson linear build. The end-of-unit review set (Stretch) captures the real value at a fraction of the complexity.

---

## 7. Verification & safety summary

- **Problem generation** — validated end to end: in-range params, engine-**recomputed** answer (never the AI's), and a sanity/"nice-number" check before the step renders.
- **Hints & explanations** — misconception diagnosed deterministically; AI phrasing checked for **answer leakage** and length; **static-hint fallback** on any failure.
- **All math via the `math.js` engine** — one source of truth for `W=Fd`, `KE=½mv²`, `U_g=mgh`, `U_s=½kx²`, `P=W/Δt`; the AI only proposes inputs and wording.
- **`aiEnabled` flag** — every AI path has a deterministic fallback; the MVP runs identically with AI off.
- **Firebase App Check** is a security requirement before enabling client-side Gemini calls — it gates the AI endpoints so the model and quota can't be abused by unauthenticated traffic.
