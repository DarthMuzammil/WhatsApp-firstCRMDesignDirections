import { useState } from 'react'
import type { Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useEscapeKey } from '../lib/useEscapeKey'
import './CallPicker.css'

/** Choose which lead to call. A centred dialog on desktop, a bottom sheet on phones. */
export function CallPicker({ leads, onClose, onChoose }: { leads: Lead[]; onClose: () => void; onChoose: (lead: Lead) => void }) {
  const [search, setSearch] = useState('')
  useEscapeKey(onClose)
  const matches = leads.filter((lead) => `${lead.name} ${lead.need} ${lead.locality} ${lead.budget}`.toLowerCase().includes(search.trim().toLowerCase()))
  return (
    <div className="picker-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="call-picker" role="dialog" aria-modal="true" aria-label="Choose someone to call">
        <div className="picker-handle" />
        <header>
          <div><span className="eyebrow">New internet call</span><h2>Who would you like to call?</h2><p>The call and its recording are saved to the buyer’s timeline.</p></div>
          <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        <label className="search-field"><Icon name="search" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, area or budget" aria-label="Search leads" /></label>
        {!search && <span className="eyebrow picker-section">Recent conversations</span>}
        <div className="contact-list">
          {matches.map((lead) => (
            <button key={lead.id} onClick={() => onChoose(lead)}>
              <LeadAvatar lead={lead} />
              <span><strong>{lead.name}</strong><small>{lead.need} · {lead.budget}</small></span>
              <span className="contact-call"><Icon name="phone" /></span>
            </button>
          ))}
          {matches.length === 0 && <div className="empty-state"><span><Icon name="search" /></span><h3>No matching lead</h3><p>Try a name, Bengaluru locality or budget.</p></div>}
        </div>
        <footer><Icon name="whatsapp" /><span>Calls use the number saved on the lead. Your personal number stays private.</span></footer>
      </section>
    </div>
  )
}
