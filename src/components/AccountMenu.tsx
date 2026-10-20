import { useState, type ReactNode } from 'react'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import './AccountMenu.css'

/** Popover with demo utilities. `trigger` is the button content; `placement` sets where the menu opens. */
export function AccountMenu({ trigger, label, placement, onReset }: { trigger: ReactNode; label: string; placement: 'up' | 'down'; onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="account-menu">
      <button className="account-menu-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>{trigger}</button>
      {open && <>
        <div className="account-menu-dismiss" onClick={() => setOpen(false)} />
        <div className={`account-menu-popover ${placement}`} role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); setConfirming(true) }}>
            <Icon name="refresh" size={16} />
            <span><strong>Reset demo data</strong><small>Restore the original leads, tasks and calls</small></span>
          </button>
        </div>
      </>}
      {confirming && (
        <Dialog label="Reset demo data?" className="confirm-dialog" onClose={() => setConfirming(false)}>
          <h2>Reset demo data?</h2>
          <p>This removes leads you added, sent messages, completed tasks and saved calls, and restores the original demo.</p>
          <footer>
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={onReset}>Reset demo</button>
          </footer>
        </Dialog>
      )}
    </div>
  )
}
