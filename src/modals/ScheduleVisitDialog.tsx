import { useState, type FormEvent } from 'react'
import { PROPERTIES, matchPropertyForLead, type Lead } from '../data/demo'
import { shortName } from '../data/team'
import { VISIT_TIME_SLOTS } from '../data/visits'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { dayLabel, daysUntilSaturday } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'

const DAY_CHOICES = [0, 1, 2, 3, 4, 5, 6]

/** Book a site visit (spec §8.6): property, day, time and, for managers, which agent goes. */
export function ScheduleVisitDialog({ lead, store, onBooked, onClose }: { lead: Lead; store: DemoStore; onBooked: (confirmation: string) => void; onClose: () => void }) {
  const canChooseAgent = store.viewerCan('reassignLeads')
  const defaultAgent = lead.ownerId ?? store.viewer.id
  const [propertyId, setPropertyId] = useState(matchPropertyForLead(lead).id)
  const [day, setDay] = useState(daysUntilSaturday() || 1)
  const [time, setTime] = useState<string>('11:30 AM')
  const [agentId, setAgentId] = useState(defaultAgent)
  const agents = store.members.filter((person) => person.status === 'active' && person.roles.includes('sales'))

  function submit(event: FormEvent) {
    event.preventDefault()
    onBooked(store.scheduleVisit(lead.id, { day, time, propertyId, agentId }))
  }

  return (
    <Dialog label={`Schedule a visit with ${lead.name}`} onClose={onClose} className="add-lead">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Site visit</span>
      <h2>Visit with {lead.name.split(' ')[0]}</h2>
      <p className="add-lead-intro">The buyer gets a WhatsApp confirmation. The agent checks in at the property on the day.</p>
      <form onSubmit={submit}>
        <label>Property
          <select value={propertyId} onChange={(event) => setPropertyId(Number(event.target.value))}>
            {PROPERTIES.map((property) => <option key={property.id} value={property.id}>{property.name} · {property.locality} · {property.price}</option>)}
          </select>
        </label>
        <div className="form-row">
          <label>Day
            <select value={day} onChange={(event) => setDay(Number(event.target.value))}>
              {DAY_CHOICES.map((offset) => <option key={offset} value={offset}>{dayLabel(offset)}</option>)}
            </select>
          </label>
          <label>Time
            <select value={time} onChange={(event) => setTime(event.target.value)}>{VISIT_TIME_SLOTS.map((slot) => <option key={slot}>{slot}</option>)}</select>
          </label>
        </div>
        <label>Agent
          <select value={agentId} disabled={!canChooseAgent} onChange={(event) => setAgentId(event.target.value)}>
            {[...new Set([defaultAgent, ...agents.map((person) => person.id)])].map((id) => {
              const person = store.findMember(id)
              return person ? <option key={id} value={id}>{shortName(person.name)}{id === lead.ownerId ? ' (lead owner)' : ''}</option> : null
            })}
          </select>
        </label>
        <button className="btn btn-primary btn-block add-lead-submit">Book visit <Icon name="calendar" /></button>
      </form>
    </Dialog>
  )
}
