import { useState, type ReactNode } from 'react'
import { roleSummary, type Member } from '../data/team'
import { Avatar } from './Avatar'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { BROKERAGE } from '../data/brand'
import { useEscapeKey } from '../lib/useEscapeKey'
import './AccountMenu.css'

type AccountMenuProps = {
  trigger: ReactNode
  label: string
  placement: 'up' | 'down'
  viewer: Member
  /** People the demo can switch to, one per role (spec §8.1 "View as"). */
  personas: Member[]
  onViewAs: (memberId: string) => void
  /** Demo: make a new enquiry arrive from a connected source. */
  onSimulateLead: () => void
  /** Demo (M14): a requirement forwarded from a broker group is shared to Bayana from the phone. */
  onSimulateForward: () => void
  onStartDemo: () => void
  onReset: () => void
}

/** Popover with the demo "View as" switcher and Reset demo data (with confirmation). */
export function AccountMenu({ trigger, label, placement, viewer, personas, onViewAs, onSimulateLead, onSimulateForward, onStartDemo, onReset }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Escape closes the menu (the reset confirmation, a Dialog, handles its own Escape).
  useEscapeKey(() => setOpen(false), open && !confirming)
  return (
    <div className="account-menu">
      <button className="account-menu-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>{trigger}</button>
      {open && <>
        <div className="account-menu-dismiss" onClick={() => setOpen(false)} />
        <div className={`account-menu-popover ${placement}`} role="menu">
          <div className="account-menu-workspace"><small>Workspace</small><strong>{BROKERAGE.name}</strong></div>
          <div className="account-menu-divider" />
          <span className="eyebrow account-menu-section">Demo · View as</span>
          {personas.map((person) => (
            <button key={person.id} role="menuitemradio" aria-checked={person.id === viewer.id} className={person.id === viewer.id ? 'current' : ''} onClick={() => { setOpen(false); onViewAs(person.id) }}>
              <Avatar initials={person.initials} color={person.color} size="sm" />
              <span><strong>{person.name}</strong><small>{roleSummary(person)}</small></span>
              {person.id === viewer.id && <Icon name="check" size={16} />}
            </button>
          ))}
          <div className="account-menu-divider" />
          <button role="menuitem" onClick={() => { setOpen(false); onStartDemo() }}>
            <span className="account-menu-icon"><Icon name="play" size={16} /></span>
            <span><strong>Start guided demo</strong><small>Enquiry to won deal, one click per step</small></span>
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); onSimulateLead() }}>
            <span className="account-menu-icon"><Icon name="bolt" size={16} /></span>
            <span><strong>Simulate incoming lead</strong><small>A new enquiry arrives and is routed</small></span>
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); onSimulateForward() }}>
            <span className="account-menu-icon"><Icon name="whatsapp" size={16} /></span>
            <span><strong>Simulate a forwarded group message</strong><small>Share a broker group’s requirement to Bayana</small></span>
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); setConfirming(true) }}>
            <span className="account-menu-icon"><Icon name="refresh" size={16} /></span>
            <span><strong>Reset demo data</strong><small>Restore the original leads, team and calls</small></span>
          </button>
        </div>
      </>}
      {confirming && (
        <Dialog label="Reset demo data?" className="confirm-dialog" onClose={() => setConfirming(false)}>
          <h2>Reset demo data?</h2>
          <p>This removes leads and people you added, reassignments, sent messages, completed tasks and saved calls, and restores the original demo.</p>
          <footer>
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={onReset}>Reset demo</button>
          </footer>
        </Dialog>
      )}
    </div>
  )
}
