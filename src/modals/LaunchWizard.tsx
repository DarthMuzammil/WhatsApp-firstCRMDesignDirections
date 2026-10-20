import { useState } from 'react'
import {
  DEVELOPERS, META_MARKETING_RATE, PROJECTS, buyersForLaunch, configLabel, launchDeveloper, launchMessage, launchName, launchProject,
  registrationStatus, type Launch, type LaunchFilters, type Project, type ProjectConfig,
} from '../data/channelPartner'
import { firstName } from '../data/demo'
import { LOCALITIES } from '../data/inventory'
import { shortName } from '../data/team'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { dayLabel, onDayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './LaunchWizard.css'

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK']
const NEW_PROJECT = 'new'
const STEPS = ['Details', 'Audience', 'Preview'] as const

/**
 * New launch (spec §8.17.3, `runLaunches`): details with a required RERA number → audience matched live on
 * locality, BHK and budget → WhatsApp preview with Meta's cost → send (asks to confirm). Full screen on phones.
 */
export function LaunchWizard({ store, draft, onClose, onSent }: { store: DemoStore; draft?: Launch; onClose: () => void; onSent: (message: string) => void }) {
  const [step, setStep] = useState(0)
  const [projectId, setProjectId] = useState(draft?.project ? NEW_PROJECT : draft?.projectId ?? PROJECTS[0].id)
  const [custom, setCustom] = useState<Project>(draft?.project ?? { id: 'custom', name: '', developerId: DEVELOPERS[0].id, locality: LOCALITIES[0].name, area: LOCALITIES[0].name, configs: [], rera: '' })
  const [phase, setPhase] = useState(draft?.phase ?? '')
  const [configs, setConfigs] = useState<ProjectConfig[]>(draft?.configs ?? PROJECTS[0].configs)
  const [launchDay, setLaunchDay] = useState(draft?.launchDay ?? 7)
  const [eoi, setEoi] = useState(String(draft?.eoiL ?? 2))
  const [possession, setPossession] = useState(draft?.possession ?? '')
  const [rera, setRera] = useState(draft?.rera ?? '')
  const [filters, setFilters] = useState<LaunchFilters>({ locality: true, bhk: true, budget: true })
  const [unticked, setUnticked] = useState<number[]>([])
  const [confirming, setConfirming] = useState(false)

  const isNew = projectId === NEW_PROJECT
  const launch: Launch = {
    id: draft?.id ?? 0, projectId: isNew ? custom.id : projectId, project: isNew ? { ...custom, area: custom.locality, configs } : undefined,
    phase: phase.trim(), configs, launchDay, eoiL: Number(eoi) || 0, possession: possession.trim(), rera: rera.trim(), status: 'draft',
  }
  const developer = launchDeveloper(launch)
  const registeredWith = (leadId: number) => {
    const found = store.cp.registrationsFor(leadId).find((item) => launchDeveloper({ projectId: item.projectId })?.id === developer?.id && registrationStatus(item).kind !== 'lapsed')
    return found ? `Registered with ${developer?.name.split(' ').slice(0, 2).join(' ')}` : undefined
  }
  const matches = buyersForLaunch(store.leads, launch, filters, registeredWith)
  const chosen = matches.filter((match) => !unticked.includes(match.leadId))
  const firstBuyer = store.findLead(chosen[0]?.leadId ?? -1)
  const cost = (count: number) => `₹${(count * META_MARKETING_RATE).toFixed(2)}`
  const message = (leadId: number) => launchMessage(launch, firstName(store.findLead(leadId)?.name ?? 'there'), firstName(store.viewer.name), onDayLabel(launch.launchDay))

  const detailsError = !rera.trim() ? 'Add the RERA number. It must appear in every launch message.'
    : isNew && !custom.name.trim() ? 'Name the project.'
      : configs.length === 0 || configs.some((config) => !(config.fromCr > 0) || config.toCr < config.fromCr) ? 'Each configuration needs a price from and to (₹ Cr), with “to” at least “from”.'
        : ''

  function saveDraft() {
    store.cp.saveLaunch({ ...launch, id: draft?.id })
    onSent(`Draft saved · ${launchName(launch)}`)
  }
  function send() {
    const id = draft?.id ?? store.cp.saveLaunch({ ...launch, id: undefined })
    store.cp.sendLaunch({ ...launch, id }, chosen.map((match) => match.leadId), message)
    onSent(`Sending ${launchName(launch)} to ${chosen.length} buyers on WhatsApp`)
  }
  const setConfig = (index: number, change: Partial<ProjectConfig>) => setConfigs(configs.map((config, i) => (i === index ? { ...config, ...change } : config)))

  return (
    <Dialog label={draft ? `Review ${launchName(draft)}` : 'New launch'} variant="fullscreen" onClose={onClose} className="launch-wizard">
      <header className="launch-wizard-head">
        <div>
          <span className="eyebrow">Step {step + 1} of 3 · {STEPS[step]}</span>
          <h2>{launchName(launch)}</h2>
        </div>
        <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <ol className="launch-steps" aria-hidden="true">{STEPS.map((label, index) => <li key={label} className={index <= step ? 'done' : ''}>{label}</li>)}</ol>

      <div className="launch-wizard-body">
        {step === 0 && (
          <div className="launch-form add-lead">
            <form onSubmit={(event) => event.preventDefault()}>
              <div className="form-row">
                <label>Project
                  <select value={projectId} onChange={(event) => { setProjectId(event.target.value); const project = PROJECTS.find((item) => item.id === event.target.value); if (project) setConfigs(project.configs) }}>
                    {PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    <option value={NEW_PROJECT}>New project…</option>
                  </select>
                </label>
                <label>Phase or tower<input value={phase} onChange={(event) => setPhase(event.target.value)} placeholder="e.g. Phase 2" /></label>
              </div>
              {isNew && <>
                <label>Project name<input value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} placeholder="e.g. Silver Oak Enclave" /></label>
                <div className="form-row">
                  <label>Developer<select value={custom.developerId} onChange={(event) => setCustom({ ...custom, developerId: event.target.value })}>{DEVELOPERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label>Locality<select value={custom.locality} onChange={(event) => setCustom({ ...custom, locality: event.target.value })}>{LOCALITIES.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
                </div>
              </>}
              <fieldset className="launch-configs">
                <legend>Configurations</legend>
                {configs.map((config, index) => (
                  <div key={index} className="launch-config">
                    <select value={config.bhk} onChange={(event) => setConfig(index, { bhk: event.target.value })} aria-label={`Configuration ${index + 1}`}>{BHK_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
                    <span className="deal-input"><span>₹</span><input inputMode="decimal" value={config.fromCr || ''} onChange={(event) => setConfig(index, { fromCr: Number(event.target.value.replace(/[^\d.]/g, '')) })} aria-label="Price from" placeholder="From" /><span>Cr</span></span>
                    <span className="deal-input"><span>₹</span><input inputMode="decimal" value={config.toCr || ''} onChange={(event) => setConfig(index, { toCr: Number(event.target.value.replace(/[^\d.]/g, '')) })} aria-label="Price to" placeholder="To" /><span>Cr</span></span>
                    {configs.length > 1 && <button type="button" className="icon-button" aria-label="Remove configuration" onClick={() => setConfigs(configs.filter((_, i) => i !== index))}><Icon name="close" size={16} /></button>}
                  </div>
                ))}
                <button type="button" className="btn btn-soft" onClick={() => setConfigs([...configs, { bhk: '3 BHK', fromCr: 0, toCr: 0 }])}><Icon name="plus" size={16} /> Add configuration</button>
              </fieldset>
              <div className="form-row">
                <label>Launch day<select value={launchDay} onChange={(event) => setLaunchDay(Number(event.target.value))}>{Array.from({ length: 31 }, (_, day) => <option key={day} value={day}>{dayLabel(day)}</option>)}</select></label>
                <label>Early-access EOI<span className="deal-input"><span>₹</span><input inputMode="decimal" value={eoi} onChange={(event) => setEoi(event.target.value.replace(/[^\d.]/g, ''))} /><span>L</span></span></label>
              </div>
              <div className="form-row">
                <label>Possession<input value={possession} onChange={(event) => setPossession(event.target.value)} placeholder="e.g. Dec 2029" /></label>
                <label>RERA number *<input value={rera} onChange={(event) => setRera(event.target.value)} placeholder="PRM/KA/RERA/…" aria-invalid={!rera.trim()} /></label>
              </div>
              {detailsError && <p className="form-error" role="alert">{detailsError}</p>}
            </form>
          </div>
        )}

        {step === 1 && (
          <div className="launch-audience">
            <div className="launch-filters" role="group" aria-label="Match buyers on">
              {(['locality', 'bhk', 'budget'] as const).map((key) => (
                <button key={key} className={`chip ${filters[key] ? 'active' : ''}`} aria-pressed={filters[key]} onClick={() => { setFilters({ ...filters, [key]: !filters[key] }); setUnticked([]) }}>
                  <Icon name={filters[key] ? 'check' : 'close'} size={14} /> {key === 'locality' ? `Locality · ${launchProject(launch)?.locality}` : key === 'bhk' ? 'BHK' : 'Budget'}
                </button>
              ))}
            </div>
            <p className="launch-count"><strong>{matches.length} {matches.length === 1 ? 'buyer matches' : 'buyers match'}</strong>{chosen.length !== matches.length && ` · ${chosen.length} ticked`}</p>
            {matches.length > 0 ? (
              <ul className="launch-buyers">
                {matches.map((match) => {
                  const lead = store.findLead(match.leadId)
                  const ticked = !unticked.includes(match.leadId)
                  return (
                    <li key={match.leadId}>
                      <label className="checkbox-row launch-buyer">
                        <input type="checkbox" checked={ticked} onChange={() => setUnticked(ticked ? [...unticked, match.leadId] : unticked.filter((id) => id !== match.leadId))} />
                        <span>
                          <strong>{lead?.name}</strong>
                          <small>{lead?.ownerId ? shortName(store.findMember(lead.ownerId)?.name ?? '') : 'Unassigned'} · {match.reason}</small>
                        </span>
                        {match.registered && <em className="launch-registered">{match.registered}</em>}
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="empty-state"><span className="icon-badge"><Icon name="users" /></span><h3>None of your team’s buyers match</h3><p>Turn a filter off to widen it.</p></div>
            )}
            <p className="launch-note">Only buyers who agreed to receive updates from Better Days Realty are included.</p>
          </div>
        )}

        {step === 2 && (
          <div className="launch-preview">
            <span className="eyebrow">WhatsApp preview{firstBuyer ? ` · to ${firstBuyer.name}` : ''}</span>
            <div className="launch-bubble">
              <span className="message-tag">Marketing</span>
              <p>{firstBuyer ? message(firstBuyer.id) : 'Tick at least one buyer.'}</p>
              <div className="launch-bubble-buttons"><span>Yes, send details</span><span>Not now</span></div>
              <small>Reply STOP to opt out</small>
            </div>
            <p className="launch-cost">Marketing template · {chosen.length} × ₹{META_MARKETING_RATE.toFixed(2)} = {cost(chosen.length)} (Meta’s India rate, charged per delivered message)</p>
          </div>
        )}
      </div>

      <footer className="launch-wizard-foot">
        {confirming ? <>
          <span className="launch-confirm">Send to {chosen.length} buyers on WhatsApp? Each gets the marketing message above.</span>
          <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={send}><Icon name="whatsapp" size={16} /> Send now</button>
        </> : <>
          {step > 0 ? <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Back</button> : <button className="btn btn-ghost" disabled={!!detailsError} onClick={saveDraft}>Save draft</button>}
          <span className="launch-foot-spacer" />
          {step < 2
            ? <button className="btn btn-primary" disabled={step === 0 ? !!detailsError : chosen.length === 0} onClick={() => setStep(step + 1)}>Next <Icon name="arrow" size={16} /></button>
            : <button className="btn btn-primary" disabled={chosen.length === 0} onClick={() => setConfirming(true)}><Icon name="whatsapp" size={16} /> Send to {chosen.length} buyers</button>}
        </>}
      </footer>
    </Dialog>
  )
}
