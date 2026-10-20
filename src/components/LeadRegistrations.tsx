import { useState } from 'react'
import { developerOfProject, findProject, maskPan, registrationStatus, registrationValidUntil, type Registration } from '../data/channelPartner'
import type { Lead } from '../data/demo'
import { dayLabel, inlineDayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import { Icon } from './Icon'
import './LeadRegistrations.css'

export type RegistrationAction = { kind: 'register' } | { kind: 'renew' | 'dispute' | 'resolve'; id: number }

/** PAN, masked; people who may see full numbers can reveal it. */
function Pan({ pan, canReveal }: { pan: string; canReveal: boolean }) {
  const [shown, setShown] = useState(false)
  return <span className="registration-pan">PAN {shown ? pan : maskPan(pan)}{canReveal && <button onClick={() => setShown(!shown)}>{shown ? 'Hide' : 'Show'}</button>}</span>
}

/** "Developer registrations · N" in the lead panel (spec §8.17.2): status, countdown, who registered, actions. */
export function LeadRegistrations({ lead, store, onAction }: { lead: Lead; store: DemoStore; onAction: (action: RegistrationAction) => void }) {
  const list = store.cp.registrationsFor(lead.id)
  const canResolve = store.viewerCan('reassignLeads')
  return (
    <section className="lead-registrations" aria-label="Developer registrations">
      <header><span className="eyebrow">Developer registrations · {list.length}</span></header>
      {list.map((registration) => <RegistrationEntry key={registration.id} registration={registration} lead={lead} store={store} canResolve={canResolve} onAction={onAction} />)}
      <button className="btn btn-secondary btn-block" onClick={() => onAction({ kind: 'register' })}><Icon name="shield" size={16} /> Register with a developer</button>
    </section>
  )
}

function RegistrationEntry({ registration, lead, store, canResolve, onAction }: { registration: Registration; lead: Lead; store: DemoStore; canResolve: boolean; onAction: (action: RegistrationAction) => void }) {
  const developer = developerOfProject(registration.projectId)
  const status = registrationStatus(registration)
  const until = registrationValidUntil(registration)
  const window = developer?.registrationDays ?? 30
  const left = status.kind === 'registered' || status.kind === 'expiring' ? status.daysLeft : 0
  const byOther = registration.byId !== lead.ownerId && lead.ownerId
  return (
    <article className={`registration-entry status-${status.kind}`}>
      <div className="registration-top">
        <strong>{findProject(registration.projectId)?.name} · {developer?.name}</strong>
        <span className={`registration-status ${status.kind}`}>{status.kind === 'expiring' || status.kind === 'registered' ? status.label.split(' · ')[0] : status.label}</span>
      </div>
      {(status.kind === 'registered' || status.kind === 'expiring') && <>
        <p className="registration-when">Valid until {inlineDayLabel(until)} · {left === 0 ? 'last day' : `${left} ${left === 1 ? 'day' : 'days'} left`}</p>
        <span className="registration-meter" aria-hidden="true"><i style={{ width: `${Math.max(4, (left / window) * 100)}%` }} /></span>
      </>}
      {status.kind === 'disputed' && <p className="registration-when">{status.reason}</p>}
      <p className="registration-by">
        Registered by {store.cp.nameOf(registration.byId)}{byOther ? ` · lead now with ${store.cp.nameOf(lead.ownerId)}` : ''}
        {registration.recordedAt ? <small>{registration.recordedAt}</small> : <small>{dayLabel(registration.day)} · {registration.method}{registration.developerRef ? ` · ${registration.developerRef}` : ''}</small>}
        {registration.pan && <Pan pan={registration.pan} canReveal={store.viewerCan('seeFullNumbers')} />}
        {registration.proof && <small className="registration-proof-chip"><Icon name="check" size={12} /> registration-proof.png · demo</small>}
      </p>
      {status.kind !== 'booked' && (
        <footer>
          <button className="btn btn-secondary" onClick={() => onAction({ kind: 'renew', id: registration.id })}>Renew</button>
          {status.kind === 'disputed'
            ? canResolve && <button className="btn btn-secondary" onClick={() => onAction({ kind: 'resolve', id: registration.id })}>Resolve</button>
            : <button className="btn btn-ghost" onClick={() => onAction({ kind: 'dispute', id: registration.id })}>Mark disputed</button>}
        </footer>
      )}
    </article>
  )
}
