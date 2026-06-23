/** Google OAuth does not work inside Cursor/VS Code embedded preview (iframe). */
export function isEmbeddedPreview(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export function openInSystemBrowser(): void {
  window.open(window.location.href, '_blank', 'noopener,noreferrer')
}
