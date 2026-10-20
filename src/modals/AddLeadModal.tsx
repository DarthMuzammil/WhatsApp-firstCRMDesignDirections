import { useState, type FormEvent } from 'react'
import { PROPERTY_TYPES, initialsFor, type AvatarColor, type LeadSeed } from '../data/demo'
import { Icon } from '../components/Icon'
import { useEscapeKey } from '../lib/useEscapeKey'
import './AddLeadModal.css'

const NEW_LEAD_COLORS: AvatarColor[] = ['blue', 'coral', 'violet', 'gold']

/** Quick-capture form. Creates a lead that appears in the inbox, pipeline and call picker. */
export function AddLeadModal({ onClose, onSave }: { onClose: () => void; onSave: (lead: LeadSeed) => void }) {
  const [savedName, setSavedName] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [kind, setKind] = useState<string>(PROPERTY_TYPES[0])
  const [area, setArea] = useState('')
  useEscapeKey(onClose)

  function submit(event: FormEvent) {
    event.preventDefault()
    const id = Date.now()
    const locality = area.trim() || 'Bengaluru'
    onSave({
      id,
      name: name.trim(),
      initials: initialsFor(name),
      need: `${kind} in ${locality}`,
      budget: 'Budget to qualify',
      budgetCr: 0,
      locality,
      message: 'New lead captured. Send a welcome message.',
      enquiry: '',
      time: 'Now',
      unread: 1,
      temp: 'New',
      source: 'Quick capture',
      color: NEW_LEAD_COLORS[id % NEW_LEAD_COLORS.length],
      online: false,
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      moveIn: 'To confirm',
      mustHave: 'To confirm',
      initialStage: 0,
      addedInDemo: true,
    })
    setSavedName(name.trim())
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New lead">
        <button className="icon-button bordered modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {savedName ? (
          <div className="modal-success">
            <span><Icon name="check" size={28} /></span>
            <h2>Lead captured</h2>
            <p>{savedName} is now in your inbox, pipeline and call list.</p>
            <button className="btn btn-primary" onClick={onClose}>Done <Icon name="check" /></button>
          </div>
        ) : <>
          <span className="eyebrow">Quick capture</span>
          <h2>New lead</h2>
          <p className="modal-intro">Add the essentials now. Enrich the details after your visit.</p>
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
            <button className="btn btn-primary btn-block modal-submit">Add to inbox <Icon name="arrow" /></button>
          </form>
        </>}
      </div>
    </div>
  )
}
