import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getRedirectResultOnce } from '../lib/authRedirect'
import { auth, db, expectedAuthDomain, firebaseConfig, isFirebaseConfigured } from '../lib/firebase'
import { migrateGuestProgress } from '../lib/migrateGuestProgress'
import { migrateGuestStreak } from '../lib/streak'
import { isEmbeddedPreview } from '../lib/preview'

type AuthContextValue = {
  user: User | null
  isSignedIn: boolean
  loading: boolean
  authReady: boolean
  authConfigWarning: string | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function authConfigWarning(): string | null {
  const expected = expectedAuthDomain()
  if (expected && firebaseConfig.authDomain && firebaseConfig.authDomain !== expected) {
    return `Fix .env.local: VITE_FIREBASE_AUTH_DOMAIN should be ${expected} (yours is ${firebaseConfig.authDomain}).`
  }
  return null
}

async function ensureUserDoc(user: User) {
  if (!db) return
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email ?? '',
      displayName: user.displayName ?? 'Student',
      lastActiveAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const configWarning = authConfigWarning()

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    void getRedirectResultOnce(auth)
      .then(async (result) => {
        if (result?.user) {
          setUser(result.user)
          await ensureUserDoc(result.user)
          await migrateGuestProgress(result.user.uid)
          await migrateGuestStreak(result.user.uid)
        }
      })
      .catch(() => {
        /* redirect cancelled or already consumed */
      })

    return unsub
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth is not configured')
    if (isEmbeddedPreview()) {
      throw new Error('Open the site in Chrome or Safari — not the Cursor preview.')
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver)
      setUser(result.user)
      await ensureUserDoc(result.user)
      await migrateGuestProgress(result.user.uid)
      await migrateGuestStreak(result.user.uid)
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider)
        return
      }
      throw e
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setUser(cred.user)
    await ensureUserDoc(cred.user)
    await migrateGuestProgress(cred.user.uid)
    await migrateGuestStreak(cred.user.uid)
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!auth) throw new Error('Firebase Auth is not configured')
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName })
      setUser(cred.user)
      await ensureUserDoc(cred.user)
      await migrateGuestProgress(cred.user.uid)
      await migrateGuestStreak(cred.user.uid)
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (!auth) return
    await firebaseSignOut(auth)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isSignedIn: !!user,
      loading,
      authReady: isFirebaseConfigured,
      authConfigWarning: configWarning,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, loading, configWarning, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
