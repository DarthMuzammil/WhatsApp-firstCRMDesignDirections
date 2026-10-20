import { useState, type FormEvent } from 'react'
import {
  PAN_PATTERN, PROJECTS, REGISTRATION_DISPUTE_REASONS, REGISTRATION_METHODS, developerOfProject, findProject, registrationValidUntil,
  type Registration, type RegistrationMethod,
} from '../data/channelPartner'
import type { Lead } from '../data/demo'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { dayLabel, inlineDayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './RegistrationDialogs.css'

/** Today back to 30 days ago. */
const PAST_DAYS = Array.from({ length: 31 }, (_, index) => -index)

/** Proof of registration (🎭): a placeholder attachment, since the demo has no uploads. */
function ProofButton({ attached, onAttach }: { attached: boolean; onAttach: () => void }) {
  return attached
    ? <p className="registration-proof"><Icon name="check" size={14} /> registration-proof.png · demo</p>
    : <button type="button" className="btn btn-secondary registration-proof-add" onClick={onAttach}><Icon name="plus" size={16} /> Add screenshot</button>
}

/**
 * Register a buyer with a developer (spec §8.17.2). Bayana records the registration and its proof and reminds
 * people before it lapses; it doesn't submit anything to the developer. Warns when the firm already holds an
 * active registration with the same developer for the same phone number, even on a lead the viewer can't see.
 */
export function RegisterDialog({ lead, store, onClose, onSaved }: { lead: Lead; store: DemoStore; onClose: () => void; onSaved: (message: string) => void }) {
  const [projectId, setProjectId] = useState(PROJECTS.find((project) => project.locality === lead.locality)?.id ?? PROJECTS[0].id)
  const [pan, setPan] = useState('')
  const [method, setMethod] = useState<RegistrationMethod>(REGISTRATION_METHODS[0])
  const [day, setDay] = useState(0)
  const [developerRef, setDeveloperRef] = useState('')
  const [proof, setProof] = useState(false)
  const developer = developerOfProject(projectId)
  const conflict = store.cp.registrationConflict(lead.id, projectId)
  const panError = pan.trim() && !PAN_PATTERN.test(pan.trim()) ? 'PAN should look like ABCDE1234F' : ''

  function submit(event: FormEvent) {
    event.preventDefault()
    if (panError) return
    store.cp.register(lead.id, { projectId, day, method, pan: pan.trim() || undefined, developerRef: developerRef.trim() || undefined, proof })
    onSaved(`${lead.name} registered with ${developer?.name} · ${developer?.registrationDays} days`)
  }

  return (
    <Dialog label={`Register ${lead.name} with a developer`} variant="sheet" onClose={onClose} className="add-lead registration-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Developer registration</span>
      <h2>Register {lead.name.split(' ')[0]}</h2>
      <form onSubmit={submit} className="dialog-scroll">
        <label>Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            {PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.name} · {developerOfProject(project.id)?.name}</option>)}
          </select>
        </label>
        <div className="form-row">
          <label>Buyer<input value={lead.name} readOnly /></label>
          <label>Mobile<input value={store.displayPhone(lead.phone)} readOnly /></label>
        </div>
        <label><span>PAN <small className="registration-hint">optional · some developers ask for it</small></span>
          <input value={pan} onChange={(event) => setPan(event.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} aria-invalid={!!panError} />
          {panError && <span className="form-error">{panError}</span>}
        </label>
        <div className="form-row">
          <label>How you registered
            <select value={method} onChange={(event) => setMethod(event.target.value as RegistrationMethod)}>{REGISTRATION_METHODS.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label>Registered on
            <select value={day} onChange={(event) => setDay(Number(event.target.value))}>{PAST_DAYS.map((offset) => <option key={offset} value={offset}>{dayLabel(offset)}</option>)}</select>
          </label>
        </div>
        <label><span>Developer’s reference <small className="registration-hint">optional</small></span><input value={developerRef} onChange={(event) => setDeveloperRef(event.target.value)} placeholder="e.g. KD-CP-88213" /></label>
        <ProofButton attached={proof} onAttach={() => setProof(true)} />
        {conflict && (
          <div className="duplicate-alert" role="alert">
            <Icon name="alert" />
            <div>
              <strong>Already registered with {developer?.name} by {store.cp.nameOf(conflict.byId)} on {dayLabel(conflict.day)} · valid until {inlineDayLabel(registrationValidUntil(conflict))}.</strong>
              <small>The firm is already protected; registering again won’t extend it and may confuse the developer’s CP desk.</small>
            </div>
          </div>
        )}
        <p className="registration-note">Bayana keeps your proof and reminds you before it lapses. It doesn’t submit anything to the developer.</p>
        <button className={`btn btn-block add-lead-submit ${conflict ? 'btn-secondary' : 'btn-primary'}`} disabled={!!panError}>{conflict ? 'Register anyway' : 'Save registration'}</button>
      </form>
    </Dialog>
  )
}

/** Renew: a new registration date and proof restart the developer's window. */
export function RenewDialog({ registration, store, onClose, onSaved }: { registration: Registration; store: DemoStore; onClose: () => void; onSaved: (message: string) => void }) {
  const [day, setDay] = useState(0)
  const [proof, setProof] = useState(false)
  const developer = developerOfProject(registration.projectId)
  const lead = store.findLead(registration.leadId)
  function submit(event: FormEvent) {
    event.preventDefault()
    store.cp.renewRegistration(registration.id, day)
    onSaved(`Renewed · valid ${developer?.registrationDays} days from ${dayLabel(day).toLowerCase()}`)
  }
  return (
    <Dialog label={`Renew the registration for ${lead?.name ?? 'this buyer'}`} onClose={onClose} className="add-lead registration-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">{findProject(registration.projectId)?.name} · {developer?.name}</span>
      <h2>Renew registration</h2>
      <p className="add-lead-intro">{lead?.name}. Registered again with the developer? Record when, and the {developer?.registrationDays}-day window starts over.</p>
      <form onSubmit={submit}>
        <label>Registered again on
          <select value={day} onChange={(event) => setDay(Number(event.target.value))}>{PAST_DAYS.slice(0, 15).map((offset) => <option key={offset} value={offset}>{dayLabel(offset)}</option>)}</select>
        </label>
        <ProofButton attached={proof} onAttach={() => setProof(true)} />
        <button className="btn btn-primary btn-block add-lead-submit">Renew</button>
      </form>
    </Dialog>
  )
}

/** Mark disputed (anyone who can see the lead) or resolve a dispute (Owner, Manager). */
export function RegistrationDisputeDialog({ registration, store, mode, onClose, onSaved }: { registration: Registration; store: DemoStore; mode: 'dispute' | 'resolve'; onClose: () => void; onSaved: (message: string) => void }) {
  const [reason, setReason] = useState(REGISTRATION_DISPUTE_REASONS[0])
  const developer = developerOfProject(registration.projectId)
  return (
    <Dialog label={mode === 'dispute' ? 'Mark the registration disputed' : 'Resolve the dispute'} onClose={onClose} className="add-lead registration-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">{findProject(registration.projectId)?.name} · {developer?.name}</span>
      <h2>{mode === 'dispute' ? 'Mark disputed' : 'Resolve the dispute'}</h2>
      {mode === 'dispute' ? (
        <form onSubmit={(event) => { event.preventDefault(); store.cp.disputeRegistration(registration.id, reason); onSaved('Registration marked disputed') }}>
          <label>What happened<select value={reason} onChange={(event) => setReason(event.target.value)}>{REGISTRATION_DISPUTE_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="btn btn-primary btn-block add-lead-submit">Mark disputed</button>
        </form>
      ) : (
        <div className="registration-resolve">
          <p className="add-lead-intro">{registration.disputed?.reason}. What did {developer?.name} decide?</p>
          <button className="btn btn-primary btn-block" onClick={() => { store.cp.resolveRegistration(registration.id, 'accepted'); onSaved('Resolved: the developer accepted our registration') }}>Developer accepted ours</button>
          <button className="btn btn-secondary btn-block" onClick={() => { store.cp.resolveRegistration(registration.id, 'lost'); onSaved('Resolved: lost to another CP') }}>Lost to another CP</button>
        </div>
      )}
    </Dialog>
  )
}
