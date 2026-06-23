# Product Requirements Document: Phynesse — AP Physics 1 WPE Unit

**Product:** Phynesse · **Feature:** Work, Power & Energy (WPE) deep-dive · **Audience:** Product + Engineering · **Status:** v0.1 — pre-build decision doc

---

## 1. Overview

**Phynesse** is a focused, interactive learning product for **AP Physics 1 Unit 4: Work, Power, and Energy**. Students learn by **predicting outcomes, manipulating simulations, and accounting for energy** — not by watching passive videos.

The product goes **deep on one unit** (WPE only) with many short, game-like interactives tied to a single visual language: **motion + energy bar charts + AP-style checkpoints**.

**Domain:** K–12 / AP Physics 1 · Algebra-based mechanics · College Board Unit 4 alignment.

**Prerequisite assumption:** Students have completed or are concurrently taking **kinematics** (Unit 1) and basic **forces** (Unit 2) at a survey level. MVP does **not** re-teach FBDs or Newton's laws in depth; it references them only where the work-energy theorem requires it.

---

## 2. MVP Scope

### In scope

| Area | MVP deliverable |
|---|---|
| **Curriculum** | Full WPE arc: work → work-energy theorem → KE/PE → conservation of energy → power |
| **Interactives** | **6 core labs** (see §5) with sliders, drag targets, and live energy bar charts |
| **Learning loop** | Predict → simulate → explain → retry on every lab |
| **Progression** | Linear lesson path (~12 lessons); unlock next lesson after checkpoint pass |
| **Checkpoints** | Multiple-choice + numeric prediction questions per lesson (AP-style) |
| **Accounts** | Email or Google sign-in; progress persists across devices |
| **Teacher-lite** | Shareable class link + read-only progress dashboard (no LMS integration) |
| **Platform** | Web app (desktop + mobile browser); React + Vite client |
| **Backend** | Firebase Auth + **Firestore** + Cloud Functions for aggregation only |

### Out of scope (MVP)

| Area | Reason deferred |
|---|---|
| Other AP Physics 1 units (kinematics, forces, momentum, rotation, fluids) | Single-unit depth is the product thesis |
| Full forces / FBD curriculum | Referenced lightly; not taught as primary framework |
| Calculus-based physics (AP Physics C) | Different math level and audience |
| Native iOS/Android apps | Web-first validates content before mobile investment |
| Custom video lectures | Interactives are the medium; text + diagrams only |
| AI tutor / chat | Adds cost, safety, and scope; revisit post-traction |
| Full LMS (Canvas, Google Classroom grade passback) | Teacher-lite link is enough for MVP |
| Multiplayer / leaderboards | Engagement risk without proven core loop |
| User-generated levels | Content quality control; author in-house first |
| Offline mode | Requires sync complexity; online-first for MVP |
| Advanced scenarios | Non-conservative forces beyond friction template, variable forces via integration, 3D motion |

### MVP done when

A student with AP Physics 1 prerequisites can:

1. Complete all 12 lessons in **≤ 3 hours** of focused study.
2. Pass the **unit capstone** (combined energy problems) at **≥ 70%**.
3. Return later and resume from last completed lesson with progress intact.

Engineering done when: web app loads in **< 3s** on 4G, simulations run at **≥ 30 fps** on a 3-year-old phone, Firestore writes succeed for **100%** of checkpoint submissions under normal load.

---

## 3. ICP & Personas

### ICP (Ideal Customer Profile)

**US high school students taking AP Physics 1**, age **15–18**, algebra-based, exam-oriented, studying in **short mobile-friendly sessions** (10–20 min). Often struggling with **energy bar charts** and **choosing between kinematics vs energy methods**. Teachers want something assignable that **mirrors AP wording** without replacing their course.

---

### Primary persona — **Alex, 17, AP Physics 1 student**

- **Situation:** Junior in high school; exam in 6 weeks; decent at kinematics but energy problems feel like "magic formulas."
- **Goals:** Raise unit test score; understand *why* energy is conserved; practice AP-style problems without reading a textbook.
- **Behavior:** Uses phone between classes; tolerates 5-min interactives; abandons if instructions are long or UI is confusing.
- **Success looks like:** "I can draw the bar chart before I calculate, and I know when to use W = Fd vs conservation."

---

### Secondary persona — **Ms. Rivera, 42, AP Physics teacher**

- **Situation:** Teaches 2 sections of AP Physics 1; assigns PhET sometimes but wants **structured progression** and **completion visibility**.
- **Goals:** Assign WPE review before the unit test; see who finished; not configure another platform for weeks.
- **Behavior:** Shares a link in Google Classroom; checks dashboard once before class.
- **Success looks like:** 80% of assigned students complete the capstone; fewer "how do I start an energy problem?" questions in office hours.

---

### Not focused on (MVP)

| Segment | Why not MVP |
|---|---|
| Middle school / intro physical science | WPE requires algebra, trig components, and AP pacing |
| College intro physics (calculus) | Integrals, non-algebraic treatments out of scope |
| AP Physics 2 students | Different curriculum (fluids, E&M, thermo) |
| Self-learners with no math background | Prerequisite gap too large without prior units |
| Professional engineers | Not the pedagogy or difficulty target |
| Parents as primary buyer | Student/teacher pull drives adoption; no parent dashboard |
| Homeschool co-ops needing full curriculum | Only one unit; not a complete course replacement |

---

## 4. User Stories

| # | Story | Acceptance criteria | Priority |
|---|---|---|---|
| 1 | As **Alex**, I want to **predict** what happens before I run a simulation, so I actively think instead of clicking randomly. | Every lab shows a prediction step (MC or numeric) before sim unlocks; prediction stored | Must |
| 2 | As **Alex**, I want to **adjust mass, height, friction, and spring k** and see energy bars update live, so I build intuition for conservation. | Sliders affect sim + bar chart in real time; values labeled with SI units | Must |
| 3 | As **Alex**, I want **immediate feedback** when my energy accounting is wrong, so I know what to fix. | Wrong answers show hint tied to common mistake (e.g. forgot thermal energy) | Must |
| 4 | As **Alex**, I want to **resume where I left off**, so I can study in short sessions. | Last completed lesson + in-progress lab state restored on login | Must |
| 5 | As **Alex**, I want lessons ordered like **AP Physics 1 WPE**, so it matches class and the exam. | Lesson sequence matches §5 curriculum map; AP-style question stems | Must |
| 6 | As **Ms. Rivera**, I want a **class link** so students join without manual roster upload. | Teacher creates class code; students enroll; roster visible to teacher | Should |
| 7 | As **Ms. Rivera**, I want to see **who completed the capstone**, so I know who needs intervention. | Dashboard: student name, % complete, capstone score, last active | Should |
| 8 | As **Alex**, I want a **unit capstone** that mixes ramp, spring, and power problems, so I know I'm exam-ready. | 10-question capstone; ≥70% unlocks completion badge | Must |
| 9 | As **Alex**, I want to see **worked examples** only after I attempt a checkpoint, so I try first. | Solution reveals after 1 failed attempt or explicit "show solution" | Should |
| 10 | As **Alex**, I want the app to work on my **phone**, so I can practice anywhere. | Responsive layout; touch-friendly sliders; readable bar charts | Must |

---

## 5. Domain Model — AP Physics 1 WPE

### 5.1 Concepts covered (College Board Unit 4 alignment)

| Topic | Key relationships | AP exam emphasis |
|---|---|---|
| **Work** | W = Fd cos θ; work by gravity, normal, friction; sign conventions | Identifying whether force does ± work |
| **Work-energy theorem** | W_net = ΔKE | Connecting forces to speed change without full kinematics |
| **Kinetic energy** | KE = ½mv² | Speed from energy; relative KE comparisons |
| **Potential energy** | U_g = mgh; U_s = ½kx²; reference level choice | Zero line does not affect *changes* in energy |
| **Conservation of mechanical energy** | E = KE + U = const when only conservative forces do work | Bar charts; before/after; friction → thermal |
| **Power** | P = W/Δt; P = Fv cos θ | Compare rates; stairs vs elevator style problems |

### 5.2 Lesson map (12 lessons → 6 interactives)

| Lesson | Title | Interactive | Checkpoint focus |
|---|---|---|---|
| L1 | What is work? | — (intro + guided MC) | Positive vs negative work |
| L2 | Work by common forces | **Lab 1: Push the block** (horizontal F, friction) | Normal/gravity do zero work |
| L3 | Work-energy theorem | **Lab 1** (extended) | W_net = ΔKE |
| L4 | Kinetic energy | **Lab 2: Launch speed** | KE from given work |
| L5 | Gravitational PE | **Lab 3: Ramp racer** | Reference level; U_g |
| L6 | Elastic PE | **Lab 4: Spring launcher** | U_s = ½kx² |
| L7 | Conservation (no friction) | **Lab 3 + Lab 4** combined scenarios | Bar chart before/after |
| L8 | Non-conservative work (friction) | **Lab 3** (friction slider) | Energy "lost" to thermal |
| L9 | Power | **Lab 5: Power climb** (stairs vs elevator) | P = W/t, P = Fv |
| L10 | Choosing a method | **Lab 6: Energy problem studio** (multi-step) | When energy beats kinematics |
| L11 | Mixed AP practice | Lab 6 variants | Multi-part free response style |
| L12 | **Unit capstone** | All labs available for review | 10-question summative |

### 5.3 Interactive lab specifications (MVP)

| Lab | Manipulables | Measured outputs | Learning objective |
|---|---|---|---|
| **1 — Push the block** | Applied force, distance, μ_k, mass | W, ΔKE, final v | Work-energy theorem with friction |
| **2 — Launch speed** | Net work input, mass | KE, v | Relate work to speed |
| **3 — Ramp racer** | Height, mass, μ_k, release height | Bar chart: U_g, KE, E_th | Conservation with/without friction |
| **4 — Spring launcher** | k, compression x, mass | U_s → KE, launch v | Elastic PE ↔ KE |
| **5 — Power climb** | Time, height, mass, optional constant v | Power comparison | P = W/t vs P = Fv |
| **6 — Energy problem studio** | Scenario picker (ramp/spring/mixed) | Student-built bar chart + numeric answer | Synthesis / AP FRQ style |

### 5.4 Domain entities (application layer)

These are **product objects**, not Firestore collections (see §7).

```
User ──< Enrollment >── Class
User ──< LessonProgress
User ──< LabAttempt
User ──< CheckpointAttempt
Lesson ──< Checkpoint
Lesson ──> Interactive (optional)
Class ──< Enrollment
```

**Constants (server-seeded, not user-editable in MVP):**

- `Lesson` — id, order, title, content blocks, linked lab id, checkpoint ids
- `Interactive` — id, type, default parameters, grading rubric
- `Checkpoint` — id, type (`mc` | `numeric` | `bar_chart`), question, answer, tolerance, hints

---

## 6. What Information Is Stored

### 6.1 User & identity

| Data | Purpose | Retention |
|---|---|---|
| `uid`, email, display name | Auth + dashboard | Account lifetime |
| Role (`student` \| `teacher`) | Access control | Account lifetime |
| Created at, last active at | Analytics, stale account cleanup | Account lifetime |

### 6.2 Class & enrollment (teacher-lite)

| Data | Purpose |
|---|---|
| Class name, join code, teacher uid | Roster grouping |
| Student enrollments | Teacher dashboard |
| Enrolled at | Reporting |

### 6.3 Learning progress

| Data | Purpose |
|---|---|
| Per-lesson status (`locked` \| `in_progress` \| `completed`) | Progression gating |
| Lesson completion timestamp | Teacher report |
| Capstone score, passed boolean | Completion certificate / badge |

### 6.4 Interactive attempts (high-value analytics)

| Data | Purpose |
|---|---|
| Lab id, lesson id | Context |
| Input parameters (sliders at submit time) | Replay / debug |
| Prediction (before sim) | Measure engagement quality |
| Submitted answer vs correct answer | Scoring |
| Bar chart snapshot (JSON) | Grade "draw the chart" items |
| Time on lab (seconds) | Engagement metric |
| Attempt number | Retry tracking |

### 6.5 Checkpoint / quiz attempts

| Data | Purpose |
|---|---|
| Checkpoint id, lesson id | Context |
| Selected answer or numeric input | Scoring |
| Correctness, hints shown | Adaptive hints (future) |
| Timestamp | Audit |

### 6.6 Content (read-mostly)

| Data | Purpose |
|---|---|
| Lesson markdown / structured blocks | Render lesson UI |
| Interactive default configs | Initialize simulators |
| Checkpoint questions & rubrics | Autograde |

Content is **authored by the team**, stored in Firestore for easy updates without redeploy, with optional seed scripts from JSON in repo.

### 6.7 Explicitly NOT stored (MVP)

- Raw simulation frame-by-frame telemetry (too heavy)
- Chat / AI conversation logs
- Payment / billing
- Full classroom roster sync from SIS
- Student geolocation

---

## 7. Firestore — Storage & Data Flow

### 7.1 Architecture overview

```
┌─────────────────┐     Firebase Auth      ┌──────────────────┐
│  React (Vite)   │ ◄──────────────────────► │  Firebase Auth   │
│  Web Client     │                          └──────────────────┘
└────────┬────────┘
         │ Firestore SDK (read/write with security rules)
         ▼
┌─────────────────┐     trigger (optional)   ┌──────────────────┐
│   Firestore     │ ────────────────────────► │ Cloud Functions  │
│   (source of    │   aggregate class stats    │ (teacher dash)   │
│    truth)       │ ◄────────────────────────  └──────────────────┘
└─────────────────┘
         ▲
         │ Admin SDK seed / content updates
┌────────┴────────┐
│  Content seed   │
│  (CLI / CI)     │
└─────────────────┘
```

### 7.2 Read/write flow by user action

| User action | Client write | Client read | Server-side |
|---|---|---|---|
| Sign up / login | Auth only | `users/{uid}` create-if-missing | — |
| Open app | Update `users.lastActiveAt` | `users`, `lessonProgress`, `lessons` | — |
| Start lesson | Set `lessonProgress.status = in_progress` | `lessons/{id}`, linked `checkpoints` | — |
| Submit prediction | Create `labAttempts` doc | — | — |
| Complete checkpoint | Create `checkpointAttempts` doc | Compare to `checkpoints.answer` client-side; rules validate shape | — |
| Pass lesson | Update `lessonProgress.status = completed`; unlock next | `lessons` order | — |
| Teacher creates class | Create `classes` doc | — | Generate unique join code |
| Student joins class | Create `enrollments` doc | `classes` by query on join code | — |
| Teacher opens dashboard | — | `enrollments` + aggregated `lessonProgress` | Cloud Function optional cache on `classes.stats` |

**Write pattern:** Append-only **attempts** (immutable audit trail); **progress** docs are upserted (latest state).

**Offline:** Firestore persistence enabled for reads; writes queue and sync (acceptable for progress; attempts idempotent via client-generated `attemptId`).

### 7.3 Security rules (summary)

| Collection | Student | Teacher |
|---|---|---|
| `users/{uid}` | Read/write own | Read enrolled students in own classes only |
| `lessonProgress/{uid}/lessons/{lessonId}` | Read/write own | Read students in class |
| `labAttempts`, `checkpointAttempts` | Create own; read own | Read class students |
| `lessons`, `checkpoints`, `interactives` | Read all authenticated | Read all |
| `classes/{classId}` | Read if enrolled | Read/write if `teacherId == uid` |
| `enrollments` | Create own enrollment | Read for own classes |

---

## 8. Database Schema (Firestore)

Firestore is **document-oriented**. Top-level collections + subcollections below.

### 8.1 Collection: `users`

```typescript
// Document ID: {uid} from Firebase Auth
interface User {
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  // Denormalized for student home screen
  currentLessonId: string | null;      // e.g. "L7"
  capstonePassed: boolean;
  capstoneScore: number | null;          // 0–100
}
```

### 8.2 Collection: `classes`

```typescript
// Document ID: auto-generated
interface Class {
  name: string;
  joinCode: string;           // 6-char, indexed, unique
  teacherId: string;          // uid
  createdAt: Timestamp;
  // Optional denormalized stats (updated by Cloud Function)
  stats?: {
    studentCount: number;
    avgCapstoneScore: number;
    completionRate: number;   // 0–1
    updatedAt: Timestamp;
  };
}
```

### 8.3 Collection: `enrollments`

```typescript
// Document ID: {classId}_{studentId}
interface Enrollment {
  classId: string;
  studentId: string;
  studentDisplayName: string; // denormalized for teacher dashboard
  enrolledAt: Timestamp;
}
```

**Composite index:** `classId` + `enrolledAt`

### 8.4 Collection: `lessons` (content)

```typescript
// Document ID: "L1" … "L12"
interface Lesson {
  order: number;              // 1–12
  title: string;
  unit: 'WPE';
  interactiveId: string | null;  // "lab-3" etc.
  checkpointIds: string[];     // ordered
  contentBlocks: ContentBlock[];
  unlocksAfter: string | null; // previous lesson id, null for L1
}

type ContentBlock =
  | { type: 'text'; markdown: string }
  | { type: 'diagram'; assetUrl: string; alt: string }
  | { type: 'callout'; variant: 'ap_tip' | 'common_mistake'; text: string };
```

### 8.5 Collection: `interactives` (content)

```typescript
// Document ID: "lab-1" … "lab-6"
interface Interactive {
  title: string;
  type: 'push_block' | 'launch_speed' | 'ramp_racer' | 'spring_launcher' | 'power_climb' | 'problem_studio';
  defaultParams: Record<string, number>;  // e.g. { mass: 2, muK: 0.2, height: 1.5 }
  gradingRules: {
    numericTolerance: number;           // e.g. 0.02 = ±2%
    requiredEnergyCategories: string[]; // ["Ug", "K", "Eth"]
  };
}
```

### 8.6 Collection: `checkpoints` (content)

```typescript
// Document ID: "L5-cp-2" etc.
interface Checkpoint {
  lessonId: string;
  order: number;
  type: 'mc' | 'numeric' | 'bar_chart';
  prompt: string;
  // MC
  choices?: string[];
  correctIndex?: number;
  // Numeric
  correctValue?: number;
  unit?: string;
  tolerance?: number;
  // Bar chart (Lab 6)
  expectedBars?: { category: string; value: number }[];
  hints: string[];              // index 0 = after 1st wrong attempt
  apSkillTag: string;           // e.g. "4.A", "4.B" (CB science practices)
}
```

### 8.7 Subcollection: `users/{uid}/lessonProgress/{lessonId}`

```typescript
interface LessonProgress {
  lessonId: string;
  status: 'locked' | 'in_progress' | 'completed';
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  checkpointsPassed: number;
  checkpointsTotal: number;
  bestCheckpointScore: number;  // 0–100
}
```

### 8.8 Collection: `labAttempts` (append-only)

```typescript
// Document ID: client-generated UUID (idempotency)
interface LabAttempt {
  userId: string;
  classId: string | null;
  lessonId: string;
  interactiveId: string;
  attemptNumber: number;
  prediction: {
    type: 'mc' | 'numeric';
    value: string | number;
  };
  params: Record<string, number>;       // slider values at submit
  submittedAnswer: number | Record<string, number>;
  barChartSnapshot: {
    categories: { id: string; label: string; value: number }[];
  } | null;
  correct: boolean;
  timeOnLabSec: number;
  createdAt: Timestamp;
}
```

**Indexes:** `userId` + `createdAt`; `classId` + `lessonId` + `createdAt` (teacher views)

### 8.9 Collection: `checkpointAttempts` (append-only)

```typescript
interface CheckpointAttempt {
  userId: string;
  classId: string | null;
  lessonId: string;
  checkpointId: string;
  answer: string | number | Record<string, number>;
  correct: boolean;
  hintIndexShown: number;
  attemptNumber: number;
  createdAt: Timestamp;
}
```

### 8.10 Entity relationship diagram

```
users ──────────────┬──────────────── lessonProgress (subcollection)
  │                 │
  │                 ├── labAttempts (collection, userId FK)
  │                 └── checkpointAttempts (collection, userId FK)
  │
  ├── enrollments ────── classes
  │
lessons ─── checkpointIds[] ──► checkpoints
   │
   └── interactiveId ──► interactives
```

### 8.11 Sample document paths

```
users/abc123
users/abc123/lessonProgress/L5
classes/xyz789
enrollments/xyz789_abc123
lessons/L5
interactives/lab-3
checkpoints/L5-cp-1
labAttempts/550e8400-e29b-41d4-a716-446655440000
checkpointAttempts/6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

---

## 9. Tech Stack (MVP)

| Layer | Choice | Why |
|---|---|---|
| **Client** | React + TypeScript + Vite | Fast dev; good for canvas/sim |
| **Simulations** | HTML Canvas or SVG + requestAnimationFrame | No native app; sufficient for 2D mechanics |
| **Auth** | Firebase Auth (Google + email) | Low friction for students |
| **Database** | Firestore | Real-time sync, offline persistence, scales to classroom size |
| **Hosting** | Firebase Hosting or Vercel | Static SPA + CDN |
| **Aggregation** | Cloud Functions (optional v1.1) | Teacher dashboard stats; avoid client-side N+1 reads |

**Deliberately excluded at MVP:** PostgreSQL, custom API server, Redis, event streaming — Firestore handles MVP scale (target: **≤ 5k MAU**, **≤ 50 attempts/user/day**).

---

## 10. Success Metrics

| Metric | Definition | MVP target |
|---|---|---|
| **North star** | Capstone pass rate among students who start L1 | ≥ 60% |
| Activation | % who complete L1 + Lab 1 in first session | ≥ 70% |
| Engagement | Median labs with prediction submitted per user | ≥ 4 |
| Learning signal | Checkpoint correctness improves on retry | +15% vs 1st attempt |
| Teacher value | Classes with ≥ 5 students where teacher views dashboard | ≥ 50% within 2 weeks of assign |
| Performance | p95 lesson load time | < 3s |

**Hypothesis:** Prediction-first interactives + bar charts improve capstone pass rate vs static worksheets. If activation < 50%, the core loop (predict → sim → explain) needs redesign before adding units.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Students skip prediction step | Gate sim until prediction submitted; minimal friction (one tap) |
| Bar chart UI too small on mobile | Responsive layout; rotate hint for landscape on phones |
| Firestore write costs from attempts | Batch attempts; cap retries displayed; aggregate old attempts via CF |
| Content errors vs AP exam | Tag with CB skill codes; teacher beta review before launch |
| Scope creep into forces unit | Strict §2 out-of-scope; link out to "coming soon" only |
| Sim physics inaccurate | Use deterministic analytic solutions for MVP (not numerical integration) |

---

## 12. Open Questions (pre-build)

1. **Anonymous trial:** Allow L1 without account, or require sign-in at lesson 1?
2. **Capstone certificate:** PDF export or in-app badge only?
3. **Teacher dashboard:** Ship in MVP or v1.1 (student-only first)?

---

## Appendix A — AP Physics 1 WPE formula sheet (in-app reference)

| Quantity | Equation |
|---|---|
| Work (constant force) | W = Fd cos θ |
| Work-energy theorem | W_net = ΔKE |
| Kinetic energy | KE = ½mv² |
| Gravitational PE | U_g = mgh |
| Elastic PE | U_s = ½kx² |
| Conservation | KE_i + U_i = KE_f + U_f (no non-conservative work) |
| With friction | KE_i + U_i = KE_f + U_f + E_th |
| Power | P = W/Δt, P = Fv cos θ |

---

## Appendix B — Firestore indexes (required)

| Collection | Fields | Query |
|---|---|---|
| `enrollments` | `classId` ASC, `enrolledAt` ASC | Teacher roster |
| `labAttempts` | `userId` ASC, `createdAt` DESC | Student history |
| `labAttempts` | `classId` ASC, `lessonId` ASC, `createdAt` DESC | Teacher per-lesson view |
| `classes` | `joinCode` ASC | Student join by code |
| `checkpointAttempts` | `userId` ASC, `checkpointId` ASC, `createdAt` DESC | Retry analytics |
