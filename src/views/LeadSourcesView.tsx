import { LEAD_SOURCES } from '../data/sources'
import { TEAMS, type TeamId } from '../data/team'
import { Icon } from '../components/Icon'
import type { DemoStore } from '../state/useDemoStore'
import './LeadSourcesView.css'

const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

/**
 * Where leads come from (spec §8.3). Managers can view; the Owner can connect/disconnect,
 * set cost per lead and pick the team each source feeds ("By source" routing).
 * Weekly numbers are seed figures; "Simulate lead" creates a real demo lead.
 */
export function LeadSourcesView({ store, onSimulate }: { store: DemoStore; onSimulate: (sourceName?: string) => void }) {
  const canEdit = store.viewerCan('manageSettings')
  const rows = LEAD_SOURCES.map((source) => ({ source, setting: store.sourceSettings[source.name] }))
  const totalLeads = rows.reduce((sum, row) => sum + row.source.leadsThisWeek, 0)
  const totalSpend = rows.reduce((sum, row) => sum + row.source.leadsThisWeek * row.setting.costPerLead, 0)
  const bySource = store.settings.routing === 'source'

  return (
    <section className="sources-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Manage · Lead arrival</span>
          <h1>Lead sources</h1>
          <p>Portals, ads and walk-ins feeding your team, and what each lead costs.</p>
        </div>
        <button className="btn btn-primary" disabled={store.simulatableSources.length === 0} onClick={() => onSimulate()}><Icon name="bolt" /> Simulate new lead</button>
      </header>

      <div className="stat-strip">
        <div><span>Leads this week</span><strong>{totalLeads}</strong><small>All sources</small></div>
        <div><span>Spend this week</span><strong>{inr(totalSpend)}</strong><small>Leads × cost per lead</small></div>
        <div><span>Blended cost</span><strong>{inr(Math.round(totalSpend / Math.max(1, totalLeads)))}</strong><small>Per lead</small></div>
      </div>

      <section className="card">
        <header className="card-head">
          <div>
            <h2>Sources</h2>
            <p>{bySource ? 'Routing is “By source”: each source feeds the team chosen here.' : 'Team per source is used when Settings → Lead routing is “By source”.'}</p>
          </div>
        </header>
        {rows.map(({ source, setting }) => (
          <article key={source.name} className={`source-row ${setting.connected ? '' : 'is-off'}`}>
            <span className="source-name">
              <strong>{source.name}</strong>
              <small>{source.kind}{source.sharedWith ? ` · shared with ~${source.sharedWith} brokers` : ''}</small>
            </span>
            <span className={`source-status ${setting.connected ? 'on' : ''}`}>
              <i className="status-dot" /> {setting.connected ? (source.manual ?? (source.kind === 'Offline' ? 'Manual entry' : 'Connected')) : 'Not connected'}
            </span>
            <span className="source-stat"><strong>{source.leadsThisWeek}</strong><small>leads this week</small></span>
            <span className="source-stat"><strong>{source.avgResponseMin ? `${source.avgResponseMin} min` : '—'}</strong><small>first reply</small></span>
            <label className="source-cost">
              <small>Cost per lead</small>
              {canEdit
                ? <span className="source-input"><span>₹</span><input inputMode="numeric" value={setting.costPerLead} onChange={(event) => store.updateSource(source.name, { costPerLead: Number(event.target.value.replace(/\D/g, '').slice(0, 6)) })} aria-label={`${source.name} cost per lead`} /></span>
                : <strong>{inr(setting.costPerLead)}</strong>}
            </label>
            <label className="source-team">
              <small>Feeds team</small>
              <select disabled={!canEdit} value={setting.teamId} onChange={(event) => store.updateSource(source.name, { teamId: event.target.value as TeamId })} aria-label={`${source.name} team`}>
                {TEAMS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            <span className="source-actions">
              {canEdit && source.kind !== 'Offline' && !source.manual && (
                <button className="btn btn-secondary" onClick={() => store.updateSource(source.name, { connected: !setting.connected })}>{setting.connected ? 'Disconnect' : 'Connect'}</button>
              )}
              {source.canSimulate && <button className="btn btn-soft" disabled={!setting.connected} onClick={() => onSimulate(source.name)}><Icon name="bolt" size={16} /> Simulate</button>}
            </span>
          </article>
        ))}
      </section>
      <p className="sources-note"><Icon name="info" size={14} /> Weekly figures and connections are demo data. In the live product each portal connects with your account details.</p>
    </section>
  )
}
