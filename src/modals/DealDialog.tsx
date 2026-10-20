import { useState, type FormEvent } from 'react'
import type { Lead } from '../data/demo'
import { LOST_REASON_OPTIONS, OFFER_BY_LABELS, latestOffer, type Deal, type Offer, type OfferBy, type SplitShare } from '../data/deals'
import { shortName } from '../data/team'
import { developerOfProject, findProject, isActiveRegistration, registrationStatus, registrationValidUntil } from '../data/channelPartner'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { dayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './DealDialog.css'

const num = (value: string) => (value.trim() === '' ? undefined : Number(value))

/** Default split: the owner, with 10% to a Pre-sales person who handed the lead over (spec §8.10). */
function defaultSplit(lead: Lead, store: DemoStore): SplitShare[] {
  const owner = lead.ownerId ?? store.viewer.id
  const presales = store.assignments.find((entry) => entry.leadId === lead.id && entry.fromId && store.findMember(entry.fromId)?.roles.includes('presales'))?.fromId
  return presales && presales !== owner ? [{ memberId: owner, pct: 90 }, { memberId: presales, pct: 10 }] : [{ memberId: owner, pct: 100 }]
}

/**
 * Offer tracker + commission split. `mode="win"` requires an agreed price and closes the deal as won.
 */
export function DealDialog({ lead, store, mode, onClose, onSaved }: { lead: Lead; store: DemoStore; mode: 'edit' | 'win'; onClose: () => void; onSaved: (message: string) => void }) {
  const existing = store.dealFor(lead.id)
  const asking = existing?.askedCr ?? store.bestMatch(lead).priceCr
  const [asked, setAsked] = useState(String(asking))
  const [offers, setOffers] = useState<Offer[]>(existing?.offers ?? [])
  // The "Log an offer" row. A filled-in amount is included on Save even without pressing Add.
  const [newBy, setNewBy] = useState<OfferBy>('buyer')
  const [newAmount, setNewAmount] = useState('')
  const [newDay, setNewDay] = useState(0)
  const lastBuyerOffer = latestOffer(existing, 'buyer')
  const [agreed, setAgreed] = useState(existing?.agreedCr !== undefined ? String(existing.agreedCr) : mode === 'win' && lastBuyerOffer ? String(lastBuyerOffer.amountCr) : '')
  const [token, setToken] = useState(existing?.tokenL !== undefined ? String(existing.tokenL) : '')
  const [tokenDay, setTokenDay] = useState(existing?.tokenDay ?? 0)
  const [agreementDay, setAgreementDay] = useState<number | null>(existing?.agreementDay ?? null)
  const [split, setSplit] = useState<SplitShare[]>(existing?.split ?? defaultSplit(lead, store))
  // M14: a lead registered with a developer can be won as a new-launch booking (off by default).
  const registration = mode === 'win'
    ? store.cp.registrationsFor(lead.id).filter((item) => registrationStatus(item).kind !== 'booked' && registrationStatus(item).kind !== 'disputed')
      .sort((a, b) => Number(isActiveRegistration(b)) - Number(isActiveRegistration(a)) || b.day - a.day)[0]
    : undefined
  const [asBooking, setAsBooking] = useState(false)
  const [unit, setUnit] = useState('')
  const total = split.reduce((sum, share) => sum + share.pct, 0)
  const people = store.members.filter((person) => person.status !== 'deactivated' && (person.roles.includes('sales') || person.roles.includes('presales')))
  const error = total !== 100 ? `Commission split adds up to ${total}%. It must be 100%.`
    : mode === 'win' && !(Number(agreed) > 0) ? 'Enter the agreed price to mark the deal won.'
      : newAmount !== '' && !(Number(newAmount) > 0) ? 'Enter the offer amount in ₹ crore, or clear it.'
        : asBooking && !unit.trim() ? 'Enter the unit for the new-launch booking.'
          : ''

  const pendingOffer = (): Offer | null => (Number(newAmount) > 0 ? { id: Date.now(), by: newBy, amountCr: Number(newAmount), day: newDay } : null)
  function addOffer() {
    const offer = pendingOffer()
    if (!offer) return
    setOffers([...offers, offer].sort((a, b) => a.day - b.day))
    setNewAmount('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (error) return
    const pending = pendingOffer()
    const deal: Deal = {
      askedCr: Number(asked) || asking,
      offers: pending ? [...offers, pending].sort((a, b) => a.day - b.day) : offers,
      agreedCr: num(agreed), tokenL: num(token), tokenDay: num(token) ? tokenDay : undefined, agreementDay: agreementDay ?? undefined,
      docs: existing?.docs ?? { kyc: false, token: false, agreement: false }, split,
    }
    store.updateDeal(lead.id, deal)
    if (mode === 'win') {
      store.closeLead(lead.id, { result: 'won' }, deal.agreedCr)
      if (registration && asBooking && deal.agreedCr) store.cp.bookFromDeal(registration.id, unit.trim(), deal.agreedCr)
      onSaved(`${lead.name} won at ₹${deal.agreedCr} Cr`)
    } else onSaved('Deal saved')
  }

  const money = (label: string, value: string, set: (value: string) => void, unit: string) => (
    <label>{label}<span className="deal-input"><span>₹</span><input inputMode="decimal" value={value} onChange={(event) => set(event.target.value.replace(/[^\d.]/g, ''))} /><span>{unit}</span></span></label>
  )
  const dayOptions = (days: number[]) => days.map((day) => <option key={day} value={day}>{dayLabel(day)}</option>)

  return (
    <Dialog label={mode === 'win' ? `Mark ${lead.name} won` : `Deal for ${lead.name}`} onClose={onClose} className="add-lead deal-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">{mode === 'win' ? 'Close the deal' : 'Offer tracker'}</span>
      <h2>{lead.name}</h2>
      <p className="add-lead-intro">{lead.need} · {store.bestMatch(lead).name}</p>
      <form onSubmit={submit}>
        {money('Asking price', asked, setAsked, 'Cr')}
        <fieldset className="offers">
          <legend>Offers</legend>
          {offers.length > 0 && (
            <ol className="offer-list">
              {[...offers].reverse().map((offer) => (
                <li key={offer.id}>
                  <span className={`offer-by ${offer.by}`}>{offer.by === 'buyer' ? 'Buyer' : 'Owner'}</span>
                  <strong>₹{offer.amountCr} Cr</strong>
                  <small>{dayLabel(offer.day)}</small>
                  <button type="button" className="icon-button" aria-label={`Remove ${OFFER_BY_LABELS[offer.by].toLowerCase()} ₹${offer.amountCr} Cr`} onClick={() => setOffers(offers.filter((item) => item.id !== offer.id))}><Icon name="close" size={14} /></button>
                </li>
              ))}
            </ol>
          )}
          <div className="offer-new">
            <div className="segmented" role="radiogroup" aria-label="Who made the offer">
              {(['buyer', 'owner'] as OfferBy[]).map((by) => <button type="button" key={by} role="radio" aria-checked={newBy === by} className={newBy === by ? 'active' : ''} onClick={() => setNewBy(by)}>{by === 'buyer' ? 'Buyer offer' : 'Owner counter'}</button>)}
            </div>
            <span className="deal-input"><span>₹</span><input inputMode="decimal" value={newAmount} onChange={(event) => setNewAmount(event.target.value.replace(/[^\d.]/g, ''))} aria-label="Offer amount" placeholder="Amount" /><span>Cr</span></span>
            <select value={newDay} onChange={(event) => setNewDay(Number(event.target.value))} aria-label="Offer date">{dayOptions(Array.from({ length: 15 }, (_, index) => -index))}</select>
            <button type="button" className="btn btn-soft" disabled={!(Number(newAmount) > 0)} onClick={addOffer}><Icon name="plus" size={16} /> Add</button>
          </div>
        </fieldset>
        <div className="form-row">
          {money(mode === 'win' ? 'Agreed price *' : 'Agreed price', agreed, setAgreed, 'Cr')}
          <label>Agreement by<select value={agreementDay ?? ''} onChange={(event) => setAgreementDay(event.target.value === '' ? null : Number(event.target.value))}><option value="">Not set</option>{dayOptions(Array.from({ length: 31 }, (_, index) => index))}</select></label>
        </div>
        <div className="form-row">
          {money('Token amount', token, setToken, 'L')}
          {num(token) ? <label>Token paid on<select value={tokenDay} onChange={(event) => setTokenDay(Number(event.target.value))}>{dayOptions(Array.from({ length: 15 }, (_, index) => -index))}</select></label> : <span />}
        </div>
        <fieldset className="split">
          <legend>Commission split</legend>
          {split.map((share, index) => (
            <div key={index} className="split-row">
              <select value={share.memberId} onChange={(event) => setSplit(split.map((item, i) => (i === index ? { ...item, memberId: event.target.value } : item)))} aria-label={`Person ${index + 1}`}>
                {people.map((person) => <option key={person.id} value={person.id}>{shortName(person.name)}</option>)}
              </select>
              <span className="deal-input pct"><input inputMode="numeric" value={share.pct} onChange={(event) => setSplit(split.map((item, i) => (i === index ? { ...item, pct: Number(event.target.value.replace(/\D/g, '').slice(0, 3)) } : item)))} aria-label={`Share ${index + 1}`} /><span>%</span></span>
              {split.length > 1 && <button type="button" className="icon-button" aria-label="Remove" onClick={() => setSplit(split.filter((_, i) => i !== index))}><Icon name="close" size={16} /></button>}
            </div>
          ))}
          <button type="button" className="btn btn-soft" onClick={() => setSplit([...split, { memberId: people[0].id, pct: 0 }])}><Icon name="plus" size={16} /> Add person</button>
        </fieldset>
        {registration && (
          <fieldset className="launch-booking">
            <label className="checkbox-row"><input type="checkbox" checked={asBooking} onChange={(event) => setAsBooking(event.target.checked)} /> New-launch booking at {findProject(registration.projectId)?.name}</label>
            {!isActiveRegistration(registration) && <p className="launch-booking-note" role="note"><Icon name="alert" size={14} /> Registration lapsed on {dayLabel(registrationValidUntil(registration))}. The developer may refuse brokerage.</p>}
            {asBooking && <label>Unit<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="e.g. T1-1404" /></label>}
            {asBooking && <small className="launch-booking-hint">Adds it to Brokerage: {developerOfProject(registration.projectId)?.brokeragePct}% from {developerOfProject(registration.projectId)?.name}, billable once the buyer pays {developerOfProject(registration.projectId)?.billableAfterPct}%.</small>}
          </fieldset>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block add-lead-submit" disabled={!!error}>{mode === 'win' ? 'Mark won' : 'Save deal'} <Icon name="check" /></button>
      </form>
    </Dialog>
  )
}

/** Losing a deal needs a reason (spec §8.10); reasons feed the owner's "Why deals were lost". */
export function LostDialog({ lead, onClose, onConfirm }: { lead: Lead; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState<string>(LOST_REASON_OPTIONS[0])
  return (
    <Dialog label={`Mark ${lead.name} lost`} onClose={onClose} className="confirm-dialog">
      <h2>Mark {lead.name} lost?</h2>
      <p>The lead moves to Closed. You can reopen it later.</p>
      <label className="lost-reason">Reason<select value={reason} onChange={(event) => setReason(event.target.value)}>{LOST_REASON_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
      <footer>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => onConfirm(reason)}>Mark lost</button>
      </footer>
    </Dialog>
  )
}
