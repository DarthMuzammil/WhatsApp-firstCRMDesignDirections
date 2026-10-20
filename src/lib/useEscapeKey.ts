import { useEffect, useRef } from 'react'

/** Calls `onEscape` when the Escape key is pressed, while `enabled` is true. Used to close dialogs. */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  const latest = useRef(onEscape)
  latest.current = onEscape
  useEffect(() => {
    if (!enabled) return
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && latest.current()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled])
}
