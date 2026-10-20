import type { Lead } from '../data/demo'
import { nextSaturdayLabel } from '../lib/format'
import { Icon, type IconName } from './Icon'
import './LeadActions.css'

/** What a broker can do for the open lead. Implemented in views/ChatView.tsx. */
export type LeadActionHandlers = { shareShortlist: () => void; scheduleVisit: () => void; showMatches: () => void }

type ActionItem = { key: string; icon: IconName; label: string; shortLabel: string; detail: string; done?: boolean; onClick: () => void }

/**
 * The lead's main actions, shared by the phone chat bar and the lead detail panel.
 * - `bar`: three compact buttons (phone chat header)
 * - `cards`: two descriptive cards (detail panel; "Matches" has its own full-width button there)
 */
export function LeadActions({ lead, actions, layout }: { lead: Lead; actions: LeadActionHandlers; layout: 'bar' | 'cards' }) {
  const items: ActionItem[] = [
    { key: 'shortlist', icon: 'whatsapp', label: 'Share shortlist', shortLabel: 'Shortlist', detail: 'Send 3 matching homes', onClick: actions.shareShortlist },
    {
      key: 'visit', icon: lead.visitScheduled ? 'check' : 'calendar', done: lead.visitScheduled,
      label: lead.visitScheduled ? 'Visit booked' : 'Schedule visit', shortLabel: lead.visitScheduled ? 'Visit booked' : 'Plan visit',
      detail: `${nextSaturdayLabel()} · 11:30 AM`, onClick: actions.scheduleVisit,
    },
  ]
  if (layout === 'bar') items.push({ key: 'matches', icon: 'home', label: 'See matches', shortLabel: 'Matches', detail: '', onClick: actions.showMatches })

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
