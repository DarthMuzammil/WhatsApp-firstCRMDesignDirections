import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import './Toast.css'

const TOAST_DURATION_MS = 2600

/** Returns the current message and a `notify` function. A new message replaces the old one and restarts the timer. */
export function useToast() {
  const [message, setMessage] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const notify = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(''), TOAST_DURATION_MS)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { message, notify }
}

export function Toast({ message }: { message: string }) {
  if (!message) return null
  return <div className="toast" role="status"><Icon name="check" /><span>{message}</span></div>
}
