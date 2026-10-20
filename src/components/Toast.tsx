import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import './Toast.css'

const TOAST_DURATION_MS = 2600

/** `success` (default, tick) confirms an action; `warning` (alert icon) reports something that was refused. */
export type ToastTone = 'success' | 'warning'
export type Notify = (text: string, tone?: ToastTone) => void

/** Returns the current message and a `notify` function. A new message replaces the old one and restarts the timer. */
export function useToast() {
  const [message, setMessage] = useState<{ text: string; tone: ToastTone } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const notify = useCallback<Notify>((text, tone = 'success') => {
    window.clearTimeout(timer.current)
    setMessage({ text, tone })
    timer.current = window.setTimeout(() => setMessage(null), TOAST_DURATION_MS)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { message, notify }
}

export function Toast({ message }: { message: { text: string; tone: ToastTone } | null }) {
  if (!message) return null
  return <div className={`toast ${message.tone}`} role="status"><Icon name={message.tone === 'warning' ? 'alert' : 'check'} /><span>{message.text}</span></div>
}
