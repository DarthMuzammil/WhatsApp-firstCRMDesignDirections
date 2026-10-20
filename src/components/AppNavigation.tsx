import { BROKER } from '../data/demo'
import { AccountMenu } from './AccountMenu'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { NAV_ITEMS, type View } from './navigation'
import './AppNavigation.css'

/** `view` is the nav item to highlight (App passes the chat's origin screen while a chat is open). */
type NavProps = { view: View; onNavigate: (view: View) => void }

type SidebarProps = NavProps & {
  unreadTotal: number
  leadsAwaitingReply: number
  tasksRemaining: number
  tasksTotal: number
  onReset: () => void
}

/** Desktop and tablet navigation. Hidden on phones, where MobileTopBar + MobileTabBar take over. */
export function Sidebar({ view, onNavigate, unreadTotal, leadsAwaitingReply, tasksRemaining, tasksTotal, onReset }: SidebarProps) {
  const caughtUp = leadsAwaitingReply === 0 && tasksRemaining === 0
  const progress = tasksTotal === 0 ? 100 : Math.round(((tasksTotal - tasksRemaining) / tasksTotal) * 100)
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('today')}><span className="brand-mark">D</span><strong>Daira</strong></button>
      <nav className="sidebar-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button key={item.view} className={item.view === view ? 'active' : ''} aria-current={item.view === view ? 'page' : undefined} onClick={() => onNavigate(item.view)}>
            <Icon name={item.icon} /><span>{item.label}</span>
            {item.view === 'today' && unreadTotal > 0 && <b className={`count-badge ${item.view === view ? 'navy' : 'mint'}`} aria-label={`${unreadTotal} unread messages`}>{unreadTotal}</b>}
            {item.view === 'tasks' && tasksRemaining > 0 && <b className={`count-badge ${item.view === view ? 'navy' : 'mint'}`} aria-label={`${tasksRemaining} follow-ups left`}>{tasksRemaining}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-status">
        <Icon name={caughtUp ? 'check' : 'spark'} />
        <strong>{caughtUp ? 'You’re all caught up' : 'Today’s progress'}</strong>
        <span>
          {caughtUp
            ? 'Every buyer has heard from you today.'
            : [
                leadsAwaitingReply > 0 && `${leadsAwaitingReply} ${leadsAwaitingReply === 1 ? 'buyer needs' : 'buyers need'} a reply`,
                tasksRemaining > 0 && `${tasksRemaining} follow-up${tasksRemaining === 1 ? '' : 's'} left`,
              ].filter(Boolean).join(' · ')}
        </span>
        <div className="sidebar-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Follow-ups completed"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="sidebar-user">
        <Avatar initials={BROKER.initials} color="blue" size="sm" />
        <span><strong>{BROKER.name}</strong><small>{BROKER.base}</small></span>
        <AccountMenu trigger={<Icon name="more" />} label="Account menu" placement="up" onReset={onReset} />
      </div>
    </aside>
  )
}

/** Phone-only header with brand, WhatsApp status, account menu and quick "add lead". */
export function MobileTopBar({ onNavigate, onAddLead, onReset }: { onNavigate: (view: View) => void; onAddLead: () => void; onReset: () => void }) {
  return (
    <header className="mobile-top-bar">
      <button className="brand" onClick={() => onNavigate('today')}><span className="brand-mark">D</span><strong>Daira</strong></button>
      <span className="whatsapp-status"><i className="status-dot glow" /><span>WhatsApp connected</span></span>
      <AccountMenu trigger={<Avatar initials={BROKER.initials} color="blue" size="sm" />} label="Account menu" placement="down" onReset={onReset} />
      <button className="mobile-add" aria-label="Add a new lead" onClick={onAddLead}><Icon name="plus" /></button>
    </header>
  )
}

/** Phone-only bottom tab bar. */
export function MobileTabBar({ view, onNavigate, unreadTotal }: NavProps & { unreadTotal: number }) {
  return (
    <nav className="mobile-tab-bar" aria-label="Main">
      {NAV_ITEMS.map((item) => (
        <button key={item.view} className={item.view === view ? 'active' : ''} aria-current={item.view === view ? 'page' : undefined} onClick={() => onNavigate(item.view)}>
          <span className="tab-icon"><Icon name={item.icon} />{item.view === 'today' && unreadTotal > 0 && <b className="count-badge">{unreadTotal}</b>}</span>
          <span>{item.shortLabel}</span>
        </button>
      ))}
    </nav>
  )
}
