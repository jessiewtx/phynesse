import { getRedirectResult, type Auth, type UserCredential } from 'firebase/auth'

let redirectPromise: Promise<UserCredential | null> | null = null

/** getRedirectResult() only works once per page load — guard against Strict Mode double calls. */
export function getRedirectResultOnce(auth: Auth): Promise<UserCredential | null> {
  if (!redirectPromise) {
    redirectPromise = getRedirectResult(auth)
  }
  return redirectPromise
}
