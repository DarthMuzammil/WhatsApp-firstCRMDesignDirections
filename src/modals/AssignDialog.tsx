import { useState } from 'react'
import { roleSummary, type Member } from '../data/team'
import { Avatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import './AssignDialog.css'

type AssignDialogProps = {
  title: string
  description: string
  candidates: Member[]
  /** Open-lead count per person, shown to help balance workload. */
  openLeadCount: (memberId: string) => number
  /** Reason options; the first is preselected. Omit to hide the reason picker. */
  reasons?: string[]
  confirmLabel: string
  onConfirm: (memberId: string, reason: string) => void
  onClose: () => void
}

/**
 * Pick a person (and optionally a reason). Used for: reassigning a lead, assigning from the
 * unassigned queue, Pre-sales → Sales hand-off, and moving leads when deactivating someone.
 */
export function AssignDialog({ title, description, candidates, openLeadCount, reasons, confirmLabel, onConfirm, onClose }: AssignDialogProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [reason, setReason] = useState(reasons?.[0] ?? '')
  const matches = candidates.filter((person) => `${person.name} ${roleSummary(person)}`.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Dialog label={title} variant="sheet" onClose={onClose} className="assign-dialog">
      <header className="assign-head">
        <div><h2>{title}</h2><p>{description}</p></div>
        <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or teams" aria-label="Search people" /></label>
      <div className="assign-list dialog-scroll" role="radiogroup" aria-label="People">
        {matches.map((person) => (
          <button key={person.id} role="radio" aria-checked={selected === person.id} className={selected === person.id ? 'selected' : ''} onClick={() => setSelected(person.id)}>
            <Avatar initials={person.initials} color={person.color} size="sm" />
            <span><strong>{person.name}</strong><small>{roleSummary(person)}{person.status === 'on-leave' ? ' · On leave' : ''}</small></span>
            <em>{openLeadCount(person.id)} open</em>
            <span className="radio-dot" aria-hidden="true">{selected === person.id && <Icon name="check" size={14} />}</span>
          </button>
        ))}
        {matches.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="search" /></span><h3>No one matches</h3></div>}
      </div>
      {reasons && (
        <label className="assign-reason">Reason
          <select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((option) => <option key={option}>{option}</option>)}</select>
        </label>
      )}
      <button className="btn btn-primary btn-block assign-confirm" disabled={!selected} onClick={() => selected && onConfirm(selected, reason)}>{confirmLabel}</button>
    </Dialog>
  )
}
