import { useState } from 'react'
import { LOCALITIES, PROPERTY_STATUS_LABELS, areaLabel, bedroomsLabel, priceLabel, type Property, type PropertyStatus } from '../data/inventory'
import { shortName } from '../data/team'
import { Icon } from '../components/Icon'
import { PropertyPhoto } from '../components/PropertyCard'
import { PropertyDialog } from '../modals/PropertyDialog'
import { ShareDialog } from '../modals/ShareDialog'
import type { DemoStore } from '../state/useDemoStore'
import './PropertiesView.css'

type StatusFilter = 'all' | PropertyStatus

/**
 * Inventory (spec §8.11): listings with availability, listing agent and owner contact (masked unless allowed).
 * Add / Edit for people with `manageInventory`; Share picks a lead, previews the WhatsApp message and sends it.
 * Each card says who pinned the location; an unpinned listing shows a notice (and a shortcut for whoever may pin it).
 */
export function PropertiesView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const [locality, setLocality] = useState('All')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editing, setEditing] = useState<Property | 'new' | null>(null)
  // Opened from "Pin it now": the edit dialog starts with the map showing (spec §8.18).
  const [focusPin, setFocusPin] = useState(false)
  const [sharing, setSharing] = useState<number | null>(null)
  const canManage = store.viewerCan('manageInventory')
  const localities = ['All', ...LOCALITIES.map((item) => item.name).filter((name) => store.properties.some((property) => property.locality === name))]
  const visible = store.properties.filter((property) => (locality === 'All' || property.locality === locality) && (status === 'all' || property.status === status))
  const count = (value: PropertyStatus) => store.properties.filter((property) => property.status === value).length

  return (
    <section className="properties-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Inventory</span>
          <h1>Homes worth sharing</h1>
          <p>{count('available')} available · {count('hold')} on hold · {count('sold')} sold</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> Add property</button>}
      </header>

      <div className="properties-filters">
        <div className="chip-row filter-chips locality-chips" role="group" aria-label="Filter by locality">
          {localities.map((option) => (
            <button key={option} className={`chip ${locality === option ? 'active' : ''}`} aria-pressed={locality === option} onClick={() => setLocality(option)}>{option}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Filter by availability">
          {(['all', 'available', 'hold', 'sold'] as StatusFilter[]).map((option) => (
            <button key={option} className={status === option ? 'active' : ''} aria-pressed={status === option} onClick={() => setStatus(option)}>{option === 'all' ? 'All' : PROPERTY_STATUS_LABELS[option]}</button>
          ))}
        </div>
      </div>

      <div className="property-grid">
        {visible.map((property) => {
          const saved = store.savedPropertyIds.includes(property.id)
          const agent = store.findMember(property.listingAgentId)
          const setter = property.pin ? store.findMember(property.pin.setById) : undefined
          const canPin = !property.pin && store.canPinProperty(property)
          return (
            <article key={property.id} className={`listing listing-${property.status}`}>
              <div className="listing-image">
                <PropertyPhoto property={property} />
                <span className={`listing-status ${property.status}`}>{PROPERTY_STATUS_LABELS[property.status]}</span>
                <button className={saved ? 'saved' : ''} aria-pressed={saved} aria-label={saved ? `Remove ${property.name} from saved homes` : `Save ${property.name}`} onClick={() => store.toggleSavedProperty(property.id)}>
                  <Icon name="bookmark" size={17} />
                </button>
              </div>
              <div className="listing-copy">
                <span>{property.locality}, {property.city}{property.addedInDemo ? ' · Added today' : ''}</span>
                <h2>{property.name}</h2>
                <p><Icon name="bed" size={16} />{bedroomsLabel(property)}<Icon name="area" size={16} />{areaLabel(property)}</p>
                <dl className="listing-people">
                  <div><dt>Listed by</dt><dd>{agent ? shortName(agent.name) : '—'}</dd></div>
                  <div><dt>Owner</dt><dd>{property.ownerName} · {store.ownerPhone(property)}</dd></div>
                  <div><dt>Address</dt><dd className="listing-address">{property.address}</dd></div>
                  {property.pin && <div><dt>Location</dt><dd className="listing-pin"><Icon name="pin" size={13} />{property.pin.source === 'device' ? 'Pinned on site' : 'Pinned on the map'} by {setter ? shortName(setter.name) : 'the team'} · {property.pin.setAt}</dd></div>}
                </dl>
                {!property.pin && (canPin
                  ? <button className="listing-pin-notice is-action" onClick={() => { setFocusPin(true); setEditing(property) }}><Icon name="alert" size={16} /><span><strong>Location not set</strong> · visits here can’t be verified</span><b>Pin it now <Icon name="chevron" size={14} /></b></button>
                  : <p className="listing-pin-notice"><Icon name="alert" size={16} /><span><strong>Location not set</strong> · {agent ? shortName(agent.name) : 'the listing agent'} or a Manager needs to pin it</span></p>)}
                <footer>
                  <strong>{priceLabel(property)}</strong>
                  <span className="listing-buttons">
                    {canManage && <button className="icon-button bordered" aria-label={`Edit ${property.name}`} onClick={() => setEditing(property)}><Icon name="edit" size={16} /></button>}
                    <button className="btn btn-success" disabled={property.status === 'sold'} onClick={() => setSharing(property.id)}><Icon name="whatsapp" size={16} /> Share</button>
                  </span>
                </footer>
              </div>
            </article>
          )
        })}
        {visible.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="home" /></span><h3>No homes match these filters</h3><p>Try another locality or availability.</p></div>}
      </div>

      {editing && <PropertyDialog store={store} property={editing === 'new' ? undefined : editing} focusPin={focusPin} onClose={() => { setEditing(null); setFocusPin(false) }} onSaved={(message) => { setEditing(null); setFocusPin(false); notify(message) }} />}
      {sharing !== null && <ShareDialog store={store} propertyId={sharing} onClose={() => setSharing(null)} onSent={(message) => { setSharing(null); notify(message) }} />}
    </section>
  )
}
