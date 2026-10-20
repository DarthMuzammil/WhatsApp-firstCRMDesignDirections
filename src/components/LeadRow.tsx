import type { Lead } from '../data/demo'
import { LeadAvatar } from './Avatar'
import { HeatBadge } from './HeatBadge'
import './LeadRow.css'

/** One conversation in the lead inbox. */
export function LeadRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <button className={`lead-row ${lead.unread > 0 ? 'has-unread' : ''}`} onClick={onOpen}>
      <LeadAvatar lead={lead} showStatus />
      <div className="lead-row-copy">
        <div className="lead-row-top"><strong>{lead.name}</strong><time>{lead.time}</time></div>
        <span className="lead-row-need">{lead.need} · {lead.budget}</span>
        <div className="lead-row-message">
          <p>{lead.message}</p>
          {lead.unread > 0 && <b className="count-badge success" aria-label={`${lead.unread} unread`}>{lead.unread}</b>}
        </div>
        <footer><HeatBadge temp={lead.temp} /><span>via {lead.source}</span></footer>
      </div>
    </button>
  )
}
