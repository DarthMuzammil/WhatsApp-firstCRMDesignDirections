import { relativeMinutes, type Lead } from '../data/demo'
import { LeadAvatar } from './Avatar'
import { HeatBadge } from './HeatBadge'
import './LeadRow.css'

/**
 * One conversation in the lead inbox.
 * `ownerLabel` is shown to people who see other people's leads ("Priya N." or null for unassigned);
 * leave it undefined for someone looking at their own leads.
 */
export function LeadRow({ lead, onOpen, ownerLabel }: { lead: Lead; onOpen: () => void; ownerLabel?: string | null }) {
  return (
    <button className={`lead-row ${lead.unread > 0 ? 'has-unread' : ''}`} onClick={onOpen}>
      <LeadAvatar lead={lead} showStatus />
      <div className="lead-row-copy">
        <div className="lead-row-top"><strong>{lead.name}</strong><time>{relativeMinutes(lead.minutesAgo)}</time></div>
        <span className="lead-row-need">{lead.need} · {lead.budget}</span>
        <div className="lead-row-message">
          <p>{lead.message}</p>
          {lead.unread > 0 && <b className="count-badge success" aria-label={`${lead.unread} unread`}>{lead.unread}</b>}
        </div>
        <footer>
          <HeatBadge temp={lead.temp} />
          {lead.closed && <span className={`lead-flag ${lead.closed.result === 'won' ? 'won' : 'closed'}`}>{lead.closed.result === 'won' ? 'Won' : 'Lost'}</span>}
          {lead.overdue && <span className="lead-flag danger">Overdue</span>}
          {lead.sharedWith ? <span className="lead-flag shared" title={`Also sent to about ${lead.sharedWith} other brokers`}>Shared ×{lead.sharedWith}</span> : null}
          {ownerLabel === null && <span className="lead-flag warning">Unassigned</span>}
          {ownerLabel && <span className="lead-owner">{ownerLabel}</span>}
          <span>via {lead.source}</span>
        </footer>
      </div>
    </button>
  )
}
