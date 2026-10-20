import type { Lead } from '../data/demo'
import { Icon, type IconName } from './Icon'
import './LeadActions.css'

/** What a broker can do for the open lead. Implemented in views/ChatView.tsx. */
export type LeadActionHandlers = { shareHomes: () => void; scheduleVisit: () => void }

type ActionItem = { key: string; icon: IconName; label: string; shortLabel: string; detail: string; done?: boolean; onClick: () => void }

/**
 * The lead's main actions, shared by the phone chat bar and the lead detail panel.
 * - `bar`: two compact buttons (phone chat header)
 * - `cards`: two descriptive cards (detail panel)
 */
export function LeadActions({ lead, actions, layout, visitLabel }: { lead: Lead; actions: LeadActionHandlers; layout: 'bar' | 'cards'; visitLabel?: string }) {
  const items: ActionItem[] = [
    { key: 'share', icon: 'whatsapp', label: 'Share homes', shortLabel: 'Share homes', detail: 'Pick matches, preview, send', onClick: actions.shareHomes },
    {
      key: 'visit', icon: lead.visitScheduled ? 'check' : 'calendar', done: lead.visitScheduled,
      label: lead.visitScheduled ? 'Visit booked' : 'Schedule visit', shortLabel: lead.visitScheduled ? 'Visit booked' : 'Plan visit',
      detail: lead.visitScheduled && visitLabel ? visitLabel : 'Pick a day and time', onClick: actions.scheduleVisit,
    },
  ]

  return (
    <div className={`lead-actions lead-actions-${layout}`}>
      {items.map((item) => (
        <button key={item.key} className={item.done ? 'is-done' : ''} onClick={item.onClick}>
          <Icon name={item.icon} size={layout === 'bar' ? 16 : 18} />
          {layout === 'bar'
            ? <span>{item.shortLabel}</span>
            : <span><strong>{item.label}</strong><small>{item.detail}</small></span>}
        </button>
      ))}
    </div>
  )
}
