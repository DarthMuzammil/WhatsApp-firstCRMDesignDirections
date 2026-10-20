import { useState, type FormEvent } from 'react'
import { PROPERTY_TYPES, initialsFor, type AvatarColor, type Lead } from '../data/demo'
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
export function AddLeadModal({ store, onClose, onOpenLead }: { store: DemoStore; onClose: () => void; onOpenLead: (lead: Lead) => void }) {
  const [saved, setSaved] = useState<{ name: string; owner?: Member; merged?: boolean } | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [kind, setKind] = useState<string>(PROPERTY_TYPES[0])
  const [area, setArea] = useState('')
  const [ownerChoice, setOwnerChoice] = useState<string>('auto')
  const choosesOwner = store.viewerCan('reassignLeads')
  // Duplicate check (spec §8.5): once 10 digits are typed, look for the number across the whole company.
  const duplicate = phone.length === 10 ? store.findDuplicate(phone) : undefined
  const duplicateVisible = duplicate ? !!store.findLead(duplicate.id) : false
  const duplicateOwner = store.findMember(duplicate?.ownerId)

  function mergeIntoDuplicate() {
    if (!duplicate) return
    store.mergeEnquiry(duplicate.id, `${kind} in ${area.trim() || 'Bengaluru'} via Quick capture${name.trim() ? ` (${name.trim()})` : ''}`)
    setSaved({ name: duplicate.name, owner: duplicateOwner, merged: true })
  }

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
            <h2>{saved.merged ? 'Enquiry merged' : 'Lead captured'}</h2>
            <p>
              {saved.merged
                ? `Added to ${saved.name}’s lead as a note${saved.owner && saved.owner.id !== store.viewer.id ? `; ${saved.owner.name} has been told` : ''}. No duplicate was created.`
                : saved.owner?.id === store.viewer.id
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
            {duplicate && (
              <div className="duplicate-alert" role="alert">
                <Icon name="alert" size={18} />
                <div>
                  <strong>This number is already {duplicate.name}</strong>
                  <small>{duplicate.need} · {duplicate.budget} · {duplicateOwner ? `owner ${shortName(duplicateOwner.name)}` : 'unassigned'}{duplicateVisible ? '' : ' (another team)'}</small>
                  <span>
                    {duplicateVisible && <button type="button" className="btn btn-secondary" onClick={() => { onClose(); onOpenLead(duplicate) }}>Open lead</button>}
                    <button type="button" className="btn btn-primary" onClick={mergeIntoDuplicate}>Merge enquiry</button>
                  </span>
                </div>
              </div>
            )}
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
            <button className={`btn btn-block add-lead-submit ${duplicate ? 'btn-secondary' : 'btn-primary'}`}>{duplicate ? 'Add as a separate lead anyway' : 'Add to inbox'} <Icon name="arrow" /></button>
          </form>
        </>}
    </Dialog>
  )
}
