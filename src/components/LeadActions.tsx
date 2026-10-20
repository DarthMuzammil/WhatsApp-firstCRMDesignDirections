import type { Lead } from '../data/demo'
import { Icon, type IconName } from './Icon'
import './LeadActions.css'

/**
 * What the viewer can do for the open lead. Implemented in views/ChatView.tsx.
 * `scheduleVisit` is left out for people who don't run visits (Pre-sales); they get `handToSales` instead
 * when the lead is theirs to hand over.
 */
export type LeadActionHandlers = { shareHomes: () => void; scheduleVisit?: () => void; handToSales?: () => void; remind: () => void }

type ActionItem = { key: string; icon: IconName; label: string; done?: boolean; onClick: () => void }

/**
 * The lead's main actions as a bar above the chat thread, on every screen size: Share homes, Plan visit
 * (or Hand to Sales) and Remind me. Once a visit is booked the button reads "Visit booked" (plus its time on desktop)
 * and opens Visits.
 */
export function LeadActions({ lead, actions, visitLabel }: { lead: Lead; actions: LeadActionHandlers; visitLabel?: string }) {
  const items: ActionItem[] = [
    { key: 'share', icon: 'whatsapp', label: 'Share homes', onClick: actions.shareHomes },
    ...(actions.scheduleVisit
      ? [{ key: 'visit', icon: (lead.visitScheduled ? 'check' : 'calendar') as IconName, done: lead.visitScheduled, label: lead.visitScheduled ? 'Visit booked' : 'Plan visit', onClick: actions.scheduleVisit }]
      : actions.handToSales ? [{ key: 'handoff', icon: 'arrow' as IconName, label: 'Hand to Sales', onClick: actions.handToSales }] : []),
    { key: 'remind', icon: 'clock', label: 'Remind me', onClick: actions.remind },
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
