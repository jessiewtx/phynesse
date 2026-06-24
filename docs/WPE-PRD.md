# Phynesse — Product Requirements Document

**What:** a learn-by-doing web app that teaches **AP Physics 1 · Unit 4 (Work, Power & Energy)** in depth.
**Status:** v1.0 · live at `phynesse-wpe.web.app`

---

## 1. Problem & solution

AP Physics students can recite `KE = ½mv²` and still have no idea *when* to use energy instead of kinematics. Energy gets memorized as formulas, not understood as a story. Videos and quizzes don't fix this — you can watch someone solve a problem all day and still freeze on your own.

**Phynesse teaches by doing.** Every step drops the learner into a problem they manipulate — drag an energy bar, change a pull angle, set a speed — get instant feedback, and *then* see the idea named. They play with a concept until it clicks. One unit, taught deep, instead of a shallow tour of physics.

**Why it's different:** Brilliant's guess-then-teach loop fused with a Khan-style visible mastery ladder, focused on a single unit so the path actually knows where you are.

---

## 2. User persona

**Alex — 17, junior taking AP Physics 1.**

- **Context:** AP exam in ~6 weeks. Solid on kinematics; energy feels like disconnected formulas.
- **Behavior:** studies on their **phone** in 10–15 minute bursts, usually at night. Bails instantly if instructions are long or the UI is fiddly.
- **Frustration:** "I can plug into the formula but I don't know which one to use, or why."
- **Success looks like:** Alex can sketch the energy story before calculating, knows when energy conservation applies, and reaches for work-energy over kinematics because it's faster.

---

## 3. Core user story

> **As Alex, I want to work through a physics concept hands-on and get told exactly where I went wrong, so I actually understand it instead of memorizing it — and I want to pick up where I left off when I come back on my phone.**

**Acceptance criteria**

- Each lesson is a sequence of interactive steps, not a wall of text — at least one step the learner directly manipulates.
- Every answer gets instant (<100 ms), specific feedback; wrong answers get a hint, then a full worked solution.
- Leaving mid-lesson and returning (any device) restores the exact step and progress.
- Finishing a lesson updates a visible streak and recommends a sensible next step.

---

## 4. MVP scope

### In scope (built)

| Area | What ships |
|---|---|
| **Course** | 6-lesson path through the full WPE unit (~60 steps), linear, building L1 → L6 |
| **Interactions** | numeric entry, drag-to-set energy bars, draggable problem scenes, compare-sliders — **no multiple choice** |
| **Visuals** | 8 interactive SVG explorers (e.g. drag a rope's angle, a speedometer, compress a spring) with live formulas/bars |
| **Feedback** | hand-written per-step hints + a worked `solution` on every problem; closed-form grading |
| **Progress** | step-level resume; per-lesson mastery model + a `/progress` dashboard with a next-step recommendation |
| **Habit loop** | streak (advances only on lesson completion) + milestones + a completion celebration |
| **Accounts** | Firebase Auth (Google + email); guest mode that **migrates into your account** on sign-in |
| **Platform** | responsive/touch; works on phone screens; public deploy |

### Out of scope (for now)

AI features (hints/generation) · spaced-repetition drills · the L7 mixed-practice capstone · teacher dashboard · additional units. *(Roadmap, §8.)*

---

## 5. How it works

**Content model.** Lessons are JSON arrays of typed steps, so new lessons plug in without UI changes (and AI can emit the same schema later):

```typescript
type Step =
  | { type: 'concept';         body; equation?; visual?; demo? }
  | { type: 'predict_numeric'; prompt; correctValue; unit; tolerance; hints[]; givens?; formulas?; solution; visual? }
  | { type: 'compare_slider';  prompt; formula; result; scene?; solution }
  | { type: 'bar_drag';        prompt; correctValue; tolerance; hints[]; solution }
  | { type: 'complete';        nextLessonId }
type Lesson = { id; title; order; summary?; steps: Step[] }
```

**Lesson shape.** Each lesson runs *misconception-first concept → interactive explorer → proportional-reasoning compare-slider → scaffolded multi-part problems → worked solution.* Difficulty ramps from "what work actually is" (L1) to multi-concept AP problems with friction, ramps, and angles (L4–L5).

**Feedback & grading.** Physics is graded closed-form (numeric within ±2–5% tolerance), so feedback is instant and offline. Authored `hints[]` escalate per attempt; the full `solution` powers a *Why?* panel after a correct answer and a *Stuck?* walkthrough after 3 misses.

**Mastery & habit.** A mastery function scores each lesson from accuracy, first-try rate, and time-decayed retention, assigns a named level (*learning → proficient → skilled → mastered*), builds a review queue, and picks the next step (resume → review → start next). Streaks advance only when real work is completed — never on app-opens.

---

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | fast SPA; one generic step renderer drives all lessons |
| **Visuals** | hand-built SVG + CSS, `requestAnimationFrame` | crisp, lightweight, 60 fps without a physics/canvas engine |
| **Physics/grading** | deterministic closed-form formulas | predictable, instant grading; ground truth for future AI checks |
| **Auth** | Firebase Auth (Google + email/password) | low-friction sign-in + display name |
| **Database** | Firestore (per-user, rules-scoped) | progress, attempts, streak; cross-device sync |
| **Hosting** | Firebase Hosting | public CDN deploy; multi-user, stateless client |
| **Content** | versioned JSON in repo | add lessons without redeploying logic; AI-emittable schema |

---

## 7. Success metrics

**North star:** concepts taken to *proficient* per active learner per week — it only moves if someone genuinely learns.

| Supporting metric | Target |
|---|---|
| Time to first interaction | < 2 s |
| Lesson completion rate | 50–60% |
| Wrong → recover rate (continues after a miss) | ≥ 60% |
| D1 / D7 retention | ≥ 35% / ≥ 15% |

---

## 8. Roadmap (post-MVP)

- **AI assist** — targeted hints from the learner's actual wrong answer, plain-language wrong-answer explanations, and new practice generated at the right difficulty. Guardrail: the model shapes *wording*; a math engine (math.js/SymPy) verifies every number, and abstains if it can't. App always works with AI off.
- **Learning science** — spaced resurfacing of low-retention concepts, an interleaved L7 capstone (≥70% to finish the unit), and mastery-gated lesson unlocking (the gating UI is already built, currently dormant).

---

## 9. Open questions

1. Require sign-in up front, or allow one free lesson then prompt?
2. Capstone reward: in-app badge, or exportable certificate?
3. When gating turns on, which mastery level unlocks the next lesson — *proficient* or *skilled*?
