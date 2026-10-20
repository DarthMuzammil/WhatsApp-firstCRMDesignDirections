import { useState } from 'react'
import {
  META_MARKETING_RATE, bookingStatusWords, buyersForLaunch, configLabel, developerOfProject, findProject, launchDeveloper, launchName, launchProject,
  registrationStatus, registrationValidUntil, type Launch, type Registration, type RegistrationStatus,
} from '../data/channelPartner'
import type { Lead } from '../data/demo'
import { Icon } from '../components/Icon'
import type { Notify } from '../components/Toast'
import { inlineDayLabel, onDayLabel } from '../lib/format'
import { LaunchWizard } from '../modals/LaunchWizard'
import { RenewDialog } from '../modals/RegistrationDialogs'
import type { DemoStore } from '../state/useDemoStore'
import './LaunchesView.css'

type RegFilter = 'all' | 'expiring' | 'lapsed' | 'disputed' | 'booked'
const REG_FILTERS: { key: RegFilter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'expiring', label: 'Expiring' }, { key: 'lapsed', label: 'Lapsed' }, { key: 'disputed', label: 'Disputed' }, { key: 'booked', label: 'Booked' },
]
/** Soonest expiry first (lapsed ones have already expired, so they lead); disputed, then booked, last. */
function sortKey(registration: Registration, status: RegistrationStatus) {
  if (status.kind === 'disputed') return 10000
  if (status.kind === 'booked') return 20000
  return registrationValidUntil(registration)
}

export type LaunchesTab = 'launches' | 'registrations'

/**
 * New launches (spec §8.17): launch broadcasts to matching buyers (people with `runLaunches`), developer client
 * registrations, and (for Sales and Pre-sales) the status of their own new-launch bookings, without amounts.
 * Opens on Launches for people who send them, otherwise on Registrations.
 */
export function LaunchesView({ store, initialTab, onOpenLead, notify }: { store: DemoStore; initialTab?: LaunchesTab; onOpenLead: (lead: Lead) => void; notify: Notify }) {
  const [tab, setTab] = useState<LaunchesTab>(initialTab ?? (store.viewerCan('runLaunches') ? 'launches' : 'registrations'))
  const expiring = store.cp.registrations.filter((registration) => registrationStatus(registration).kind === 'expiring').length
  return (
    <section className="launches-view">
      <header className="page-head">
        <div><span className="eyebrow">Channel partner</span><h1>New launches</h1><p>Developer projects you sell, and the buyers you’ve registered with them.</p></div>
      </header>
      <div className="segmented launches-tabs" role="tablist" aria-label="New launches">
        <button role="tab" aria-selected={tab === 'launches'} className={tab === 'launches' ? 'active' : ''} onClick={() => setTab('launches')}>Launches</button>
        <button role="tab" aria-selected={tab === 'registrations'} className={tab === 'registrations' ? 'active' : ''} onClick={() => setTab('registrations')}>Registrations{expiring > 0 ? ` · ${expiring}` : ''}</button>
      </div>
      {tab === 'launches' ? <LaunchesTabPanel store={store} onOpenLead={onOpenLead} notify={notify} /> : <>
        <RegistrationsTab store={store} onOpenLead={onOpenLead} notify={notify} />
        {!store.viewerCan('viewReceivables') && <MyBookings store={store} />}
      </>}
    </section>
  )
}

const ALL_FILTERS = { locality: true, bhk: true, budget: true }

function LaunchesTabPanel({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: Notify }) {
  const canRun = store.viewerCan('runLaunches')
  const [wizard, setWizard] = useState<{ draft?: Launch } | null>(null)
  const registeredWith = () => undefined
  return (
    <>
      {canRun && <div className="launches-actions"><button className="btn btn-primary" onClick={() => setWizard({})}><Icon name="plus" size={16} /> New launch</button></div>}
      <div className="launch-cards">
        {store.cp.launches.map((launch) => {
          const project = launchProject(launch)
          const developer = launchDeveloper(launch)
          const matchCount = buyersForLaunch(store.leads, launch, ALL_FILTERS, registeredWith).length
          const recipients = launch.recipients ?? []
          const stats = launch.history ?? {
            sent: recipients.length,
            delivered: recipients.filter((item) => item.state === 'delivered' || item.state === 'read').length,
            read: recipients.filter((item) => item.state === 'read').length,
            replied: recipients.filter((item) => item.reply).length,
          }
          const repliedLeads = recipients.filter((item) => item.reply).map((item) => store.findLead(item.leadId)).filter((lead): lead is Lead => !!lead)
          const failed = recipients.filter((item) => item.state === 'failed').map((item) => store.findLead(item.leadId)?.name).filter(Boolean)
          return (
            <article key={launch.id} className={`card launch-card status-${launch.status}`}>
              <header>
                <div><h2>{launchName(launch)}</h2><p>{developer?.name} · {project?.area}</p></div>
                <span className={`launch-status ${launch.status}`}>{launch.status === 'draft' ? 'Draft' : 'Sent'}</span>
              </header>
              <ul className="launch-configs-list">{launch.configs.map((config) => <li key={config.bhk}>{configLabel(config)}</li>)}</ul>
              <p className="launch-meta">{launch.launchDay < 0 ? 'Launched' : 'Launches'} {onDayLabel(launch.launchDay)} · EOI ₹{launch.eoiL} L · Possession {launch.possession} · RERA {launch.rera}</p>
              {launch.status === 'sent' ? <>
                <p className="launch-stats"><span>Sent <b>{stats.sent}</b></span><span>Delivered <b>{stats.delivered}</b></span><span>Read <b>{stats.read}</b></span><span>Replied <b>{stats.replied}</b></span></p>
                <p className="launch-cost-line">{onDayLabel(launch.sentDay ?? 0) === 'today' ? 'Sent today' : `Sent ${Math.abs(launch.sentDay ?? 0)} days ago`} · {launch.history ? `₹${(stats.delivered * META_MARKETING_RATE).toFixed(2)}` : `₹${(stats.delivered * META_MARKETING_RATE).toFixed(2)} · ${stats.delivered} delivered`}</p>
                {failed.length > 0 && <p className="launch-failed"><Icon name="alert" size={14} /> {failed.join(', ')}: not delivered · not on WhatsApp</p>}
                {repliedLeads.length > 0 && <p className="launch-replies">Replies: {repliedLeads.map((lead) => <button key={lead.id} onClick={() => onOpenLead(lead)}>{lead.name}</button>)}</p>}
              </> : canRun
                ? <footer><span className="launch-match">{matchCount} {matchCount === 1 ? 'buyer matches' : 'buyers match'}</span><button className="btn btn-primary" onClick={() => setWizard({ draft: launch })}>Review and send</button></footer>
                : <footer><span className="launch-match">{matchCount} of your buyers {matchCount === 1 ? 'matches' : 'match'}</span></footer>}
            </article>
          )
        })}
      </div>
      {wizard && <LaunchWizard store={store} draft={wizard.draft} onClose={() => setWizard(null)} onSent={(message) => { setWizard(null); notify(message) }} />}
    </>
  )
}

function RegistrationsTab({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: Notify }) {
  const [filter, setFilter] = useState<RegFilter>('all')
  const [renewing, setRenewing] = useState<Registration | null>(null)
  const rows = store.cp.registrations.map((registration) => ({ registration, status: registrationStatus(registration) }))
  const count = (key: RegFilter) => rows.filter((row) => key === 'all' || row.status.kind === key).length
  const shown = rows.filter((row) => filter === 'all' || row.status.kind === filter).sort((a, b) => sortKey(a.registration, a.status) - sortKey(b.registration, b.status))
  return (
    <section className="card registrations">
      <header className="card-head">
        <div><h2>Developer registrations</h2><p>Protects your brokerage until it lapses. Renew before the developer’s window closes.</p></div>
      </header>
      <div className="chip-row registration-filters" role="group" aria-label="Filter registrations">
        {REG_FILTERS.map((item) => <button key={item.key} className={`chip ${filter === item.key ? 'active' : ''}`} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label} <b>{count(item.key)}</b></button>)}
      </div>
      {shown.map(({ registration, status }) => {
        const lead = store.findLead(registration.leadId)
        const developer = developerOfProject(registration.projectId)
        const left = registrationValidUntil(registration)
        const ownerNow = lead?.ownerId && lead.ownerId !== registration.byId ? ` · lead now with ${store.cp.nameOf(lead.ownerId)}` : ''
        return (
          <article key={registration.id} className={`registration-row status-${status.kind}`}>
            <button className="registration-lead" onClick={() => lead && onOpenLead(lead)}>
              <strong>{lead?.name}</strong>
              <small>{findProject(registration.projectId)?.name} · {developer?.name}</small>
            </button>
            <span className="registration-who">Registered by {store.cp.nameOf(registration.byId)}{ownerNow}</span>
            <span className={`registration-status ${status.kind}`}>{status.label}</span>
            <span className="registration-left">{status.kind === 'registered' || status.kind === 'expiring' ? `Until ${inlineDayLabel(left)}` : status.kind === 'disputed' ? status.reason : status.kind === 'lapsed' ? `Lapsed on ${inlineDayLabel(left)}` : 'Booked'}</span>
            <span className="registration-action">{status.kind !== 'booked' && status.kind !== 'disputed' && <button className="btn btn-secondary" onClick={() => setRenewing(registration)}>Renew</button>}</span>
          </article>
        )
      })}
      {shown.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="shield" /></span><h3>No registrations here</h3><p>Register a buyer from their lead: Overview → Developer registrations.</p></div>}
      {renewing && <RenewDialog registration={renewing} store={store} onClose={() => setRenewing(null)} onSaved={(message) => { setRenewing(null); notify(message) }} />}
    </section>
  )
}

/** Sales and Pre-sales: their own new-launch bookings, as status words only (never brokerage %, amounts or tax). */
function MyBookings({ store }: { store: DemoStore }) {
  const mine = store.cp.bookings
  if (mine.length === 0) return null
  return (
    <section className="card my-bookings">
      <header className="card-head"><div><h2>My bookings</h2><p>Units you sold at new launches, and where the developer’s payment is.</p></div></header>
      {mine.map((booking) => (
        <article key={booking.id}>
          <span><strong>{booking.buyer}</strong><small>{findProject(booking.projectId)?.name} {booking.unit} · booked {onDayLabel(booking.bookedDay)}</small></span>
          <p>{bookingStatusWords(booking)}</p>
        </article>
      ))}
    </section>
  )
}
