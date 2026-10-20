import { useState } from 'react'
import {
  AGE_BANDS, BOOKING_FILTER_LABELS, DEVELOPERS, bookingSortKey, bookingStatus, brokerageL, developerOfProject, findProject,
  matchesBookingFilter, taxLines, type AgeBand, type Booking, type BookingFilter,
} from '../data/channelPartner'
import { BROKERAGE } from '../data/brand'
import { BarList } from '../components/BarList'
import { Icon } from '../components/Icon'
import type { Notify } from '../components/Toast'
import { downloadCsv, toCsv } from '../lib/csv'
import { formatLakh } from '../lib/format'
import { BookingActionDialog, BookingDetail, MilestoneTrack, type BookingAction } from '../modals/BookingDialogs'
import type { DemoStore } from '../state/useDemoStore'
import './BrokerageView.css'

const FILTERS = Object.keys(BOOKING_FILTER_LABELS) as BookingFilter[]
const sum = (list: Booking[]) => list.reduce((total, booking) => total + brokerageL(booking), 0)
const bookingsLabel = (count: number) => `${count} ${count === 1 ? 'booking' : 'bookings'}`

/**
 * Brokerage receivables (spec §8.17.1): what developers owe the firm for new-launch bookings, before GST and TDS.
 * Owner: every booking, can record invoices and payments. Manager: their team's bookings, can send reminders.
 */
export function BrokerageView({ store, initialFilter = 'all', initialOpenId, notify }: { store: DemoStore; initialFilter?: BookingFilter; initialOpenId?: number; notify: Notify }) {
  const cp = store.cp
  const canManage = store.viewerCan('manageReceivables')
  const [filter, setFilter] = useState<BookingFilter>(initialFilter)
  const [developerId, setDeveloperId] = useState('all')
  const [age, setAge] = useState<AgeBand | null>(null)
  const [asTable, setAsTable] = useState(false)
  const [showPaid, setShowPaid] = useState(false)
  const [openId, setOpenId] = useState<number | null>(initialOpenId ?? null)
  const [action, setAction] = useState<{ kind: BookingAction; id: number } | null>(null)

  const all = cp.bookings
  const open = all.filter((booking) => !booking.paid)
  const overdue = cp.overdue(all)
  const ready = all.filter((booking) => bookingStatus(booking).kind === 'ready')
  const received = all.filter((booking) => booking.paid && booking.paid.day >= -30)
  const ageOf = (booking: Booking) => -booking.bookedDay

  const byDeveloper = DEVELOPERS
    .map((developer) => ({ developer, list: open.filter((booking) => developerOfProject(booking.projectId)?.id === developer.id) }))
    .filter((row) => row.list.length > 0)
    .sort((a, b) => sum(b.list) - sum(a.list))
  const byAge = AGE_BANDS.map((band) => ({ band, list: open.filter((booking) => band.test(ageOf(booking))) }))

  const shown = all
    .filter((booking) => matchesBookingFilter(booking, filter))
    .filter((booking) => developerId === 'all' || developerOfProject(booking.projectId)?.id === developerId)
    .filter((booking) => !age || AGE_BANDS.find((band) => band.key === age)!.test(ageOf(booking)))
    .sort((a, b) => bookingSortKey(a) - bookingSortKey(b))
  // In "All", paid bookings fold away at the end.
  const unpaidShown = filter === 'all' ? shown.filter((booking) => !booking.paid) : shown
  const paidShown = filter === 'all' ? shown.filter((booking) => booking.paid) : []
  const openBooking = openId === null ? undefined : cp.findBooking(openId)
  const actionBooking = action ? cp.findBooking(action.id) : undefined

  function nextStep(booking: Booking): { label: string; kind: BookingAction } | null {
    const status = bookingStatus(booking)
    if (status.kind === 'waiting') return canManage ? { label: 'Mark margin paid', kind: 'margin' } : null
    if (status.kind === 'ready') return canManage ? { label: 'Raise invoice', kind: 'invoice' } : null
    if (status.kind === 'due' || status.kind === 'overdue') return { label: 'Send reminder', kind: 'reminder' }
    return null
  }

  function exportCsv() {
    const rows = shown.map((booking) => {
      const lines = taxLines(booking)
      return [booking.buyer, findProject(booking.projectId)?.name ?? '', booking.unit, developerOfProject(booking.projectId)?.name ?? '', store.findMember(booking.agentId)?.name ?? '',
        booking.agreementCr, `${developerOfProject(booking.projectId)?.brokeragePct}%`, lines.brokerage, lines.gst, lines.tds, lines.net, bookingStatus(booking).label, booking.invoice?.number ?? '']
    })
    downloadCsv('bayana-brokerage.csv', toCsv([['Buyer', 'Project', 'Unit', 'Developer', 'Agent', 'Agreement (₹ Cr)', 'Brokerage %', 'Brokerage ₹', 'GST ₹', 'TDS ₹', 'Net receivable ₹', 'Status', 'Invoice'], ...rows]))
    store.recordExport(`Exported brokerage bookings as CSV (${rows.length} rows)`)
    notify(`${rows.length} bookings exported`)
  }

  const renderRow = (booking: Booking) => {
    const project = findProject(booking.projectId)
    const developer = developerOfProject(booking.projectId)
    const status = bookingStatus(booking)
    const step = nextStep(booking)
    return (
      <article key={booking.id} className={`booking status-${status.kind}`}>
        <button className="booking-main" onClick={() => setOpenId(booking.id)} aria-label={`${booking.buyer} · ${project?.name} ${booking.unit}`}>
          <span className="booking-who"><strong>{booking.buyer}</strong><small>{project?.name} {booking.unit}</small></span>
          <span className="booking-project">{developer?.name}</span>
          <span className="booking-agent">{cp.agentName(booking)}</span>
          <span className="booking-agreement">₹{booking.agreementCr.toFixed(2)} Cr</span>
          <span className="booking-amount"><strong>₹{brokerageL(booking).toFixed(2)} L</strong><small>{developer?.brokeragePct}% of ₹{booking.agreementCr.toFixed(2)} Cr</small></span>
          <MilestoneTrack booking={booking} />
          <span className={`booking-status ${status.kind}`}>{status.label}</span>
        </button>
        <span className="booking-next">
          {step && <button className={`btn ${status.kind === 'overdue' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAction({ kind: step.kind, id: booking.id })}>{step.label}</button>}
        </span>
      </article>
    )
  }

  return (
    <section className="brokerage-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Manage · Channel partner</span>
          <h1>Brokerage</h1>
          <p>What developers owe {BROKERAGE.name} · brokerage before GST and TDS</p>
        </div>
        {store.viewerCan('exportData') && <button className="btn btn-secondary" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>}
      </header>

      <div className="stat-strip brokerage-strip">
        <button onClick={() => setFilter('all')}><span>Pending</span><strong>{formatLakh(cp.pending(all).lakh)}</strong><small>{bookingsLabel(open.length)}</small></button>
        <button className={overdue.length ? 'is-danger' : ''} onClick={() => setFilter('overdue')}><span>Overdue</span><strong>{formatLakh(sum(overdue))}</strong><small>{bookingsLabel(overdue.length)}</small></button>
        <button onClick={() => setFilter('ready')}><span>Ready to invoice</span><strong>{formatLakh(sum(ready))}</strong><small>{bookingsLabel(ready.length)}</small></button>
        <button onClick={() => { setFilter('paid'); setShowPaid(true) }}><span>Received · last 30 days</span><strong>{formatLakh(sum(received))}</strong><small>{bookingsLabel(received.length)}</small></button>
      </div>

      <div className="brokerage-charts">
        <section className="card">
          <header className="card-head">
            <div><h2>Pending by developer</h2><p>Tap a bar to filter</p></div>
            <div className="segmented" role="group" aria-label="Chart or table">
              <button className={!asTable ? 'active' : ''} aria-pressed={!asTable} onClick={() => setAsTable(false)}>Chart</button>
              <button className={asTable ? 'active' : ''} aria-pressed={asTable} onClick={() => setAsTable(true)}>Table</button>
            </div>
          </header>
          {asTable
            ? <table className="brokerage-mini-table"><thead><tr><th scope="col">Developer</th><th scope="col">Bookings</th><th scope="col">Pending</th></tr></thead><tbody>{byDeveloper.map((row) => <tr key={row.developer.id}><td>{row.developer.name}</td><td>{row.list.length}</td><td>{formatLakh(sum(row.list))}</td></tr>)}</tbody></table>
            : <BarList label="Pending brokerage by developer" rows={byDeveloper.map((row) => ({ key: row.developer.id, label: row.developer.name, sublabel: bookingsLabel(row.list.length), value: sum(row.list), display: formatLakh(sum(row.list)) }))} onSelect={(id) => { setDeveloperId(id); setFilter('all') }} />}
        </section>
        <section className="card">
          <header className="card-head"><div><h2>Age since booking</h2><p>Pending brokerage · tap a bar to filter</p></div></header>
          {asTable
            ? <table className="brokerage-mini-table"><thead><tr><th scope="col">Age</th><th scope="col">Bookings</th><th scope="col">Pending</th></tr></thead><tbody>{byAge.map((row) => <tr key={row.band.key}><td>{row.band.label}</td><td>{row.list.length}</td><td>{formatLakh(sum(row.list))}</td></tr>)}</tbody></table>
            : <BarList label="Pending brokerage by age since booking" rows={byAge.map((row) => ({ key: row.band.key, label: row.band.label, sublabel: bookingsLabel(row.list.length), value: sum(row.list), display: formatLakh(sum(row.list)) }))} onSelect={(key) => { setAge(key as AgeBand); setFilter('all') }} />}
        </section>
      </div>

      <section className="card brokerage-list">
        <header className="card-head brokerage-filters">
          <div className="chip-row" role="group" aria-label="Filter bookings">
            {FILTERS.map((key) => {
              const count = all.filter((booking) => matchesBookingFilter(booking, key)).length
              return <button key={key} className={`chip ${filter === key ? 'active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{BOOKING_FILTER_LABELS[key]}{key !== 'all' && <b>{count}</b>}</button>
            })}
          </div>
          <select className="source-filter" value={developerId} onChange={(event) => setDeveloperId(event.target.value)} aria-label="Developer">
            <option value="all">All developers</option>
            {DEVELOPERS.map((developer) => <option key={developer.id} value={developer.id}>{developer.name}</option>)}
          </select>
        </header>
        {age && <p className="brokerage-age-filter">Booked {AGE_BANDS.find((band) => band.key === age)?.label} ago <button className="icon-button" aria-label="Clear the age filter" onClick={() => setAge(null)}><Icon name="close" size={14} /></button></p>}
        <div className="booking-head" aria-hidden="true"><span>Buyer · unit</span><span>Developer</span><span>Agent</span><span>Agreement</span><span>Brokerage</span><span>Milestones</span><span>Status</span><span /></div>
        {unpaidShown.map(renderRow)}
        {paidShown.length > 0 && <>
          <button className="booking-paid-toggle" aria-expanded={showPaid} onClick={() => setShowPaid(!showPaid)}>Paid · {paidShown.length} <Icon name="chevron" size={14} /></button>
          {showPaid && paidShown.map(renderRow)}
        </>}
        {shown.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>Nothing here</h3><p>No bookings match these filters.</p></div>}
        <p className="brokerage-footnote">GST 18% and TDS 2% are demo settings. Confirm with your CA.</p>
      </section>

      {openBooking && <BookingDetail booking={openBooking} store={store} onClose={() => setOpenId(null)} onAction={(kind) => setAction({ kind, id: openBooking.id })} notify={notify} />}
      {action && actionBooking && <BookingActionDialog kind={action.kind} booking={actionBooking} store={store} onClose={() => setAction(null)} onDone={(message, tone) => { setAction(null); notify(message, tone) }} />}
    </section>
  )
}
