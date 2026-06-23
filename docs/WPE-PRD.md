# Phynesse — AP Physics 1: Work, Power & Energy

**Product:** Phynesse · **Scope:** WPE unit only · **Status:** MVP PRD

---

## 1. What we're building

Phynesse is a web app that teaches **AP Physics 1 Unit 4 (Work, Power, Energy)** through short, interactive labs — not videos.

**Core loop:** predict → run simulation → get feedback → retry.

**Visual language:** motion + live energy bar charts + AP-style questions.

**Prerequisite:** students know basic kinematics and forces. We don't re-teach FBDs or Newton's laws.

---

## 2. MVP scope

### In

- **6 interactive labs** (sliders, drag targets, live energy bars)
- **~8 lessons** on a linear path; next lesson unlocks after checkpoint pass
- **Checkpoints** per lesson: multiple-choice + numeric (AP-style wording)
- **Unit capstone:** 8 mixed problems; ≥70% = pass
- **Accounts:** Google or email sign-in; progress saved
- **Platform:** responsive web (React + Vite)

### Out (for now)

- Other AP units, AI tutor, native apps, LMS integration, offline mode, teacher dashboard

### Done when

A student can finish the unit in **≤2 hours**, pass the capstone at **≥70%**, and resume where they left off on any device.

---

## 3. Persona

**Alex, 17 — AP Physics 1 student**

- Exam in ~6 weeks. Fine with kinematics; energy problems feel like memorizing formulas.
- Studies on phone in 10–15 min chunks. Quits if instructions are long or UI is confusing.
- **Wins when:** they can draw an energy bar chart before calculating, and know when to use work-energy vs conservation.

---

## 4. User stories

| Story | Acceptance |
|---|---|
| Predict before sim | Every lab requires a prediction (MC or number) before the simulation runs |
| Manipulate & see energy | Sliders change mass, height, friction, spring k; bar chart updates in real time |
| Get useful feedback | Wrong answers show a hint tied to the mistake (e.g. forgot thermal energy) |
| Resume progress | Last completed lesson restored on login |
| Pass the capstone | 8-question summative mixes ramp, spring, and power; ≥70% marks completion |

---

## 5. Curriculum

| # | Topic | Lab |
|---|---|---|
| 1 | Work & work-energy theorem | Lab 1: Push the block |
| 2 | Kinetic energy | Lab 2: Launch speed |
| 3 | Gravitational PE | Lab 3: Ramp racer |
| 4 | Elastic PE | Lab 4: Spring launcher |
| 5 | Conservation (+ friction) | Labs 3 & 4 |
| 6 | Power | Lab 5: Power climb |
| 7 | Mixed AP practice | Lab 6: Problem studio |
| 8 | **Capstone** | Review + 8-question test |

### Labs (one sentence each)

| Lab | What student does | Point |
|---|---|---|
| 1 — Push the block | Apply force over distance with friction | W_net = ΔKE |
| 2 — Launch speed | Set net work, read speed | Work → KE |
| 3 — Ramp racer | Release from height, add friction slider | Conservation; energy to thermal |
| 4 — Spring launcher | Compress spring, launch mass | U_s ↔ KE |
| 5 — Power climb | Compare climbing scenarios over time | P = W/t |
| 6 — Problem studio | Pick scenario, build bar chart, solve | Synthesis / AP FRQ style |

**Key formulas (in-app reference):** W = Fd cos θ · W_net = ΔKE · KE = ½mv² · U_g = mgh · U_s = ½kx² · P = W/Δt

---

## 6. Tech & data

**Stack:** React + TypeScript + Vite · Firebase Auth · Firestore · Firebase Hosting

**Store:**
- User profile + role
- Per-lesson progress (locked / in progress / completed)
- Lab & checkpoint attempts (prediction, answer, correct/incorrect, timestamp)
- Lesson & checkpoint content (team-authored, seeded to Firestore)

**Don't store:** frame-by-frame sim telemetry, chat logs, payment data

---

## 7. Success metrics

| Metric | Target |
|---|---|
| Capstone pass rate (students who start L1) | ≥60% |
| Complete L1 + Lab 1 in first session | ≥70% |
| Page load on 4G | <3s |

---

## 8. Open questions

1. Allow L1 without sign-in, or require account at start?
2. In-app badge only, or exportable completion certificate?
