import type { ReactNode } from 'react'

type FeedbackProps = {
  variant: 'success' | 'error' | 'neutral'
  children: ReactNode
}

export function Feedback({ variant, children }: FeedbackProps) {
  return <div className={`feedback feedback--${variant}`}>{children}</div>
}
