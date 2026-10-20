import { useState } from 'react'
import { VIEW_AS_PERSONAS, roleSummary } from '../data/team'
import type { DemoStore } from '../state/useDemoStore'
import { AccountMenu } from './AccountMenu'
import { Avatar } from './Avatar'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { PHONE_TAB_VIEWS, navItemsFor, type NavItem, type View } from './navigation'
import './AppNavigation.css'

/** `view` is the nav item to highlight (App passes the chat's origin screen while a chat is open). */
type NavProps = { store: DemoStore; view: View; onNavigate: (view: View) => void }

/** The count shown next to a nav item, if any. */
function badgeFor(item: NavItem, store: DemoStore): { count: number; label: string; tone: 'default' | 'danger' } | null {
  if (item.view === 'today' && store.unreadTotal > 0) return { count: store.unreadTotal, label: 'unread messages', tone: 'default' }
  if (item.view === 'tasks' && store.remainingTasks.length > 0) return { count: store.remainingTasks.length, label: 'follow-ups left', tone: 'default' }
  if (item.view === 'escalations' && store.escalations.length > 0) return { count: store.escalations.length, label: 'leads need attention', tone: 'danger' }
  return null
}

function AccountMenuFor({ store, trigger, placement }: { store: DemoStore; trigger: React.ReactNode; placement: 'up' | 'down' }) {
  const personas = VIEW_AS_PERSONAS.map((id) => store.findMember(id)).filter((person) => !!person)
  return <AccountMenu trigger={trigger} label="Account menu" placement={placement} viewer={store.viewer} personas={personas} onViewAs={store.setViewer} onReset={store.resetDemo} />
}

/** Desktop and tablet navigation. Hidden on phones, where MobileTopBar + MobileTabBar take over. */
export function Sidebar({ store, view, onNavigate }: NavProps) {
  const items = navItemsFor(store.viewerCan)
  const tasksTotal = store.tasks.length
  const tasksRemaining = store.remainingTasks.length
  const caughtUp = store.leadsAwaitingReply === 0 && tasksRemaining === 0
  const progress = tasksTotal === 0 ? 100 : Math.round(((tasksTotal - tasksRemaining) / tasksTotal) * 100)

  const renderItem = (item: NavItem) => {
    const badge = badgeFor(item, store)
    const active = item.view === view
    return (
      <button key={item.view} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => onNavigate(item.view)}>
        <Icon name={item.icon} /><span>{item.label}</span>
        {badge && <b className={`count-badge ${badge.tone === 'danger' ? 'danger' : active ? 'navy' : 'mint'}`} aria-label={`${badge.count} ${badge.label}`}>{badge.count}</b>}
      </button>
    )
  }
  const manageItems = items.filter((item) => item.group === 'manage')

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('today')}><span className="brand-mark">D</span><strong>Daira</strong></button>
      <nav className="sidebar-nav" aria-label="Main">
        {items.filter((item) => item.group === 'work').map(renderItem)}
        {manageItems.length > 0 && <>
          <span className="sidebar-group-label">Manage</span>
          {manageItems.map(renderItem)}
        </>}
      </nav>
      <div className="sidebar-status">
        <Icon name={caughtUp ? 'check' : 'spark'} />
        <strong>{caughtUp ? 'You’re all caught up' : 'Today’s progress'}</strong>
        <span>
          {caughtUp
            ? 'Every buyer has heard from you today.'
            : [
                store.leadsAwaitingReply > 0 && `${store.leadsAwaitingReply} ${store.leadsAwaitingReply === 1 ? 'buyer needs' : 'buyers need'} a reply`,
                tasksRemaining > 0 && `${tasksRemaining} follow-up${tasksRemaining === 1 ? '' : 's'} left`,
              ].filter(Boolean).join(' · ')}
        </span>
        <div className="sidebar-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Follow-ups completed"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="sidebar-user">
        <Avatar initials={store.viewer.initials} color={store.viewer.color} size="sm" />
        <span><strong>{store.viewer.name}</strong><small>{roleSummary(store.viewer)}</small></span>
        <AccountMenuFor store={store} trigger={<Icon name="more" />} placement="up" />
      </div>
    </aside>
  )
}

/** Phone-only header with brand, WhatsApp status, account menu and quick "add lead". */
export function MobileTopBar({ store, onNavigate, onAddLead }: { store: DemoStore; onNavigate: (view: View) => void; onAddLead: () => void }) {
  return (
    <header className="mobile-top-bar">
      <button className="brand" onClick={() => onNavigate('today')}><span className="brand-mark">D</span><strong>Daira</strong></button>
      <span className="whatsapp-status"><i className="status-dot glow" /><span>WhatsApp connected</span></span>
      <AccountMenuFor store={store} trigger={<Avatar initials={store.viewer.initials} color={store.viewer.color} size="sm" />} placement="down" />
      <button className="mobile-add" aria-label="Add a new lead" onClick={onAddLead}><Icon name="plus" /></button>
    </header>
  )
}

/** Phone-only bottom tab bar: four main tabs plus "More" (calls and manager screens). */
export function MobileTabBar({ store, view, onNavigate }: NavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const items = navItemsFor(store.viewerCan)
  const tabs = items.filter((item) => PHONE_TAB_VIEWS.includes(item.view))
  const moreItems = items.filter((item) => !PHONE_TAB_VIEWS.includes(item.view))
  const moreActive = moreItems.some((item) => item.view === view)
  const moreHasAlert = moreItems.some((item) => badgeFor(item, store)?.tone === 'danger')

  return (
    <nav className="mobile-tab-bar" aria-label="Main">
      {tabs.map((item) => {
        const badge = badgeFor(item, store)
        return (
          <button key={item.view} className={item.view === view ? 'active' : ''} aria-current={item.view === view ? 'page' : undefined} onClick={() => onNavigate(item.view)}>
            <span className="tab-icon"><Icon name={item.icon} />{badge && item.view === 'today' && <b className="count-badge">{badge.count}</b>}</span>
            <span>{item.shortLabel}</span>
          </button>
        )
      })}
      <button className={moreActive ? 'active' : ''} aria-haspopup="dialog" onClick={() => setMoreOpen(true)}>
        <span className="tab-icon"><Icon name="more" />{moreHasAlert && <b className="count-badge danger" aria-label="Needs attention">!</b>}</span>
        <span>More</span>
      </button>
      {moreOpen && (
        <Dialog label="More" variant="sheet" onClose={() => setMoreOpen(false)}>
          <div className="more-sheet dialog-scroll">
            {moreItems.map((item) => {
              const badge = badgeFor(item, store)
              return (
                <button key={item.view} className={item.view === view ? 'active' : ''} onClick={() => { setMoreOpen(false); onNavigate(item.view) }}>
                  <Icon name={item.icon} /><span>{item.label}</span>
                  {badge && <b className={`count-badge ${badge.tone === 'danger' ? 'danger' : ''}`}>{badge.count}</b>}
                  <Icon name="chevron" size={16} />
                </button>
              )
            })}
          </div>
        </Dialog>
      )}
    </nav>
  )
}
