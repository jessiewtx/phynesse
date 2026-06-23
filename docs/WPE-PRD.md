# Phynesse — AP Physics 1: Work, Power & Energy

**Product:** Phynesse · **Subject:** AP Physics 1 Unit 4 (WPE) · **Phase:** 1 — MVP · **Status:** PRD v0.3

---

## 1. What we're building

Phynesse is a **learn-by-doing** web app that teaches the full **AP Physics 1 Unit 4: Work, Power, and Energy** — one subject, taught deep, Brilliant-style.

Students **predict, manipulate simulations, get instant feedback, and retry** until concepts click. The through-line across the whole unit: **motion + live energy bar charts + AP-style problems**.

**Topics covered (the whole unit):** work and sign conventions · work-energy theorem · kinetic & potential energy · conservation of mechanical energy · when energy is *not* conserved (friction → thermal) · power · choosing work-energy vs other methods · mixed AP problem-solving.

**Prerequisite:** basic kinematics and forces. We reference FBDs only where needed.

**Phase 1 rule:** no AI. Every interaction, hint, and problem is hand-authored. Prove the app teaches on its own before adding intelligence later.

---

## 2. MVP scope (Phase 1)

### In

| Area | Deliverable |
|---|---|
| **Subject** | Full WPE unit — linear course path from work → conservation → power → mixed practice → capstone |
| **Interactives** | Multiple problem types (sliders, drag-to-balance bar charts, predictions, numeric entry) — not just MC |
| **Visuals** | Canvas simulations + energy bar charts that respond in real time to learner input |
| **Feedback** | Instant, specific, author-written hints on every answer |
| **Content model** | Lessons as JSON step sequences — add new problems without rewriting UI |
| **Progress** | Step-level state; resume mid-lesson on any device |
| **Auth** | Firebase Auth (Google + email); display name |
| **Course path** | Locked/unlocked lessons; "next up" recommendation; streak + milestones |
| **Platform** | Responsive web; touch-friendly; deployed publicly |

### Build order (how we ship it)

Start vertical, then widen:

1. **Content model + step renderer** — JSON steps → UI
2. **First interaction:** slider sim (Push the block) — proves sim + bar chart + grading loop
3. **More interaction types** — bar chart balancing, ramp/spring sims, etc.
4. **Fill the course path** — lessons across the full WPE arc
5. **Auth, progress, streaks, deploy**

We don't need every lesson on day one. We need the **platform and one rich interaction working first**, then stack content on the same rails.

### Out — not Phase 1

| Area | When |
|---|---|
| AI (generation, adaptive hints, chat) | Phase 2 |
| Spaced repetition, interleaving, mastery algorithms | Phase 3 |
| Teacher dashboard, LMS, native apps | Post-MVP |

### Done when

Alex can work through the **WPE course** — predict, manipulate visuals, recover from wrong answers, resume progress, and finish with a unit capstone at ≥70%. The app runs at **≥60 fps**, feedback in **<100ms**, first interaction in **<2s** on mobile.

---

## 3. Persona

**Alex, 17 — AP Physics 1 student**

- Exam in ~6 weeks. Fine with kinematics; energy problems feel like memorizing formulas.
- Studies on phone in 10–15 min chunks. Quits if instructions are long or UI is confusing.
- **Wins when:** they can draw an energy bar chart before calculating, know when conservation applies, and pick work-energy over kinematics when it is easier.

---

## 4. User stories

| Story | Acceptance |
|---|---|
| Learn by doing | Every lesson has hands-on steps — manipulate, predict, or build — not passive reading |
| Predict before reveal | Key sim steps require a prediction before the answer is shown |
| Manipulate & watch | Inputs (sliders, drags, taps) update sim + bar chart live |
| Balance energy | Drag bar heights to show before/after energy accounting; instant check |
| Instant feedback | Every answer: <100ms, specific hint on wrong |
| Resume anywhere | Mid-lesson exit → return → same step, same state |
| Follow the path | Lessons unlock in order; capstone gates unit completion |
| Come back | Streak + progress visible on home screen |

---

## 5. WPE curriculum

| # | Topic | Focus |
|---|---|---|
| 1 | Work & work-energy theorem | W = Fd cos θ, sign of work, W_net = ΔKE |
| 2 | Kinetic energy | KE = ½mv², work → speed |
| 3 | Gravitational PE | U_g = mgh, reference level |
| 4 | Elastic PE | U_s = ½kx² |
| 5 | Conservation of energy | KE + U = const; bar charts before/after |
| 6 | Non-conservative forces | Friction; energy to thermal; when conservation breaks |
| 7 | Power | P = W/Δt, P = Fv |
| 8 | Mixed AP practice + **capstone** | Multi-step problems; ≥70% to complete unit |

**Formulas (in-app reference):** W = Fd cos θ · W_net = ΔKE · KE = ½mv² · U_g = mgh · U_s = ½kx² · KE_i + U_i = KE_f + U_f + E_th · P = W/Δt

### Interaction families (not exhaustive)

Problems mix these patterns across lessons — specifics are authored in content, not hardcoded in the PRD:

| Type | Teaches |
|---|---|
| **Slider sim** | Change force, height, k, μ — watch motion + bars update |
| **Drag bar chart** | Set bar heights to match a before/after energy story; balance the system |
| **Predict → reveal** | MC or numeric guess before sim confirms |
| **Tap to label** | Mark which forces do positive/negative/zero work |
| **Scenario compare** | Two setups side-by-side (e.g. steep vs gentle ramp, same height) |
| **Build the equation** | Drag terms into W_net = ΔKE or conservation equation |
| **Path trace** | Release from height on ramp; predict speed at bottom |

**First build target:** slider sim (Push the block) — everything else reuses the same step renderer and bar chart component.

---

## 6. Content model

Lessons are JSON arrays of typed steps. New lessons and problem types plug in without new pages.

```typescript
type Step =
  | { type: 'concept'; body: string }
  | { type: 'predict_mc'; prompt: string; choices: string[]; correctIndex: number; hints: string[] }
  | { type: 'predict_numeric'; prompt: string; correctValue: number; unit: string; tolerance: number; hints: string[] }
  | { type: 'sim'; labId: string; defaultParams: Record<string, number> }
  | { type: 'bar_chart_drag'; /* initial state, target bars, hints */ }
  | { type: 'complete'; nextLessonId: string };

type Lesson = { id: string; title: string; order: number; steps: Step[] };
```

Content in repo as JSON → seeded to Firestore. Progress: `{ lessonId, stepIndex, params, attempts[] }`.

**Grading:** numeric ±2% tolerance; MC exact match; bar charts compare category totals; all physics via closed-form formulas.

---

## 7. Tech stack

| Layer | Choice | Role |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | SPA; generic step renderer + sim components |
| **Simulations** | HTML Canvas + `requestAnimationFrame` | Motion + bar charts at 60 fps |
| **Physics** | Deterministic analytic formulas | Predictable grading; no physics engine library |
| **Auth** | Firebase Auth (Google + email) | Sign-in + display name |
| **Database** | Firestore | Progress, attempts, lesson JSON, streaks |
| **Hosting** | Firebase Hosting | Public deploy; CDN |
| **Content** | JSON in repo → seed script | Version-controlled; add lessons without refactoring |

**Architecture:** client ↔ Firestore via security rules. No custom API. No AI in Phase 1.

---

## 8. Data

| What | Why |
|---|---|
| User profile (uid, name, email) | Auth + personalization |
| Lesson progress (step, params, status) | Resume mid-lesson |
| Step attempts (answer, correct, hint, timestamp) | Feedback + future mastery |
| Streak (last active, count) | Habit loop |
| Lesson content (JSON) | Render without redeploy |

**Don't store:** frame telemetry, chat logs, AI data.

---

## 9. Testing & performance

| Test | Pass criteria |
|---|---|
| Full lesson flow | Wrong → hint → recover → complete |
| Live interaction | Input → sim + bar chart update same frame |
| Persistence | Leave mid-lesson → return → restored |
| Course path | Finish lesson → sensible next step unlocked |
| Mobile | Touch-friendly; full flow on phone viewport |
| Feedback | <100ms |
| Sim | ≥60 fps while interacting |
| Load | <2s to first interaction on 4G |

---

## 10. Open questions

1. Sign-in required at start, or one free step then gate?
2. Capstone: in-app badge only, or exportable certificate?
