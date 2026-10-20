import { useState, type FormEvent } from 'react'
import { LOCALITIES, PROPERTY_KINDS, PROPERTY_STATUS_LABELS, type Property, type PropertyKind, type PropertyStatus } from '../data/inventory'
import { shortName } from '../data/team'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { DemoStore } from '../state/useDemoStore'
import './PropertyDialog.css'

/** Add a listing (no `property`) or edit one (spec §8.11). Saved locally; added listings have no photo. */
export function PropertyDialog({ store, property, onClose, onSaved }: { store: DemoStore; property?: Property; onClose: () => void; onSaved: (message: string) => void }) {
  const [name, setName] = useState(property?.name ?? '')
  const [locality, setLocality] = useState(property?.locality ?? LOCALITIES[0].name)
  const [kind, setKind] = useState<PropertyKind>(property?.kind ?? 'Apartment')
  const [bhk, setBhk] = useState(property?.bhk ?? 3)
  const [price, setPrice] = useState(property ? String(property.priceCr) : '')
  const [area, setArea] = useState(property ? String(property.areaSqft) : '')
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? 'available')
  const [agentId, setAgentId] = useState(property?.listingAgentId ?? store.viewer.id)
  const [ownerName, setOwnerName] = useState(property?.ownerName ?? '')
  const [ownerPhone, setOwnerPhone] = useState(property ? property.ownerPhone.replace(/^\+91\s*/, '').replace(/\D/g, '') : '')
  const [tried, setTried] = useState(false)
  // Sales may edit listings but not see the owner's full number unless it's their listing; keep the stored number then.
  const phoneHidden = !!property && store.ownerPhone(property) !== property.ownerPhone
  const agents = store.members.filter((person) => person.status !== 'deactivated' && (person.roles.includes('sales') || person.roles.includes('manager') || person.roles.includes('owner')))

  const error = !name.trim() ? 'Enter the property name.'
    : !(Number(price) > 0) ? 'Enter the asking price in ₹ crore.'
      : !(Number(area) > 0) ? 'Enter the carpet area in sq ft.'
        : !ownerName.trim() ? 'Enter the owner’s name.'
          : !phoneHidden && ownerPhone.length !== 10 ? 'Enter the owner’s 10-digit mobile number.'
            : ''

  function submit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (error) return
    const centre = LOCALITIES.find((item) => item.name === locality) ?? LOCALITIES[0]
    const saved = store.saveProperty({
      ...(property ?? { id: 0, city: 'Bengaluru', lat: centre.lat, lng: centre.lng }),
      ...(property && property.locality !== locality ? { lat: centre.lat, lng: centre.lng } : {}),
      name: name.trim(), locality, kind, bhk, priceCr: Number(price), areaSqft: Number(area), status, listingAgentId: agentId,
      ownerName: ownerName.trim(),
      ownerPhone: phoneHidden ? property!.ownerPhone : `+91 ${ownerPhone.slice(0, 5)} ${ownerPhone.slice(5)}`,
    })
    onSaved(property ? `${saved.name} updated` : `${saved.name} added to inventory`)
  }

  return (
    <Dialog label={property ? `Edit ${property.name}` : 'Add property'} onClose={onClose} className="add-lead property-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Inventory</span>
      <h2>{property ? 'Edit property' : 'Add property'}</h2>
      <p className="add-lead-intro">{property ? 'Changes show up in matches straight away.' : 'It appears in matches for every lead it fits.'}</p>
      <form onSubmit={submit} noValidate>
        <label>Property name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Banyan Court, Tower B" autoFocus /></label>
        <div className="form-row">
          <label>Locality<select value={locality} onChange={(event) => setLocality(event.target.value)}>{LOCALITIES.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label>Bedrooms<select value={bhk} onChange={(event) => setBhk(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count} BHK</option>)}</select></label>
        </div>
        <fieldset className="purpose-field">
          <legend>Type</legend>
          <div className="segmented" role="radiogroup" aria-label="Type">
            {PROPERTY_KINDS.map((option) => <button type="button" key={option} role="radio" aria-checked={kind === option} className={kind === option ? 'active' : ''} onClick={() => setKind(option)}>{option}</button>)}
          </div>
        </fieldset>
        <div className="form-row">
          <label>Asking price<span className="deal-input"><span>₹</span><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^\d.]/g, ''))} /><span>Cr</span></span></label>
          <label>Carpet area<span className="deal-input"><input inputMode="numeric" value={area} onChange={(event) => setArea(event.target.value.replace(/\D/g, '').slice(0, 5))} /><span>sq ft</span></span></label>
        </div>
        <fieldset className="purpose-field">
          <legend>Availability</legend>
          <div className="segmented" role="radiogroup" aria-label="Availability">
            {(Object.keys(PROPERTY_STATUS_LABELS) as PropertyStatus[]).map((option) => <button type="button" key={option} role="radio" aria-checked={status === option} className={status === option ? 'active' : ''} onClick={() => setStatus(option)}>{PROPERTY_STATUS_LABELS[option]}</button>)}
          </div>
        </fieldset>
        <label>Listing agent<select value={agentId} onChange={(event) => setAgentId(event.target.value)}>{agents.map((person) => <option key={person.id} value={person.id}>{shortName(person.name)}</option>)}</select></label>
        <div className="form-row">
          <label>Owner’s name<input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} /></label>
          {phoneHidden
            ? <label>Owner’s mobile<input value={store.ownerPhone(property!)} disabled /></label>
            : <label>Owner’s mobile<span className="phone-input"><span>+91</span><input inputMode="numeric" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} /></span></label>}
        </div>
        <p className="property-dialog-note"><Icon name="info" size={14} /> The owner’s number is only shown in full to Managers, the Owner and the listing agent.</p>
        {tried && error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block add-lead-submit">{property ? 'Save changes' : 'Add property'} <Icon name="check" /></button>
      </form>
    </Dialog>
  )
}
