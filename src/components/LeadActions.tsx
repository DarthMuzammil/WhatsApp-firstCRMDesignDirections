import type { Lead } from '../data/demo'
import { Icon, type IconName } from './Icon'
import './LeadActions.css'

/** What a broker can do for the open lead. Implemented in views/ChatView.tsx. */
export type LeadActionHandlers = { shareHomes: () => void; scheduleVisit: () => void }

type ActionItem = { key: string; icon: IconName; label: string; done?: boolean; onClick: () => void }

/**
 * The lead's two main actions as a bar above the chat thread, on every screen size.
 * Once a visit is booked the second button reads "Visit booked" (plus its time on desktop) and opens Visits.
 */
export function LeadActions({ lead, actions, visitLabel }: { lead: Lead; actions: LeadActionHandlers; visitLabel?: string }) {
  const items: ActionItem[] = [
    { key: 'share', icon: 'whatsapp', label: 'Share homes', onClick: actions.shareHomes },
    { key: 'visit', icon: lead.visitScheduled ? 'check' : 'calendar', done: lead.visitScheduled, label: lead.visitScheduled ? 'Visit booked' : 'Plan visit', onClick: actions.scheduleVisit },
  ]

  return (
    <div className="lead-actions">
      {items.map((item) => (
        <button key={item.key} className={item.done ? 'is-done' : ''} onClick={item.onClick}>
          <Icon name={item.icon} size={16} />
          <span>{item.label}{item.done && visitLabel && <small className="lead-actions-when"> · {visitLabel}</small>}</span>
        </button>
      ))}
    </div>
  )
}
