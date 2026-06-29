import { useEffect, type RefObject } from 'react'

/**
 * Focuses the referenced field as soon as the step mounts — and since each step
 * remounts on navigation, that means the answer box is ready on every problem.
 * The learner can just type → Enter → type without clicking in each time.
 *
 * `preventScroll` keeps the prompt in view (focusing must not yank the page down
 * to the input). Pass `enabled = false` to skip stealing focus, e.g. when an
 * already-solved step is being reviewed.
 */
export function useAutoFocus(ref: RefObject<HTMLInputElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    // Focus synchronously on mount. (We avoid requestAnimationFrame here because
    // it's throttled/paused in hidden tabs, which would drop the focus.) A 0ms
    // timeout backstop covers the rare case where the field isn't committed yet.
    const focus = () => ref.current?.focus({ preventScroll: true })
    focus()
    const t = setTimeout(focus, 0)
    return () => clearTimeout(t)
  }, [ref, enabled])
}
