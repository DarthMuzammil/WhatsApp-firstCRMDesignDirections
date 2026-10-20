import { useState, type FormEvent } from 'react'
import { PROPERTY_TYPES, initialsFor, type AvatarColor, type Lead } from '../data/demo'
import { shortName, type Member } from '../data/team'
import { Icon } from '../components/Icon'
import { Dialog } from '../components/Dialog'
import { BROKER_GROUPS, GROUP_MESSAGE_SAMPLES, parseGroupMessage, type GroupMessageReading } from '../lib/ai'
import type { DemoStore } from '../state/useDemoStore'
import './AddLeadModal.css'

const NEW_LEAD_COLORS: AvatarColor[] = ['blue', 'coral', 'violet', 'gold']
const ROUTING_LABEL = { 'round-robin': 'round-robin', locality: 'by locality', source: 'by source' } as const
const SAMPLE_LABELS = ['3 BHK · HSR / Kora', '2 BHK · Indiranagar', 'Villa · from a broker', 'Resale listing']
type Field = 'name' | 'phone' | 'kind' | 'area' | 'budget' | 'mustHave'
type Mode = 'type' | 'paste'

/** Closest "Looking for" option to what the message asked for ("4 BHK villa" → Villa). */
const kindOption = (kind?: string) => (kind && /villa/i.test(kind) ? 'Villa' : PROPERTY_TYPES.find((type) => type === kind) ?? PROPERTY_TYPES[0])

/**
 * Quick-capture form. Sales and Pre-sales own the leads they add; managers and the owner
 * choose "Auto" (company routing rule) or a specific person.
 * M14 (spec §8.17.4): **Paste a message** reads a requirement forwarded from a brokers' WhatsApp group and
 * suggests the fields (AI · Suggested until edited or confirmed); the lead's source is Broker groups.
 */
export function AddLeadModal({ store, onClose, onOpenLead, initialMode = 'type', initialText = '' }: { store: DemoStore; onClose: () => void; onOpenLead: (lead: Lead) => void; initialMode?: Mode; initialText?: string }) {
  const [saved, setSaved] = useState<{ name: string; owner?: Member; merged?: boolean } | null>(null)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [kind, setKind] = useState<string>(PROPERTY_TYPES[0])
  const [area, setArea] = useState('')
  const [budget, setBudget] = useState('')
  const [mustHave, setMustHave] = useState('')
  const [ownerChoice, setOwnerChoice] = useState<string>('auto')
  // Paste mode
  const [pasted, setPasted] = useState(initialText)
  const [group, setGroup] = useState(BROKER_GROUPS[0])
  const [reading, setReading] = useState<GroupMessageReading | null>(null)
  const [listingAccepted, setListingAccepted] = useState(false)
  const [numberOwner, setNumberOwner] = useState<'buyer' | 'broker'>('buyer')
  const [suggested, setSuggested] = useState<Field[]>([])
  const choosesOwner = store.viewerCan('reassignLeads')
  const fromGroup = mode === 'paste' && !!reading
  // Duplicate check (spec §8.5): once 10 digits are typed, look for the number across the whole company.
  const duplicate = phone.length === 10 ? store.findDuplicate(phone) : undefined
  const duplicateVisible = duplicate ? !!store.findLead(duplicate.id) : false
  const duplicateOwner = store.findMember(duplicate?.ownerId)
  const source = fromGroup ? 'Broker groups' : 'Quick capture'

  const edited = (field: Field) => setSuggested((current) => current.filter((item) => item !== field))
  const ai = (field: Field) => suggested.includes(field) && <small className="ai-chip"><Icon name="spark" size={10} /> AI · Suggested</small>
  const brokerName = (found: GroupMessageReading) => `Client of ${found.name ?? 'the broker'}${found.brokerFirm ? ` (${found.brokerFirm})` : ''}`

  function read() {
    const found = parseGroupMessage(pasted)
    const owner = found.numberIsBroker ? 'broker' : 'buyer'
    setReading(found)
    setListingAccepted(false)
    setNumberOwner(owner)
    setName(owner === 'broker' ? brokerName(found) : found.name ?? '')
    setPhone(found.phone ?? '')
    setKind(kindOption(found.kind))
    setArea(found.localities.join(', '))
    setBudget(found.budget ?? '')
    setMustHave(found.mustHaves.join(' · '))
    setSuggested((['name', 'phone', 'kind', 'area', 'budget', 'mustHave'] as Field[]).filter((field) => ({
      name: owner === 'broker' || !!found.name, phone: !!found.phone, kind: !!found.kind, area: found.localities.length > 0, budget: !!found.budget, mustHave: found.mustHaves.length > 0,
    })[field]))
  }

  function chooseOwner(owner: 'buyer' | 'broker') {
    setNumberOwner(owner)
    if (reading) setName(owner === 'broker' ? brokerName(reading) : reading.name ?? '')
  }

  function mergeIntoDuplicate() {
    if (!duplicate) return
    store.mergeEnquiry(duplicate.id, `${kind} in ${area.trim() || 'Bengaluru'} via ${fromGroup ? `Broker groups (${group})` : 'Quick capture'}${name.trim() ? ` (${name.trim()})` : ''}`)
    setSaved({ name: duplicate.name, owner: duplicateOwner, merged: true })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const id = Date.now()
    const localities = area.split(',').map((item) => item.trim()).filter(Boolean)
    const locality = localities[0] || 'Bengaluru'
    const budgetNumbers = (budget.match(/\d+(\.\d+)?/g) ?? []).map(Number)
    const owner = store.addLead({
      id,
      name: name.trim(),
      initials: initialsFor(name),
      need: `${kind} in ${locality}`,
      budget: fromGroup && budget.trim() ? budget.trim() : 'Budget to qualify',
      budgetCr: fromGroup && budgetNumbers.length ? (budgetNumbers[0] + budgetNumbers[budgetNumbers.length - 1]) / 2 : 0,
      locality,
      localities: localities.length > 1 ? localities : undefined,
      message: fromGroup ? 'Captured from a broker group. Call or send a welcome message.' : 'New lead captured. Send a welcome message.',
      enquiry: fromGroup ? pasted.trim() : '',
      minutesAgo: 0,
      unread: 1,
      temp: 'New',
      source,
      color: NEW_LEAD_COLORS[id % NEW_LEAD_COLORS.length],
      online: false,
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      moveIn: 'To confirm',
      mustHave: fromGroup && mustHave.trim() ? mustHave.trim() : 'To confirm',
      initialStage: 0,
      ownerId: null,
      addedInDemo: true,
    }, ownerChoice)
    if (fromGroup) store.captureFromGroup(id, { group, text: pasted.trim(), coBroking: numberOwner === 'broker' })
    setSaved({ name: name.trim(), owner })
  }

  const showForm = mode === 'type' || (reading && (!reading.looksLikeListing || listingAccepted))

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
          <div className="segmented capture-mode" role="tablist" aria-label="How to add the lead">
            <button type="button" role="tab" aria-selected={mode === 'type'} className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')}>Type it in</button>
            <button type="button" role="tab" aria-selected={mode === 'paste'} className={mode === 'paste' ? 'active' : ''} onClick={() => setMode('paste')}>Paste a message</button>
          </div>
          {mode === 'type' && <p className="add-lead-intro">Add the essentials now. Enrich the details after your visit.</p>}

          {mode === 'paste' && !reading && (
            <div className="paste-capture">
              <label>Forwarded message
                <textarea rows={5} autoFocus value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder="Paste a message forwarded from a broker group" />
              </label>
              <div className="chip-row paste-samples" role="group" aria-label="Sample messages">
                {GROUP_MESSAGE_SAMPLES.map((sample, index) => <button key={sample} type="button" className="chip" onClick={() => setPasted(sample)}>{SAMPLE_LABELS[index]}</button>)}
              </div>
              <label>Group
                <select value={group} onChange={(event) => setGroup(event.target.value)}>{BROKER_GROUPS.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <p className="paste-note">Bayana can’t read your WhatsApp groups. Forward or paste a message here and it suggests the details.</p>
              <button type="button" className="btn btn-primary btn-block add-lead-submit" disabled={!pasted.trim()} onClick={read}><Icon name="spark" size={16} /> Read message</button>
            </div>
          )}

          {mode === 'paste' && reading?.looksLikeListing && !listingAccepted && (
            <div className="duplicate-alert listing-alert" role="alert">
              <Icon name="alert" size={18} />
              <div>
                <strong>This looks like a property for sale, not a buyer’s requirement.</strong>
                <small>“{pasted.trim().slice(0, 90)}{pasted.trim().length > 90 ? '…' : ''}”</small>
                <span>
                  <button type="button" className="btn btn-secondary" onClick={() => setReading(null)}>Paste another</button>
                  <button type="button" className="btn btn-primary" onClick={() => setListingAccepted(true)}>It’s a buyer, continue</button>
                </span>
              </div>
            </div>
          )}

          {showForm && (
          <form onSubmit={submit}>
            {fromGroup && (
              <div className="paste-summary">
                <span><Icon name="whatsapp" size={14} /> From {group}</span>
                <button type="button" className="btn btn-ghost" onClick={() => { setReading(null); setSuggested([]) }}>Paste another</button>
                {suggested.length > 0 && <button type="button" className="btn btn-soft" onClick={() => setSuggested([])}><Icon name="check" size={14} /> Confirm all</button>}
              </div>
            )}
            {fromGroup && (
              <div className="number-owner">
                <span>Number belongs to</span>
                <div className="segmented" role="radiogroup" aria-label="Number belongs to">
                  <button type="button" role="radio" aria-checked={numberOwner === 'buyer'} className={numberOwner === 'buyer' ? 'active' : ''} onClick={() => chooseOwner('buyer')}>The buyer</button>
                  <button type="button" role="radio" aria-checked={numberOwner === 'broker'} className={numberOwner === 'broker' ? 'active' : ''} onClick={() => chooseOwner('broker')}>The broker who posted it</button>
                </div>
                {numberOwner === 'broker' && <small>Saved as a <strong>Co-broking</strong> lead: you’ll deal with the buyer through this broker.</small>}
              </div>
            )}
            <label><span>Full name {ai('name')}</span>
              <input required autoFocus={mode === 'type'} value={name} onChange={(event) => { setName(event.target.value); edited('name') }} placeholder="e.g. Priya Menon" autoComplete="off" />
            </label>
            <label><span>WhatsApp number {ai('phone')}</span>
              <div className="phone-input">
                <span>+91</span>
                <input required inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10-digit mobile number" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); edited('phone') }} placeholder="98765 43210" />
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
              <label><span>Looking for {ai('kind')}</span>
                <select value={kind} onChange={(event) => { setKind(event.target.value); edited('kind') }}>
                  {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label><span>Preferred area {ai('area')}</span>
                <input value={area} onChange={(event) => { setArea(event.target.value); edited('area') }} placeholder="e.g. Koramangala" />
              </label>
            </div>
            {fromGroup && (
              <div className="form-row">
                <label><span>Budget {ai('budget')}</span><input value={budget} onChange={(event) => { setBudget(event.target.value); edited('budget') }} placeholder="e.g. ₹1.8–2.1 Cr" /></label>
                <label><span>Must-haves {ai('mustHave')}</span><input value={mustHave} onChange={(event) => { setMustHave(event.target.value); edited('mustHave') }} placeholder="e.g. OC received" /></label>
              </div>
            )}
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
          )}
        </>}
    </Dialog>
  )
}
