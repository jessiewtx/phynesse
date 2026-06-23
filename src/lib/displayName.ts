export function displayFirstName(user: { displayName?: string | null; email?: string | null }): string {
  if (user.displayName?.trim()) {
    return user.displayName.trim().split(/\s+/)[0] ?? user.displayName
  }
  if (user.email) {
    return user.email.split('@')[0] ?? 'there'
  }
  return 'there'
}
