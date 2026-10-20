import type { Property } from '../data/demo'
import './PropertyCard.css'

/**
 * Compact property card.
 * - `row`: thumbnail on the left (used inside chat bubbles)
 * - `stacked`: full-width image on top (used in the lead detail panel)
 */
export function PropertyCard({ property, layout = 'row' }: { property: Property; layout?: 'row' | 'stacked' }) {
  return (
    <div className={`property-card property-card-${layout}`}>
      <img src={property.image} alt={`${property.name} interior`} />
      <div>
        <strong>{property.name}</strong>
        <span>{property.bedrooms} · {property.locality}, {property.city}</span>
        <b>{property.price}</b>
      </div>
    </div>
  )
}
