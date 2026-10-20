import { ROLE_LABELS, type Role } from '../data/team'
import { Icon } from '../components/Icon'
import { PERMISSION_LABELS, ROLE_PERMISSIONS, type Permission } from '../lib/permissions'
import type { DemoStore, RoutingMode } from '../state/useDemoStore'
import './SettingsView.css'

const ROUTING_OPTIONS: { mode: RoutingMode; title: string; detail: string }[] = [
  { mode: 'round-robin', title: 'Round-robin', detail: 'Next lead goes to whoever has the fewest open leads.' },
  { mode: 'locality', title: 'By locality', detail: 'Leads go to the team covering the buyer’s area, then fewest open leads.' },
  { mode: 'source', title: 'By source', detail: 'Each portal or campaign feeds a chosen team (set up per source).' },
]
const ROLES: Role[] = ['owner', 'manager', 'sales', 'presales']

/** Company settings (Owner only): team setup, lead routing, and what each role can do. */
export function SettingsView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const { settings } = store
  return (
    <section className="settings-view">
      <header className="page-head">
        <div><span className="eyebrow">Manage · Company</span><h1>Settings</h1><p>How leads flow through your team and who can see what.</p></div>
      </header>

      <div className="settings-grid">
        <section className="card settings-section">
          <header className="card-head"><div><h2>Team setup</h2><p>Some brokerages have telecallers who qualify leads first; others don’t.</p></div></header>
          {/* The whole row is the switch, so it is easy to tap on a phone. */}
          <button
            role="switch"
            aria-checked={settings.separatePresales}
            className="setting-row"
            onClick={() => { store.updateSettings({ separatePresales: !settings.separatePresales }); notify(`Separate pre-sales turned ${settings.separatePresales ? 'off' : 'on'}`) }}
          >
            <span>
              <strong>Separate pre-sales team</strong>
              <small>{settings.separatePresales
                ? 'New leads go to Pre-sales first. They qualify the buyer, then hand the lead to Sales.'
                : 'Sales handle every lead from first message to closing. The hand-off step is hidden.'}</small>
            </span>
            <span className={`switch ${settings.separatePresales ? 'on' : ''}`} aria-hidden="true"><i /></span>
          </button>
        </section>

        <section className="card settings-section">
          <header className="card-head"><div><h2>Lead routing</h2><p>Who gets a new lead when it arrives{settings.separatePresales ? ' (after Pre-sales hands it over)' : ''}.</p></div></header>
          <div className="routing-options" role="radiogroup" aria-label="Lead routing">
            {ROUTING_OPTIONS.map((option) => (
              <button key={option.mode} role="radio" aria-checked={settings.routing === option.mode} className={settings.routing === option.mode ? 'selected' : ''} onClick={() => { store.updateSettings({ routing: option.mode }); notify(`Routing set to ${option.title.toLowerCase()}`) }}>
                <span className="radio-dot" aria-hidden="true">{settings.routing === option.mode && <Icon name="check" size={14} />}</span>
                <span><strong>{option.title}</strong><small>{option.detail}</small></span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="card settings-section">
        <header className="card-head"><div><h2>Roles and permissions</h2><p>A person can hold more than one role; they get everything each role allows. Custom roles come later.</p></div></header>
        <div className="permissions-table" role="table" aria-label="Permissions by role">
          <div role="row" className="permissions-row permissions-header">
            <span role="columnheader">Permission</span>
            {ROLES.map((role) => <span key={role} role="columnheader">{ROLE_LABELS[role]}</span>)}
          </div>
          {(Object.keys(PERMISSION_LABELS) as Permission[]).map((permission) => (
            <div key={permission} role="row" className="permissions-row">
              <span role="rowheader">{PERMISSION_LABELS[permission]}</span>
              {ROLES.map((role) => {
                const allowed = ROLE_PERMISSIONS[role].includes(permission)
                return <span key={role} role="cell" aria-label={allowed ? 'Allowed' : 'Not allowed'} className={allowed ? 'allowed' : ''}>{allowed ? <Icon name="check" size={16} /> : '—'}</span>
              })}
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
