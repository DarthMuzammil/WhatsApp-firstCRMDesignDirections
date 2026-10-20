import { useState, type FormEvent } from 'react'
import type { Lead } from '../data/demo'
import { LOST_REASON_OPTIONS, type Deal, type SplitShare } from '../data/deals'
import { shortName } from '../data/team'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
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
  const [offered, setOffered] = useState(existing?.offeredCr !== undefined ? String(existing.offeredCr) : '')
  const [agreed, setAgreed] = useState(existing?.agreedCr !== undefined ? String(existing.agreedCr) : mode === 'win' && existing?.offeredCr ? String(existing.offeredCr) : '')
  const [token, setToken] = useState(existing?.tokenL !== undefined ? String(existing.tokenL) : '')
  const [split, setSplit] = useState<SplitShare[]>(existing?.split ?? defaultSplit(lead, store))
  const total = split.reduce((sum, share) => sum + share.pct, 0)
  const people = store.members.filter((person) => person.status !== 'deactivated' && (person.roles.includes('sales') || person.roles.includes('presales')))
  const error = total !== 100 ? `Commission split adds up to ${total}%. It must be 100%.`
    : mode === 'win' && !(Number(agreed) > 0) ? 'Enter the agreed price to mark the deal won.'
      : ''

  function submit(event: FormEvent) {
    event.preventDefault()
    if (error) return
    const deal: Deal = { askedCr: Number(asked) || asking, offeredCr: num(offered), agreedCr: num(agreed), tokenL: num(token), docs: existing?.docs ?? { kyc: false, token: false, agreement: false }, split }
    store.updateDeal(lead.id, deal)
    if (mode === 'win') {
      store.closeLead(lead.id, { result: 'won' })
      onSaved(`${lead.name} won at ₹${deal.agreedCr} Cr`)
    } else onSaved('Deal saved')
  }

  const money = (label: string, value: string, set: (value: string) => void, unit: string) => (
    <label>{label}<span className="deal-input"><span>₹</span><input inputMode="decimal" value={value} onChange={(event) => set(event.target.value.replace(/[^\d.]/g, ''))} /><span>{unit}</span></span></label>
  )

  return (
    <Dialog label={mode === 'win' ? `Mark ${lead.name} won` : `Deal for ${lead.name}`} onClose={onClose} className="add-lead deal-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">{mode === 'win' ? 'Close the deal' : 'Offer tracker'}</span>
      <h2>{lead.name}</h2>
      <p className="add-lead-intro">{lead.need} · {store.bestMatch(lead).name}</p>
      <form onSubmit={submit}>
        <div className="form-row">
          {money('Asking price', asked, setAsked, 'Cr')}
          {money('Buyer’s offer', offered, setOffered, 'Cr')}
        </div>
        <div className="form-row">
          {money(mode === 'win' ? 'Agreed price *' : 'Agreed price', agreed, setAgreed, 'Cr')}
          {money('Token amount', token, setToken, 'L')}
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
