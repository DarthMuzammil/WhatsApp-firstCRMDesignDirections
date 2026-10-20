import { useState } from 'react'
import { STAGES } from '../data/demo'
import { AUDIT_KIND_LABELS, type AuditKind } from '../data/notifications'
import { shortName } from '../data/team'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { downloadCsv, toCsv } from '../lib/csv'
import type { DemoStore } from '../state/useDemoStore'
import './AuditView.css'

type KindFilter = 'all' | AuditKind

/**
 * Owner-only audit log (spec §8.12): reassignments, team changes, settings, listings, deals and exports,
 * newest first, with CSV export of the leads and of the log itself (each export is logged too).
 */
export function AuditView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const [kind, setKind] = useState<KindFilter>('all')
  const entries = store.auditLog.filter((entry) => kind === 'all' || entry.kind === kind)
  const who = (id: string) => store.findMember(id)

  function exportLeads() {
    const rows = store.leads.map((lead) => [
      lead.name, store.displayPhone(lead.phone), lead.source, lead.ownerId ? who(lead.ownerId)?.name ?? '' : 'Unassigned',
      lead.closed ? (lead.closed.result === 'won' ? 'Won' : 'Lost') : STAGES[lead.stage], lead.budget, lead.need, (lead.localities ?? [lead.locality]).join(' / '),
    ])
    downloadCsv('daira-leads.csv', toCsv([['Name', 'Phone', 'Source', 'Owner', 'Stage', 'Budget', 'Looking for', 'Localities'], ...rows]))
    store.recordExport(`Exported leads as CSV (${rows.length} rows)`)
    notify(`${rows.length} leads exported`)
  }
  function exportLog() {
    const rows = store.auditLog.map((entry) => [entry.at, who(entry.byId)?.name ?? entry.byId, AUDIT_KIND_LABELS[entry.kind], entry.text])
    downloadCsv('daira-audit-log.csv', toCsv([['When', 'Who', 'Type', 'What'], ...rows]))
    store.recordExport(`Exported the audit log as CSV (${rows.length} rows)`)
    notify('Audit log exported')
  }

  return (
    <section className="audit-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Owner only</span>
          <h1>Audit log</h1>
          <p>Who changed what: reassignments, team changes, settings, listings, deals and exports.</p>
        </div>
        <span className="audit-exports">
          <button className="btn btn-secondary" onClick={exportLeads}><Icon name="download" size={16} /> Export leads</button>
          <button className="btn btn-secondary" onClick={exportLog}><Icon name="download" size={16} /> Export log</button>
        </span>
      </header>

      <div className="chip-row" role="group" aria-label="Filter by type">
        {(['all', ...Object.keys(AUDIT_KIND_LABELS)] as KindFilter[]).map((option) => (
          <button key={option} className={`chip ${kind === option ? 'active' : ''}`} aria-pressed={kind === option} onClick={() => setKind(option)}>
            {option === 'all' ? 'All' : AUDIT_KIND_LABELS[option]}
            <b className={`count-badge ${kind === option ? 'mint' : 'neutral'}`}>{option === 'all' ? store.auditLog.length : store.auditLog.filter((entry) => entry.kind === option).length}</b>
          </button>
        ))}
      </div>

      <ol className="audit-list card" aria-label="Audit entries">
        {entries.map((entry) => {
          const person = who(entry.byId)
          return (
            <li key={entry.id}>
              <span className="audit-who">{person ? <Avatar initials={person.initials} color={person.color} size="sm" /> : null}<span><strong>{person ? shortName(person.name) : 'Automatic'}</strong><small>{entry.at}</small></span></span>
              <span className={`audit-kind ${entry.kind}`}>{AUDIT_KIND_LABELS[entry.kind]}</span>
              <p>{entry.text}</p>
            </li>
          )
        })}
        {entries.length === 0 && <li className="audit-empty">Nothing of this type yet.</li>}
      </ol>
    </section>
  )
}
