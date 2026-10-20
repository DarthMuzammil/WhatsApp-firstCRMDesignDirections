import { useState } from 'react'
import type { Lead } from '../data/demo'
import type { NotificationKind } from '../data/notifications'
import type { DemoStore } from '../state/useDemoStore'
import { Dialog } from './Dialog'
import { Icon, type IconName } from './Icon'
import type { View } from './navigation'
import './NotificationBell.css'

const KIND_ICON: Record<NotificationKind, IconName> = {
  assigned: 'user', moved: 'swap', 'checkin-refused': 'pin', 'leave-request': 'calendar', 'leave-decision': 'calendar', correction: 'clock', 'deal-won': 'check',
}

/**
 * Bell with the viewer's unread count; opens their notifications (spec §8.12).
 * Each notification opens its lead's chat (if the viewer can still see the lead) or the related screen.
 */
export function NotificationBell({ store, onOpenLead, onNavigate, tone }: { store: DemoStore; onOpenLead: (lead: Lead) => void; onNavigate: (view: View) => void; tone: 'on-dark' | 'on-light' }) {
  const [open, setOpen] = useState(false)
  const unread = store.unreadNotifications
  const overdue = store.leads.filter((lead) => lead.overdue && !lead.closed).length

  function go(target: { leadId?: number; view?: View }) {
    setOpen(false)
    const lead = target.leadId === undefined ? undefined : store.leads.find((item) => item.id === target.leadId)
    if (lead) onOpenLead(lead)
    else onNavigate(target.view ?? 'today')
  }

  return <>
    <button className={`notification-bell ${tone}`} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <Icon name="bell" />
      {unread > 0 && <b className="count-badge danger" aria-hidden="true">{unread}</b>}
    </button>
    {open && (
      <Dialog label="Notifications" variant="sheet" onClose={() => setOpen(false)} className="notifications-dialog">
        <header className="assign-head">
          <div><h2>Notifications</h2><p>{unread ? `${unread} unread` : 'You’re up to date'}</p></div>
          <span className="notifications-head-buttons">
            {unread > 0 && <button className="btn btn-soft" onClick={store.markAllNotificationsRead}>Mark all read</button>}
            <button className="icon-button bordered" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" /></button>
          </span>
        </header>
        <div className="dialog-scroll notifications-body">
          {overdue > 0 && (
            <button className="notification-attention" onClick={() => go({ view: store.viewerCan('reassignLeads') ? 'escalations' : 'today' })}>
              <Icon name="alert" size={18} />
              <span><strong>{overdue} {overdue === 1 ? 'lead is' : 'leads are'} waiting over 15 min for a reply</strong><small>{store.viewerCan('reassignLeads') ? 'Open Escalations' : 'Open Today'}</small></span>
              <Icon name="chevron" size={16} />
            </button>
          )}
          <ul className="notification-list">
            {store.notifications.map((item) => (
              <li key={item.id}>
                <button className={item.read ? '' : 'unread'} onClick={() => { store.markNotificationRead(item.id); go({ leadId: item.leadId, view: item.view }) }}>
                  <span className={`icon-badge notification-icon ${item.kind === 'checkin-refused' ? 'danger' : item.kind === 'deal-won' ? 'success' : ''}`}><Icon name={KIND_ICON[item.kind]} size={16} /></span>
                  <span><span className="notification-text">{item.text}</span><small>{item.at}</small></span>
                  {!item.read && <i className="notification-dot" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
          {store.notifications.length === 0 && <p className="notifications-empty">Nothing yet. Leads assigned to you, leave decisions, refused check-ins and won deals show up here.</p>}
        </div>
      </Dialog>
    )}
  </>
}
