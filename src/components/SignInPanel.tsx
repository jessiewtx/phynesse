import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { friendlyAuthError } from '../lib/authErrors'
import { isEmbeddedPreview, openInSystemBrowser } from '../lib/preview'

type Mode = 'signin' | 'signup'

type Props = {
  compact?: boolean
}

export function SignInPanel({ compact }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authConfigWarning } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const embedded = isEmbeddedPreview()

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        if (!name.trim()) {
          setError('Enter your name.')
          return
        }
        await signUpWithEmail(email, password, name.trim())
      }
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    if (embedded) {
      setError('Open in Chrome or Safari using the button below.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`sign-in ${compact ? 'sign-in--compact' : ''}`}>
      {!compact && <h2>Sign in to save progress</h2>}
      {authConfigWarning && <p className="sign-in__error">{authConfigWarning}</p>}
      {embedded && (
        <div className="sign-in__preview-warn">
          <p>Google sign-in does not work in the Cursor preview.</p>
          <button type="button" className="btn btn--primary btn--full" onClick={openInSystemBrowser}>
            Open in Chrome / Safari
          </button>
        </div>
      )}
      <p className="sign-in__sub">
        {compact
          ? 'Save progress across devices.'
          : 'Google or email — your steps and answers sync to your account.'}
      </p>

      <button type="button" className="btn btn--google btn--full" disabled={busy} onClick={google}>
        Continue with Google
      </button>

      {!compact && (
        <>
          <div className="sign-in__divider">or email</div>

          {mode === 'signup' && (
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          <button type="button" className="btn btn--primary btn--full" disabled={busy} onClick={submit}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </>
      )}

      {error && <p className="sign-in__error">{error}</p>}
    </section>
  )
}
