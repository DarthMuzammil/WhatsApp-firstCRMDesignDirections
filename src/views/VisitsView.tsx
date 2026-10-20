import { useState, type FormEvent } from 'react'
import type { Lead } from '../data/demo'
import { shortName } from '../data/team'
import { VISIT_RESULTS, formatDistance, type VisitResult, type VisitStep } from '../data/visits'
import { LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { LocationControl } from '../components/LocationControl'
import { todayLabel } from '../lib/format'
import { deviceReading, pretendReading } from '../lib/location'
import type { DemoStore, VisitView } from '../state/useDemoStore'
import './VisitsView.css'

const STATUS_LABEL = { planned: 'Planned', 'on-the-way': 'On the way', 'checked-in': 'Checked in', completed: 'Completed', 'no-show': 'No-show' } as const

type Feedback = { visitId: number; ok: boolean; message: string }

/**
 * Site visits with field check-ins (spec §8.6). Agents run their own visits from here:
 * Left office → Check in (refused beyond the radius) → Check out → outcome.
 * Managers and the Owner see the same list as a visit log for their scope.
 */
export function VisitsView({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: (message: string) => void }) {
  const [busy, setBusy] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [outcomeFor, setOutcomeFor] = useState<VisitView | null>(null)
  const seesOthers = store.viewerCan('seeTeamLeads')
  const today = store.visits.filter((visit) => visit.day === 0)
  const upcoming = store.visits.filter((visit) => visit.day > 0)
  const earlier = store.visits.filter((visit) => visit.day < 0)
  const todaySteps = today.flatMap((visit) => visit.steps)

  async function runStep(visit: VisitView, kind: 'left-office' | 'check-in' | 'check-out') {
    setBusy(visit.id)
    setFeedback(null)
    try {
      const property = store.findProperty(visit.propertyId)
      if (!property) throw new Error('Property not found.')
      const reading = store.pretendLocation === 'device'
        ? await deviceReading()
        : pretendReading(store.pretendLocation, property, store.officeFor(store.findMember(visit.agentId)))
      const result = store.recordVisitStep(visit.id, kind, reading)
      setFeedback({ visitId: visit.id, ...result })
      if (kind === 'check-out' && result.ok) setOutcomeFor(visit)
    } catch (error) {
      setFeedback({ visitId: visit.id, ok: false, message: error instanceof Error ? error.message : 'Couldn’t read your location.' })
    } finally {
      setBusy(null)
    }
  }

  const card = (visit: VisitView) => {
    const mine = visit.agentId === store.viewer.id
    const agent = store.findMember(visit.agentId)
    const canAct = mine && visit.day === 0 && (visit.status === 'planned' || visit.status === 'on-the-way' || visit.status === 'checked-in')
    const message = feedback?.visitId === visit.id ? feedback : null
    return (
      <article key={visit.id} className={`visit-card status-${visit.status}`}>
        <div className="visit-time"><strong>{visit.time}</strong><small>{visit.when.split(' · ')[0]}</small></div>
        <div className="visit-main">
          <button className="visit-lead" onClick={() => store.findLead(visit.leadId) && onOpenLead(visit.lead)}>
            <LeadAvatar lead={visit.lead} size="sm" />
            <span><strong>{visit.lead.name}</strong><small>{visit.propertyName} · {store.findProperty(visit.propertyId)?.locality}</small></span>
          </button>
          {(seesOthers || !mine) && agent && <span className="visit-agent"><Icon name="user" size={14} /> {mine ? 'You' : shortName(agent.name)}</span>}
          {visit.steps.length > 0 && <ol className="visit-steps">{visit.steps.map((step, index) => <StepRow key={index} step={step} />)}</ol>}
          {visit.outcome && <p className="visit-outcome"><strong>{visit.outcome.result}</strong>{visit.outcome.feedback ? ` · ${visit.outcome.feedback}` : ''}{visit.outcome.nextStep ? ` · Next: ${visit.outcome.nextStep}` : ''}</p>}
          {message && <p className={`inline-feedback ${message.ok ? 'ok' : 'error'}`} role={message.ok ? 'status' : 'alert'}><Icon name={message.ok ? 'check' : 'alert'} size={16} />{message.message}</p>}
        </div>
        <div className="visit-side">
          <span className={`visit-status status-${visit.status}`}>{STATUS_LABEL[visit.status]}</span>
          {canAct && visit.status === 'planned' && <>
            <button className="btn btn-secondary" disabled={busy === visit.id} onClick={() => runStep(visit, 'left-office')}><Icon name="arrow" size={16} /> Left office</button>
            <button className="btn btn-primary" disabled={busy === visit.id} onClick={() => runStep(visit, 'check-in')}><Icon name="pin" size={16} /> {busy === visit.id ? 'Reading location…' : 'Check in'}</button>
          </>}
          {canAct && visit.status === 'on-the-way' && <button className="btn btn-primary" disabled={busy === visit.id} onClick={() => runStep(visit, 'check-in')}><Icon name="pin" size={16} /> {busy === visit.id ? 'Reading location…' : 'Check in'}</button>}
          {canAct && visit.status === 'checked-in' && <button className="btn btn-primary" disabled={busy === visit.id} onClick={() => runStep(visit, 'check-out')}><Icon name="check" size={16} /> {busy === visit.id ? 'Reading location…' : 'Check out'}</button>}
          {mine && visit.day > 0 && <small className="visit-hint">Check-in opens on the day</small>}
        </div>
      </article>
    )
  }

  const section = (title: string, list: VisitView[], empty: string) => (
    <section className="card visit-section">
      <header className="card-head"><div><h2>{title}</h2><p>{list.length} {list.length === 1 ? 'visit' : 'visits'}</p></div></header>
      {list.map(card)}
      {list.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="calendar" /></span><h3>{empty}</h3></div>}
    </section>
  )

  return (
    <section className="visits-view">
      <header className="page-head">
        <div><span className="eyebrow">{todayLabel()}</span><h1>{seesOthers ? 'Team visits' : 'Your visits'}</h1><p>{seesOthers ? 'Who went where, and whether they really checked in.' : 'Tap when you leave the office and when you reach the client.'}</p></div>
      </header>

      <div className="stat-strip">
        <div><span>Visits today</span><strong>{today.length}</strong><small>{today.filter((visit) => visit.status === 'completed').length} completed</small></div>
        <div><span>Verified check-ins</span><strong>{todaySteps.filter((step) => step.kind === 'check-in').length}</strong><small>Within {store.settings.checkInRadiusM} m of the address</small></div>
        <div><span>Refused attempts</span><strong>{todaySteps.filter((step) => step.kind === 'check-in-refused').length}</strong><small>{earlier.filter((visit) => visit.status === 'no-show').length} no-show yesterday</small></div>
      </div>

      <LocationControl value={store.pretendLocation} onChange={store.setPretendLocation} options={['office', 'client', 'far', 'device']} radiusM={store.settings.checkInRadiusM} />

      <div className="visit-sections">
        {section('Today', today, 'No visits today')}
        {section('Upcoming', upcoming, 'Nothing booked yet')}
        {earlier.length > 0 && section('Earlier', earlier, '')}
      </div>

      {outcomeFor && (
        <OutcomeDialog
          visit={outcomeFor}
          onSave={(result, feedbackText, nextStep) => {
            store.completeVisit(outcomeFor.id, { result, feedback: feedbackText, nextStep })
            setOutcomeFor(null)
            setFeedback(null)
            notify('Visit completed and logged on the lead')
          }}
        />
      )}
    </section>
  )
}

function StepRow({ step }: { step: VisitStep }) {
  if (step.kind === 'left-office') return <li><Icon name="arrow" size={14} /> Left {step.note ? <em>{step.note}</em> : 'the office'} · {step.at}</li>
  if (step.kind === 'check-in') return <li className="verified"><Icon name="check" size={14} /> Verified check-in · {step.at} · {formatDistance(step.distanceM)} away</li>
  if (step.kind === 'check-in-refused') return <li className="refused"><Icon name="alert" size={14} /> Check-in refused · {step.at} · {step.note === 'Location too imprecise' ? `accuracy ${formatDistance(step.accuracyM)}` : `${formatDistance(step.distanceM)} away`}</li>
  return <li><Icon name="check" size={14} /> Checked out · {step.at}</li>
}

/** Required after check-out. Not dismissible, so every visit ends with an outcome. */
function OutcomeDialog({ visit, onSave }: { visit: VisitView; onSave: (result: VisitResult, feedback: string, nextStep: string) => void }) {
  const [result, setResult] = useState<VisitResult | null>(null)
  const [feedback, setFeedback] = useState('')
  const [nextStep, setNextStep] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (result) onSave(result, feedback.trim(), nextStep.trim())
  }
  return (
    <Dialog label="Visit outcome" onClose={() => undefined} dismissible={false} className="add-lead">
      <span className="eyebrow">Visit outcome · required</span>
      <h2>How did it go?</h2>
      <p className="add-lead-intro">{visit.lead.name} at {visit.propertyName}. This goes on the lead’s timeline.</p>
      <form onSubmit={submit}>
        <div className="outcome-options" role="radiogroup" aria-label="Result">
          {VISIT_RESULTS.map((option) => (
            <button type="button" key={option} role="radio" aria-checked={result === option} className={result === option ? 'selected' : ''} onClick={() => setResult(option)}>
              <span className="radio-dot" aria-hidden="true">{result === option && <Icon name="check" size={14} />}</span>{option}
            </button>
          ))}
        </div>
        <label>Buyer feedback<input value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="e.g. Liked the light, worried about parking" /></label>
        <label>Next step<input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="e.g. Share 2 similar homes in Domlur" /></label>
        <button className="btn btn-primary btn-block add-lead-submit" disabled={!result}>Save outcome <Icon name="check" /></button>
      </form>
    </Dialog>
  )
}
