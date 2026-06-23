import { FirebaseError } from 'firebase/app'

export function friendlyAuthError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'Sign in failed. Try again.'
  }

  switch (error.code) {
    case 'auth/unauthorized-domain':
      return `This URL isn't allowed yet. Firebase Console → Authentication → Settings → Authorized domains → add "${typeof window !== 'undefined' ? window.location.hostname : 'your-site.web.app'}".`
    case 'auth/invalid-api-key':
      return 'Wrong Firebase API key. Copy the Web API Key from Firebase Console → Project settings → General.'
    case 'auth/popup-blocked':
      return 'Pop-up blocked. Trying redirect sign-in… allow pop-ups, or use email sign-in below.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in window closed. Try again or use email below.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled yet. Firebase Console → Authentication → Sign-in method → enable Google, then try again.'
    case 'auth/configuration-not-found':
      return 'Authentication is not set up on this Firebase project yet. Open Firebase Console → Authentication → Get started → enable Google sign-in.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Sign in instead.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return error.message
  }
}
