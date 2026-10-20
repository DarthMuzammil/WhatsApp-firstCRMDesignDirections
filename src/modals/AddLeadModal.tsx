import { useState, type FormEvent } from 'react'
import { PROPERTY_TYPES, initialsFor, type AvatarColor } from '../data/demo'
import { shortName, type Member } from '../data/team'
import { Icon } from '../components/Icon'
import { Dialog } from '../components/Dialog'
import type { DemoStore } from '../state/useDemoStore'
import './AddLeadModal.css'

const NEW_LEAD_COLORS: AvatarColor[] = ['blue', 'coral', 'violet', 'gold']
const ROUTING_LABEL = { 'round-robin': 'round-robin', locality: 'by locality', source: 'by source' } as const

/**
 * Quick-capture form. Sales and Pre-sales own the leads they add; managers and the owner
 * choose "Auto" (company routing rule) or a specific person.
 */
export function AddLeadModal({ store, onClose }: { store: DemoStore; onClose: () => void }) {
  const [saved, setSaved] = useState<{ name: string; owner?: Member } | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [kind, setKind] = useState<string>(PROPERTY_TYPES[0])
  const [area, setArea] = useState('')
  const [ownerChoice, setOwnerChoice] = useState<string>('auto')
  const choosesOwner = store.viewerCan('reassignLeads')

  function submit(event: FormEvent) {
    event.preventDefault()
    const id = Date.now()
    const locality = area.trim() || 'Bengaluru'
    const owner = store.addLead({
      id,
      name: name.trim(),
      initials: initialsFor(name),
      need: `${kind} in ${locality}`,
      budget: 'Budget to qualify',
      budgetCr: 0,
      locality,
      message: 'New lead captured. Send a welcome message.',
      enquiry: '',
      minutesAgo: 0,
      unread: 1,
      temp: 'New',
      source: 'Quick capture',
      color: NEW_LEAD_COLORS[id % NEW_LEAD_COLORS.length],
      online: false,
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      moveIn: 'To confirm',
      mustHave: 'To confirm',
      initialStage: 0,
      ownerId: null,
      addedInDemo: true,
    }, ownerChoice)
    setSaved({ name: name.trim(), owner })
  }

  return (
    <Dialog label="New lead" onClose={onClose} className="add-lead">
        <button className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {saved ? (
          <div className="add-lead-success">
            <span className="icon-badge lg"><Icon name="check" size={28} /></span>
            <h2>Lead captured</h2>
            <p>
              {saved.owner?.id === store.viewer.id
                ? `${saved.name} is now in your inbox, pipeline and call list.`
                : saved.owner
                  ? `${saved.name} is assigned to ${saved.owner.name}.`
                  : `${saved.name} is in the unassigned queue.`}
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done <Icon name="check" /></button>
          </div>
        ) : <>
          <span className="eyebrow">Quick capture</span>
          <h2>New lead</h2>
          <p className="add-lead-intro">Add the essentials now. Enrich the details after your visit.</p>
          <form onSubmit={submit}>
            <label>Full name
              <input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Priya Menon" autoComplete="off" />
            </label>
            <label>WhatsApp number
              <div className="phone-input">
                <span>+91</span>
                <input required inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" />
              </div>
            </label>
            <div className="form-row">
              <label>Looking for
                <select value={kind} onChange={(event) => setKind(event.target.value)}>
                  {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>Preferred area
                <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Koramangala" />
              </label>
            </div>
            {choosesOwner && (
              <label>Assign to
                <select value={ownerChoice} onChange={(event) => setOwnerChoice(event.target.value)}>
                  <option value="auto">Auto ({store.settings.separatePresales ? 'Pre-sales first' : ROUTING_LABEL[store.settings.routing]})</option>
                  {store.assignableMembers.map((person) => <option key={person.id} value={person.id}>{shortName(person.name)} · {store.openLeadCount(person.id)} open</option>)}
                </select>
              </label>
            )}
            <button className="btn btn-primary btn-block add-lead-submit">Add to inbox <Icon name="arrow" /></button>
          </form>
        </>}
    </Dialog>
  )
}
