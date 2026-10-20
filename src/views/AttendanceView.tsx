import { useState, type FormEvent } from 'react'
import { ATTENDANCE_LABEL, pastWorkingDays, tracksAttendance, type AttendanceCode } from '../data/attendance'
import { TEAMS, shortName, type Member } from '../data/team'
import { Avatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { LocationControl } from '../components/LocationControl'
import { dayLabel, todayLabel } from '../lib/format'
import { deviceReading, pretendReading, type Reading } from '../lib/location'
import type { DemoStore } from '../state/useDemoStore'
import './AttendanceView.css'

type Tab = 'mine' | 'register' | 'requests'
const REGISTER_DAYS = pastWorkingDays(10)

/**
 * Attendance (spec §8.7). Everyone except the Owner checks in at their office (refused beyond the
 * radius) or starts a field day. Managers see the register for their team and approve corrections.
 */
export function AttendanceView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const tracked = tracksAttendance(store.viewer)
  const manages = store.viewerCan('manageTeam')
  const [tab, setTab] = useState<Tab>(tracked ? 'mine' : 'register')
  const pending = store.corrections.filter((request) => request.status === 'pending' && inScope(store, request.memberId))
  const tabs: { id: Tab; label: string }[] = [
    ...(tracked ? [{ id: 'mine' as const, label: 'My day' }] : []),
    ...(manages ? [{ id: 'register' as const, label: 'Register' }, { id: 'requests' as const, label: pending.length ? `Requests · ${pending.length}` : 'Requests' }] : []),
  ]

  return (
    <section className="attendance-view">
      <header className="page-head">
        <div><span className="eyebrow">{todayLabel()}</span><h1>Attendance</h1><p>Office check-ins are verified by location; field days count once you check in at a client.</p></div>
      </header>
      {tabs.length > 1 && (
        <div className="segmented attendance-tabs" role="tablist" aria-label="Attendance">
          {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}
        </div>
      )}
      {tab === 'mine' && tracked && <MyDay store={store} notify={notify} />}
      {tab === 'register' && manages && <Register store={store} />}
      {tab === 'requests' && manages && <Requests store={store} notify={notify} />}
    </section>
  )
}

/** People whose attendance the viewer manages: their team, or everyone for the Owner. */
function inScope(store: DemoStore, memberId: string): boolean {
  const person = store.findMember(memberId)
  if (!person || !tracksAttendance(person)) return false
  return store.viewerCan('seeAllLeads') || (!!store.viewer.teamId && person.teamId === store.viewer.teamId)
}

function CodeChip({ code, corrected = false }: { code: AttendanceCode; corrected?: boolean }) {
  return <span className={`att-code att-${code}`} title={ATTENDANCE_LABEL[code].long + (corrected ? ' (corrected)' : '')}>{ATTENDANCE_LABEL[code].short}{corrected ? '*' : ''}</span>
}

function MyDay({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [correcting, setCorrecting] = useState<number | null>(null)
  const today = store.todayFor(store.viewer.id)
  const office = store.officeFor(store.viewer)
  const fieldCheckIn = store.visits.find((visit) => visit.day === 0 && visit.agentId === store.viewer.id && visit.steps.some((step) => step.kind === 'check-in'))
  const myRequests = store.corrections.filter((request) => request.memberId === store.viewer.id)

  async function read(): Promise<Reading> {
    return store.pretendLocation === 'device' ? deviceReading() : pretendReading(store.pretendLocation === 'far' ? 'far' : 'office', office, office)
  }
  async function act(action: 'in' | 'out') {
    setBusy(true)
    setMessage(null)
    try {
      const result = action === 'in' ? store.officeCheckIn(await read()) : store.checkOutForDay(await read())
      setMessage({ ok: result.ok, text: result.message })
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Couldn’t read your location.' })
    } finally {
      setBusy(false)
    }
  }

  const status = (() => {
    if (today.status === 'leave') return { title: 'On leave today', detail: 'Enjoy your day off. Your leads are with your cover.' }
    if (today.status === 'not-in') return { title: 'Not checked in yet', detail: `Work starts ${store.settings.workStart} (${store.settings.graceMin} min grace).` }
    if (today.status === 'out') return { title: `Checked out at ${today.outAt}`, detail: `${today.mode === 'field' ? 'Field day' : 'In office'} from ${today.inAt}${today.late ? ' · marked late' : ''}.` }
    if (today.mode === 'field') return fieldCheckIn
      ? { title: 'Field day · present', detail: `Verified at ${fieldCheckIn.propertyName}, ${fieldCheckIn.steps.find((step) => step.kind === 'check-in')?.at}.` }
      : { title: `Field day since ${today.inAt}`, detail: 'You count as present once you check in at a client (Visits).' }
    return { title: `In office since ${today.inAt}`, detail: `${office.name}${today.late ? ' · marked late' : ' · on time'}.` }
  })()

  return <>
    <LocationControl value={store.pretendLocation === 'client' ? 'office' : store.pretendLocation} onChange={store.setPretendLocation} options={['office', 'far', 'device']} radiusM={store.settings.checkInRadiusM} />
    <div className="attendance-grid">
      <section className="card my-day">
        <span className={`my-day-badge status-${today.status}`}><Icon name={today.status === 'not-in' ? 'clock' : today.status === 'leave' ? 'calendar' : 'check'} size={20} /></span>
        <h2>{status.title}</h2>
        <p>{status.detail}</p>
        {(today.refused ?? 0) > 0 && today.status === 'not-in' && <p className="my-day-refused"><Icon name="alert" size={14} /> {today.refused} office check-in {today.refused === 1 ? 'attempt was' : 'attempts were'} refused today.</p>}
        {message && <p className={`inline-feedback ${message.ok ? 'ok' : 'error'}`} role={message.ok ? 'status' : 'alert'}><Icon name={message.ok ? 'check' : 'alert'} size={16} />{message.text}</p>}
        <div className="my-day-actions">
          {today.status === 'not-in' && <>
            <button className="btn btn-primary" disabled={busy} onClick={() => act('in')}><Icon name="pin" size={16} /> {busy ? 'Reading location…' : 'Check in at office'}</button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => { store.startFieldDay(); setMessage({ ok: true, text: 'Field day started. Check in at your first client to count as present.' }) }}><Icon name="arrow" size={16} /> Start field day</button>
          </>}
          {(today.status === 'office' || today.status === 'field') && <button className="btn btn-secondary" disabled={busy} onClick={() => act('out')}><Icon name="check" size={16} /> {busy ? 'Reading location…' : 'Check out for the day'}</button>}
        </div>
      </section>
      <section className="card my-office">
        <header className="card-head"><div><h2>Your office</h2><p>{office.name} · {office.address}</p></div></header>
        <ul>
          <li><span>Work starts</span><strong>{store.settings.workStart}</strong></li>
          <li><span>Grace period</span><strong>{store.settings.graceMin} min</strong></li>
          <li><span>Check-in radius</span><strong>{store.settings.checkInRadiusM} m</strong></li>
        </ul>
      </section>
    </div>

    <section className="card my-history">
      <header className="card-head"><div><h2>Last 10 working days</h2><p>Missed a check-in? Ask your manager to correct it.</p></div></header>
      <ol>
        {REGISTER_DAYS.slice().reverse().map((day) => {
          const code = store.attendanceCode(store.viewer.id, day)
          const request = myRequests.find((item) => item.day === day)
          return (
            <li key={day}>
              <span>{dayLabel(day)}</span>
              <CodeChip code={code} corrected={request?.status === 'approved'} />
              <span className="my-history-label">{ATTENDANCE_LABEL[code].long}</span>
              {request
                ? <span className={`request-status status-${request.status}`}>Correction {request.status}</span>
                : (code === 'absent' || code === 'late') && <button className="btn btn-soft" onClick={() => setCorrecting(day)}>Request correction</button>}
            </li>
          )
        })}
      </ol>
    </section>
    {correcting !== null && (
      <CorrectionDialog
        day={correcting}
        onClose={() => setCorrecting(null)}
        onSubmit={(reason) => { store.requestCorrection(correcting, reason); setCorrecting(null); notify('Correction request sent to your manager') }}
      />
    )}
  </>
}

function CorrectionDialog({ day, onClose, onSubmit }: { day: number; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (reason.trim()) onSubmit(reason.trim())
  }
  return (
    <Dialog label="Request a correction" onClose={onClose} className="add-lead">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Attendance correction</span>
      <h2>{dayLabel(day)}</h2>
      <p className="add-lead-intro">Your manager sees this with your reason and can approve or reject it.</p>
      <form onSubmit={submit}>
        <label>What happened?<input required autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. At a site visit all morning; forgot to check in" /></label>
        <button className="btn btn-primary btn-block add-lead-submit" disabled={!reason.trim()}>Send request <Icon name="arrow" /></button>
      </form>
    </Dialog>
  )
}

function Register({ store }: { store: DemoStore }) {
  const people = store.members.filter((person) => inScope(store, person.id))
  const days = [...REGISTER_DAYS, 0]
  const todayCodes = people.map((person) => store.attendanceCode(person.id, 0))
  const count = (code: AttendanceCode) => todayCodes.filter((item) => item === code).length
  const teamName = (person: Member) => TEAMS.find((team) => team.id === person.teamId)?.name ?? 'Pre-sales'
  return <>
    <div className="att-summary">
      {(['present', 'late', 'field', 'pending', 'leave'] as AttendanceCode[]).map((code) => (
        <span key={code} className="att-summary-item"><CodeChip code={code} /><strong>{count(code)}</strong><small>{ATTENDANCE_LABEL[code].long}</small></span>
      ))}
    </div>
    <section className="card">
      <header className="card-head"><div><h2>Register</h2><p>Last 10 working days and today · {people.length} people</p></div></header>
      <div className="register-scroll">
        <table className="register">
          <thead><tr><th scope="col">Person</th>{days.map((day) => <th key={day} scope="col">{day === 0 ? 'Today' : dayLabel(day).replace(/^(\w+), (\d+).*/, '$1 $2')}</th>)}</tr></thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <th scope="row"><Avatar initials={person.initials} color={person.color} size="sm" /><span><strong>{shortName(person.name)}</strong><small>{teamName(person)}</small></span></th>
                {days.map((day) => {
                  const corrected = store.corrections.some((request) => request.memberId === person.id && request.day === day && request.status === 'approved')
                  return <td key={day}><CodeChip code={store.attendanceCode(person.id, day)} corrected={corrected} /></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="register-legend">{(Object.keys(ATTENDANCE_LABEL) as AttendanceCode[]).map((code) => <span key={code}><CodeChip code={code} /> {ATTENDANCE_LABEL[code].long}</span>)}<span>* corrected</span></p>
    </section>
  </>
}

function Requests({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const requests = store.corrections.filter((request) => inScope(store, request.memberId))
  return (
    <section className="card">
      <header className="card-head"><div><h2>Attendance corrections</h2><p>Approving marks the day Present.</p></div></header>
      {requests.map((request) => {
        const person = store.findMember(request.memberId)
        return (
          <article key={request.id} className="request-row">
            {person && <Avatar initials={person.initials} color={person.color} size="sm" />}
            <span className="request-copy"><strong>{person?.name} · {dayLabel(request.day)}</strong><small>“{request.reason}”</small></span>
            {request.status === 'pending'
              ? <span className="request-actions">
                  <button className="btn btn-secondary" onClick={() => { store.decideCorrection(request.id, false); notify('Correction rejected') }}>Reject</button>
                  <button className="btn btn-primary" onClick={() => { store.decideCorrection(request.id, true); notify(`${person?.name}’s ${dayLabel(request.day)} marked Present`) }}>Approve</button>
                </span>
              : <span className={`request-status status-${request.status}`}>{request.status === 'approved' ? 'Approved' : 'Rejected'}</span>}
          </article>
        )
      })}
      {requests.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>No requests</h3></div>}
    </section>
  )
}
