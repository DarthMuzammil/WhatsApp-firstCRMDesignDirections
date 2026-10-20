import { bedroomsLabel, priceLabel, type Property } from '../data/inventory'
import { Icon } from './Icon'
import './PropertyCard.css'

/** The listing's photo, or a placeholder for listings added in the demo (they have no photo). */
export function PropertyPhoto({ property }: { property: Property }) {
  return property.image
    ? <img className="property-photo" src={property.image} alt={`${property.name} interior`} />
    : <span className="property-photo property-photo-empty" role="img" aria-label={`${property.name}: no photo yet`}><Icon name="home" size={24} /></span>
}

/**
 * Compact property card.
 * - `row`: thumbnail on the left (used inside chat bubbles)
 * - `stacked`: full-width image on top (used in the lead detail panel)
 */
export function PropertyCard({ property, layout = 'row' }: { property: Property; layout?: 'row' | 'stacked' }) {
  return (
    <div className={`property-card property-card-${layout}`}>
      <PropertyPhoto property={property} />
      <div>
        <strong>{property.name}</strong>
        <span>{bedroomsLabel(property)} · {property.locality}, {property.city}</span>
        <b>{priceLabel(property)}</b>
      </div>
    </div>
  )
}
