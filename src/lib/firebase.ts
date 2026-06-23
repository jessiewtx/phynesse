import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0,
)

export function expectedAuthDomain(): string | null {
  const id = firebaseConfig.projectId
  return id ? `${id}.firebaseapp.com` : null
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db, firebaseConfig }
