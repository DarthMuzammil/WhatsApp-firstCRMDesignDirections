import { useState } from 'react'
import { RESPONSE_SLA_MINUTES, relativeMinutes, type Lead } from '../data/demo'
import { shortName } from '../data/team'
import { LeadAvatar } from '../components/Avatar'
import { HeatBadge } from '../components/HeatBadge'
import { Icon } from '../components/Icon'
import { AssignDialog } from '../modals/AssignDialog'
import type { DemoStore } from '../state/useDemoStore'
import './EscalationsView.css'

/** Manager/Owner queue (spec §8.2): replies past the response SLA, and leads nobody owns yet. */
export function EscalationsView({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: (message: string) => void }) {
  const [assigning, setAssigning] = useState<Lead | null>(null)
  const unassigned = store.leads.filter((lead) => lead.ownerId === null)
  const overdue = store.leads.filter((lead) => lead.overdue && lead.ownerId !== null)

  const row = (lead: Lead, kind: 'overdue' | 'unassigned') => {
    const owner = store.findMember(lead.ownerId)
    return (
      <article key={lead.id} className="escalation">
        <button className="escalation-lead" onClick={() => onOpenLead(lead)}>
          <LeadAvatar lead={lead} size="sm" />
          <span><strong>{lead.name}</strong><small>{lead.need} · {lead.budget} · via {lead.source}</small></span>
        </button>
        <div className="escalation-meta">
          <HeatBadge temp={lead.temp} />
          {kind === 'overdue'
            ? <span className="lead-flag danger">Waiting {relativeMinutes(lead.minutesAgo)}</span>
            : <span className="lead-flag warning">Arrived {relativeMinutes(lead.minutesAgo)} ago</span>}
          {owner && <span className="escalation-owner">{shortName(owner.name)}</span>}
        </div>
        <button className={`btn ${kind === 'unassigned' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAssigning(lead)}>
          <Icon name="swap" size={16} /> {kind === 'unassigned' ? 'Assign' : 'Reassign'}
        </button>
      </article>
    )
  }

  return (
    <section className="escalations-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Manage · Lead response</span>
          <h1>Escalations</h1>
          <p>Buyers waiting more than {RESPONSE_SLA_MINUTES} minutes for a reply, and new leads nobody owns yet.</p>
        </div>
      </header>

      <div className="stat-strip">
        <div><span>Overdue replies</span><strong>{overdue.length}</strong><small>Over {RESPONSE_SLA_MINUTES} min without a reply</small></div>
        <div><span>Unassigned</span><strong>{unassigned.length}</strong><small>Waiting for an owner</small></div>
        <div><span>Response target</span><strong>{RESPONSE_SLA_MINUTES} min</strong><small>Company setting</small></div>
      </div>

      <div className="escalation-groups">
        <section className="card">
          <header className="card-head"><div><h2>Unassigned leads</h2><p>Assign an owner so the buyer hears back quickly.</p></div></header>
          {unassigned.map((lead) => row(lead, 'unassigned'))}
          {unassigned.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>Every lead has an owner</h3></div>}
        </section>
        <section className="card">
          <header className="card-head"><div><h2>Overdue replies</h2><p>Nudge the owner, or move the lead to someone available.</p></div></header>
          {overdue.map((lead) => row(lead, 'overdue'))}
          {overdue.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>No one is waiting</h3><p>Every buyer has had a reply within {RESPONSE_SLA_MINUTES} minutes.</p></div>}
        </section>
      </div>

      {assigning && (
        <AssignDialog
          title={assigning.ownerId ? `Reassign ${assigning.name}` : `Assign ${assigning.name}`}
          description={`${assigning.need} · ${assigning.budget}. The new owner gets the conversation and is notified.`}
          candidates={store.assignableMembers.filter((person) => person.id !== assigning.ownerId)}
          openLeadCount={store.openLeadCount}
          reasons={assigning.ownerId ? ['Overdue reply', 'Workload balance', 'Leave cover', 'Other'] : ['New lead', 'Locality expertise', 'Workload balance']}
          confirmLabel={assigning.ownerId ? 'Reassign lead' : 'Assign lead'}
          onConfirm={(memberId, reason) => {
            store.reassignLead(assigning.id, memberId, reason)
            notify(`${assigning.name} assigned to ${store.findMember(memberId)?.name}`)
            setAssigning(null)
          }}
          onClose={() => setAssigning(null)}
        />
      )}
    </section>
  )
}
