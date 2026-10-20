import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey } from '../lib/useEscapeKey'
import './Dialog.css'

/**
 * - `center`: centred card (forms, confirmations)
 * - `sheet`: centred card on desktop, bottom sheet on phones (pickers, lead details)
 * - `fullscreen`: dark full-screen on phones, centred on desktop (call screen)
 */
export type DialogVariant = 'center' | 'sheet' | 'fullscreen'

type DialogProps = {
  /** Accessible name announced by screen readers. */
  label: string
  onClose: () => void
  variant?: DialogVariant
  /** When false, Escape and clicking outside do nothing (e.g. during a live call). */
  dismissible?: boolean
  /** Extra class on the panel, for component-specific styling. */
  className?: string
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The one dialog shell for the app: portal, backdrop, Escape, click-outside, focus trap and focus return. */
export function Dialog({ label, onClose, variant = 'center', dismissible = true, className = '', children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Captured during the first render, before any autoFocus child steals focus.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  useEscapeKey(onClose, dismissible)

  // Move focus into the dialog (unless a child already took it with autoFocus) and give it back on close.
  useEffect(() => {
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) {
      (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus()
    }
    // Only restore once the dialog has really left the page (React dev mode re-runs effects while it is still mounted).
    return () => { if (!panel?.isConnected) opener?.focus?.() }
  }, [opener])

  // Keep Tab / Shift+Tab inside the dialog.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return createPortal(
    <div className={`dialog-backdrop dialog-backdrop-${variant}`} onMouseDown={(event) => dismissible && event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className={`dialog dialog-${variant} ${className}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={trapFocus}>
        {variant === 'sheet' && <div className="dialog-handle" aria-hidden="true" />}
        {children}
      </div>
    </div>,
    document.body,
  )
}
