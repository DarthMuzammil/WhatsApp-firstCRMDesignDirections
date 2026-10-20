import { useEffect } from 'react'
import type { Lead } from '../data/demo'
import type { Member } from '../data/team'
import { LeadAvatar } from './Avatar'
import { Icon } from './Icon'
import './IncomingLeadBanner.css'

export type Arrival = { lead: Lead; owner?: Member; visible: boolean }

const BANNER_DURATION_MS = 7000

/** Slide-in card announcing a new enquiry (spec §8.3). Disappears after a few seconds. */
export function IncomingLeadBanner({ arrival, onOpen, onDismiss }: { arrival: Arrival; onOpen: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, BANNER_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [arrival, onDismiss])
  const { lead, owner, visible } = arrival
  return (
    <aside className="incoming-lead" role="status" aria-live="polite">
      <span className="incoming-lead-tag"><Icon name="bolt" size={14} /> New lead · {lead.source}</span>
      <div className="incoming-lead-body">
        <LeadAvatar lead={lead} />
        <span>
          <strong>{lead.name}</strong>
          <small>{lead.need} · {lead.budget}</small>
          <small>{owner ? `Assigned to ${owner.name}` : 'Waiting in the unassigned queue'}</small>
        </span>
      </div>
      <footer>
        <button className="btn btn-secondary" onClick={onDismiss}>Dismiss</button>
        {visible && <button className="btn btn-primary" onClick={onOpen}><Icon name="whatsapp" size={16} /> Reply now</button>}
      </footer>
    </aside>
  )
}
