import { relativeMinutes, type Lead } from '../data/demo'
import { LeadAvatar } from './Avatar'
import { HeatBadge } from './HeatBadge'
import './LeadRow.css'

type Flag = { label: string; tone: string; title?: string }

/** At most one coloured flag per row, the most urgent: closed (Won/Lost), then Overdue. */
function rowFlag(lead: Lead): Flag | null {
  if (lead.closed) return lead.closed.result === 'won' ? { label: 'Won', tone: 'won' } : { label: 'Lost', tone: 'closed' }
  if (lead.overdue) return { label: 'Overdue', tone: 'danger', title: 'Waiting more than 15 minutes for a reply' }
  return null
}

/**
 * One conversation in the lead inbox: heat tag, at most one flag, then owner and source as plain text.
 * `ownerLabel` is shown to people who see other people's leads ("Priya N." or null for unassigned);
 * leave it undefined for someone looking at their own leads.
 */
export function LeadRow({ lead, onOpen, ownerLabel }: { lead: Lead; onOpen: () => void; ownerLabel?: string | null }) {
  const flag = rowFlag(lead)
  return (
    <button className={`lead-row ${lead.unread > 0 ? 'has-unread' : ''}`} onClick={onOpen}>
      <LeadAvatar lead={lead} showStatus />
      <div className="lead-row-copy">
        <div className="lead-row-top"><strong>{lead.name}</strong><time>{relativeMinutes(lead.inboxMinutesAgo ?? lead.minutesAgo)}</time></div>
        <span className="lead-row-need">{lead.need} · {lead.budget}</span>
        <div className="lead-row-message">
          <p>{lead.inboxPreview ?? lead.message}</p>
          {lead.unread > 0 && <b className="count-badge success" aria-label={`${lead.unread} unread`}>{lead.unread}</b>}
        </div>
        <footer>
          <HeatBadge temp={lead.temp} />
          {flag && <span className={`lead-flag ${flag.tone}`} title={flag.title}>{flag.label}</span>}
          <span className="lead-row-meta">
            {ownerLabel === null && <b className="lead-unassigned">Unassigned</b>}
            {ownerLabel && <span className="lead-owner">{ownerLabel}</span>}
            <span>via {lead.source}</span>
          </span>
        </footer>
      </div>
    </button>
  )
}
