import { useState } from 'react'
import { firstName, type Lead } from '../data/demo'
import { bedroomsLabel, priceLabel, type Property } from '../data/inventory'
import { TEMPLATES, fillTemplate } from '../data/templates'
import { LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { PropertyCard, PropertyPhoto } from '../components/PropertyCard'
import type { DemoStore } from '../state/useDemoStore'
import './ShareDialog.css'

const SHORTLIST_TEMPLATE = TEMPLATES.find((template) => template.id === 'shortlist')!

/** "Hi Ananya, here are 2 homes that match your brief: A and B. …" */
function shareText(lead: Lead, properties: Property[]): string {
  const names = properties.map((property) => property.name)
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
  return `Hi ${firstName(lead.name)}, here ${properties.length === 1 ? 'is a home that matches' : `are ${properties.length} homes that match`} your brief: ${list}. ${properties.length === 1 ? 'Would you like to visit?' : 'Tell me which ones you’d like to visit.'}`
}

/**
 * Share listings on WhatsApp (spec §8.11).
 * - From a lead (chat "Share shortlist"): pick from the lead's matches, see the WhatsApp preview, send.
 * - From a listing (Properties "Share"): first pick the lead, then the same steps with that listing ticked.
 * Outside WhatsApp's 24-hour window the message goes as the approved "Share shortlist" template.
 */
export function ShareDialog({ store, lead: fixedLead, propertyId, onClose, onSent }: { store: DemoStore; lead?: Lead; propertyId?: number; onClose: () => void; onSent: (message: string) => void }) {
  const [leadId, setLeadId] = useState<number | null>(fixedLead?.id ?? null)
  const lead = leadId === null ? undefined : store.findLead(leadId)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<number[]>(() => (propertyId ? [propertyId] : fixedLead ? store.matchesFor(fixedLead).filter((match) => match.property.status === 'available').slice(0, 3).map((match) => match.property.id) : []))
  const property = propertyId ? store.findProperty(propertyId) : undefined

  if (!lead) {
    const term = query.trim().toLowerCase()
    const candidates = store.openLeads
      .filter((item) => !term || `${item.name} ${item.need} ${item.locality}`.toLowerCase().includes(term))
      .map((item) => ({ lead: item, match: store.matchesFor(item).find((match) => match.property.id === propertyId) }))
      .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0))
    return (
      <Dialog label={`Share ${property?.name ?? 'listing'}`} variant="sheet" onClose={onClose} className="assign-dialog share-dialog">
        <header className="assign-head">
          <div><h2>Share {property?.name}</h2><p>Who should get it? Best-fitting buyers first.</p></div>
          <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        <label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" aria-label="Search leads" autoFocus /></label>
        <div className="assign-list dialog-scroll">
          {candidates.map(({ lead: item, match }) => (
            <button key={item.id} onClick={() => setLeadId(item.id)}>
              <LeadAvatar lead={item} size="sm" />
              <span><strong>{item.name}</strong><small>{item.need} · {item.budget}</small></span>
              <em className={match ? 'share-fit' : ''}>{match ? match.reasons.join(' · ') : 'Not a close match'}</em>
            </button>
          ))}
          {candidates.length === 0 && <p className="share-empty">No leads match “{query}”.</p>}
        </div>
      </Dialog>
    )
  }

  const matches = store.matchesFor(lead)
  const shares = store.sharesFor(lead.id)
  const reasonsFor = (id: number) => matches.find((match) => match.property.id === id)?.reasons
  const listed = showAll
    ? store.properties.filter((item) => item.status !== 'sold')
    : [...new Set([...selected, ...matches.map((match) => match.property.id)])].map(store.findProperty).filter((item): item is Property => !!item)
  const picked = selected.map(store.findProperty).filter((item): item is Property => !!item)
  const closed = store.serviceWindowClosed(lead)
  const text = closed ? fillTemplate(SHORTLIST_TEMPLATE, { name: firstName(lead.name), property: picked[0]?.name }) : shareText(lead, picked)

  function send() {
    if (!lead || picked.length === 0) return
    store.shareProperties(lead.id, selected, text, closed ? SHORTLIST_TEMPLATE.label : undefined)
    onSent(`${picked.length === 1 ? picked[0].name : `${picked.length} homes`} shared with ${lead.name}`)
  }
  const toggle = (id: number) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])

  return (
    <Dialog label={`Share homes with ${lead.name}`} variant="sheet" onClose={onClose} className="assign-dialog share-dialog">
      <header className="assign-head">
        <div><h2>Share homes with {firstName(lead.name)}</h2><p>{lead.need} · {lead.budget}</p></div>
        <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <div className="dialog-scroll share-body">
        <div className="share-list-head">
          <span className="eyebrow">{showAll ? 'All available homes' : `Matches for this lead · ${matches.length}`}</span>
          <button className="btn btn-soft share-toggle" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show matches' : 'Show all homes'}</button>
        </div>
        <ul className="share-list">
          {listed.map((item) => {
            const reasons = reasonsFor(item.id)
            const share = shares.find((entry) => entry.propertyId === item.id)
            const on = selected.includes(item.id)
            return (
              <li key={item.id}>
                <button className={on ? 'selected' : ''} aria-pressed={on} onClick={() => toggle(item.id)}>
                  <span className="share-check">{on && <Icon name="check" size={12} />}</span>
                  <PropertyPhoto property={item} />
                  <span className="share-info">
                    <strong>{item.name}</strong>
                    <small>{bedroomsLabel(item)} · {item.locality} · {priceLabel(item)}</small>
                    <span className="share-reasons">
                      {(reasons ?? ['Not a close match']).map((reason) => <i key={reason} className={reason === 'On hold' || reason.includes('over budget') || !reasons ? 'weak' : ''}>{reason}</i>)}
                      {share && <i className="sent">{share.seen ? `Seen · sent ${share.at}` : `Sent ${share.at}`}</i>}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {listed.length === 0 && <li className="share-empty">No close matches. Try “Show all homes”.</li>}
        </ul>

        <span className="eyebrow">WhatsApp preview{closed ? ' · sent as a template (outside the 24-hour window)' : ''}</span>
        <div className="share-preview">
          {picked.length === 0
            ? <p className="share-empty">Tick at least one home.</p>
            : <div className="share-bubble">
                {closed && <span className="share-bubble-tag">Template · {SHORTLIST_TEMPLATE.label}</span>}
                {text}
                <div className="share-preview-cards">{picked.map((item) => <PropertyCard key={item.id} property={item} />)}</div>
              </div>}
        </div>
      </div>
      <footer className="share-footer">
        {!fixedLead && <button className="btn btn-secondary" onClick={() => setLeadId(null)}><Icon name="back" size={16} /> Change lead</button>}
        <button className="btn btn-success assign-confirm" disabled={picked.length === 0} onClick={send}><Icon name="whatsapp" size={16} /> {picked.length > 1 ? `Send ${picked.length} homes` : 'Send on WhatsApp'}</button>
      </footer>
    </Dialog>
  )
}
