import { ROLE_LABELS, type Role } from '../data/team'
import { GRACE_OPTIONS, WORK_START_OPTIONS } from '../data/attendance'
import { CHECK_IN_RADIUS_OPTIONS, OFFICES } from '../data/visits'
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
        <header className="card-head"><div><h2>WhatsApp auto-reply</h2><p>Answers new enquiries within seconds, day or night, so no lead waits for a human.</p></div></header>
        <button role="switch" aria-checked={settings.autoReply.enabled} className="setting-row" onClick={() => { store.updateSettings({ autoReply: { ...settings.autoReply, enabled: !settings.autoReply.enabled } }); notify(`Auto-reply turned ${settings.autoReply.enabled ? 'off' : 'on'}`) }}>
          <span><strong>Auto-reply to new enquiries</strong><small>Sent from your WhatsApp business number and marked “Automatic” in the chat.</small></span>
          <span className={`switch ${settings.autoReply.enabled ? 'on' : ''}`} aria-hidden="true"><i /></span>
        </button>
        <label className="setting-message">
          <span>Message <small>{'{name}'} becomes the buyer’s first name</small></span>
          <textarea rows={3} value={settings.autoReply.message} disabled={!settings.autoReply.enabled} onChange={(event) => store.updateSettings({ autoReply: { ...settings.autoReply, message: event.target.value } })} />
        </label>
        <button role="switch" aria-checked={settings.autoReply.qualify} disabled={!settings.autoReply.enabled} className="setting-row" onClick={() => { store.updateSettings({ autoReply: { ...settings.autoReply, qualify: !settings.autoReply.qualify } }); notify(`Qualifying questions turned ${settings.autoReply.qualify ? 'off' : 'on'}`) }}>
          <span><strong>Ask qualifying questions</strong><small>Budget, area and bedrooms, move-in. AI suggests the answers for the buyer brief; a person confirms them.</small></span>
          <span className={`switch ${settings.autoReply.qualify && settings.autoReply.enabled ? 'on' : ''}`} aria-hidden="true"><i /></span>
        </button>
      </section>

      <section className="card settings-section">
        <header className="card-head"><div><h2>Field check-ins and attendance</h2><p>Location is read once, when someone taps a check-in button. There is no live tracking.</p></div></header>
        <div className="setting-row static">
          <span><strong>Check-in radius</strong><small>Check-ins further than this from the visit address or office are refused.</small></span>
          <div className="segmented" role="radiogroup" aria-label="Check-in radius">
            {CHECK_IN_RADIUS_OPTIONS.map((metres) => (
              <button key={metres} role="radio" aria-checked={settings.checkInRadiusM === metres} className={settings.checkInRadiusM === metres ? 'active' : ''} onClick={() => { store.updateSettings({ checkInRadiusM: metres }); notify(`Check-in radius set to ${metres} m`) }}>{metres} m</button>
            ))}
          </div>
        </div>
        <div className="setting-row static">
          <span><strong>Working hours</strong><small>Office check-ins after the start time plus grace are marked late.</small></span>
          <span className="setting-selects">
            <label>Starts<select value={settings.workStart} onChange={(event) => { store.updateSettings({ workStart: event.target.value }); notify(`Work start set to ${event.target.value}`) }}>{WORK_START_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Grace<select value={settings.graceMin} onChange={(event) => { store.updateSettings({ graceMin: Number(event.target.value) }); notify(`Grace period set to ${event.target.value} min`) }}>{GRACE_OPTIONS.map((option) => <option key={option} value={option}>{option} min</option>)}</select></label>
          </span>
        </div>
        <ul className="office-list">
          {OFFICES.map((office) => <li key={office.name}><Icon name="pin" size={16} /><span><strong>{office.name}</strong><small>{office.address}</small></span></li>)}
        </ul>
      </section>

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
