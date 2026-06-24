# Phynesse

Learn-by-doing AP Physics 1 app for **Unit 4: Work, Power & Energy**.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Firebase Auth + Firestore
- **Hosting:** Firebase Hosting

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

If you don't have one yet:

```bash
firebase projects:create phynesse-wpe --display-name "Phynesse"
```

Or create it in the [Firebase Console](https://console.firebase.google.com/).

Update `.firebaserc` if your project ID differs.

### 3. Enable Firebase services

In the Firebase Console for your project:

1. **Authentication** → Sign-in method → enable **Google** and **Email/Password**
2. **Firestore** → Create database (production mode is fine; rules are in `firestore.rules`)
3. **Hosting** → will be configured on first `firebase deploy`

### 4. Add web app config

1. Firebase Console → Project settings → Your apps → Add web app
2. Copy config values into `.env.local`:

```bash
cp .env.example .env.local
# fill in VITE_FIREBASE_* values
```

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:5173 — you should see "Firebase connected" once `.env.local` is set.

### 6. Deploy

```bash
npm run deploy
```

Or separately:

```bash
npm run build
firebase deploy
```

## Project structure

```
src/
  components/   # step renderers, interactive demos & diagrams, UI
  lib/          # firebase, grading, mastery, progress, streak
  pages/        # Home, Lesson, Progress
  types/        # Step, Lesson, Progress
content/        # Lesson JSON (source of truth)
docs/           # PRD
```

## Docs

See [docs/WPE-PRD.md](docs/WPE-PRD.md) for product scope.
