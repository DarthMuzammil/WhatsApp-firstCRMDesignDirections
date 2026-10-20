import { useEffect } from 'react'

/** Calls `onEscape` when the Escape key is pressed. Used to close dialogs. */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onEscape()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape])
}
