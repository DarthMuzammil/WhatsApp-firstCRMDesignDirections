import { useState } from 'react'
import { PROPERTIES } from '../data/demo'
import { Icon } from '../components/Icon'
import type { DemoStore } from '../state/useDemoStore'
import './PropertiesView.css'

const LOCALITY_FILTERS = ['All', ...PROPERTIES.map((property) => property.locality)]

/** Listings the broker can save or share on WhatsApp. */
export function PropertiesView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const [locality, setLocality] = useState('All')
  const visible = PROPERTIES.filter((property) => locality === 'All' || property.locality === locality)

  return (
    <section className="properties-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Curated inventory</span>
          <h1>Homes worth sharing</h1>
          <p>{PROPERTIES.length} active Bengaluru listings · Updated today</p>
        </div>
      </header>

      <div className="locality-chips" role="group" aria-label="Filter by locality">
        {LOCALITY_FILTERS.map((option) => (
          <button key={option} className={locality === option ? 'active' : ''} aria-pressed={locality === option} onClick={() => setLocality(option)}>{option}</button>
        ))}
      </div>

      <div className="property-grid">
        {visible.map((property) => {
          const saved = store.savedPropertyIds.includes(property.id)
          return (
            <article key={property.id} className="listing">
              <div className="listing-image">
                <img src={property.image} alt={`${property.name} interior`} />
                <span>For sale</span>
                <button className={saved ? 'saved' : ''} aria-pressed={saved} aria-label={saved ? `Remove ${property.name} from saved homes` : `Save ${property.name}`} onClick={() => store.toggleSavedProperty(property.id)}>
                  <Icon name="bookmark" size={17} />
                </button>
              </div>
              <div className="listing-copy">
                <span>{property.locality}, {property.city}</span>
                <h2>{property.name}</h2>
                <p><Icon name="bed" size={16} />{property.bedrooms}<Icon name="area" size={16} />{property.area}</p>
                <footer>
                  <strong>{property.price}</strong>
                  <button className="btn btn-success" onClick={() => notify(`${property.name} shared on WhatsApp`)}><Icon name="whatsapp" size={16} /> Share</button>
                </footer>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
