import { useEffect } from 'react'

/**
 * Lets the learner press Enter to trigger a step's forward action (Continue /
 * Next). It deliberately does nothing when focus is on an element that already
 * handles Enter itself — text inputs submit on Enter, buttons/links activate
 * natively, and the bar-drag track (role="slider") has its own handler — so a
 * single Enter never advances twice. It also stays quiet while a dialog (e.g. the
 * AI tutor) is open, so Enter can't skip the lesson underneath it.
 */
export function useEnterAdvance(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    // Arm only shortly after this step appears, so the Enter press that advanced
    // INTO this step (or a held key's auto-repeat) can't immediately skip past it.
    let armed = false
    const armTimer = setTimeout(() => {
      armed = true
    }, 400)

    const onKey = (e: KeyboardEvent) => {
      // Ignore held-key auto-repeat and any keys fired before we're armed.
      if (e.key !== 'Enter' || e.isComposing || e.shiftKey || e.repeat || !armed) return

      const el = document.activeElement as HTMLElement | null
      const tag = el?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'BUTTON' ||
        tag === 'SELECT' ||
        tag === 'A' ||
        el?.isContentEditable ||
        el?.getAttribute('role') === 'slider'
      ) {
        return
      }

      // Don't advance the lesson sitting behind an open dialog (e.g. Ask Brock).
      if (document.querySelector('[role="dialog"]')) return

      e.preventDefault()
      handler()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(armTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [handler, enabled])
}
