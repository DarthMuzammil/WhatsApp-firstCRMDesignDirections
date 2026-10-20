// Inventory (spec §8.11): listings with availability, a listing agent and the owner's contact,
// plus matching a lead's brief to listings with plain-language reasons.
import { parseBudget, type LeadSeed } from './demo'
import { dayLabel } from '../lib/format'
import type { LatLng } from '../lib/location'

export type PropertyStatus = 'available' | 'hold' | 'sold'
export type PropertyKind = 'Apartment' | 'Villa'

export type Property = {
  id: number
  name: string
  locality: string
  city: string
  kind: PropertyKind
  bhk: number
  /** Asking price, ₹ crore. */
  priceCr: number
  areaSqft: number
  /** Photo URL. Listings added in the demo have none and show a placeholder. */
  image?: string
  /** Street address, as people read it. The pin, not the address, is what check-ins are measured from. */
  address: string
  /**
   * Where the building is, confirmed by a person (spec §8.18): a reading taken on site or a spot tapped on the map,
   * with who set it and when. Visit check-ins are verified against this; without it they can only be recorded unverified.
   */
  pin?: PropertyPin
  status: PropertyStatus
  listingAgentId: string
  ownerName: string
  ownerPhone: string
  addedInDemo?: boolean
}

export type PinSource = 'device' | 'map'
export type PropertyPin = LatLng & { source: PinSource; setById: string; setAt: string; accuracyM?: number }
export const PIN_SOURCE_LABELS: Record<PinSource, string> = { device: 'set on site', map: 'placed on the map' }

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = { available: 'Available', hold: 'On hold', sold: 'Sold' }
export const PROPERTY_KINDS: PropertyKind[] = ['Apartment', 'Villa']

/** Localities the brokerage lists in, with a centre point: where the demo map opens and where "Near client" pretends to be for unpinned listings. */
export const LOCALITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.75 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
]

/** The centre of a locality (falls back to the first one). */
export function localityCentre(name: string): LatLng {
  const found = LOCALITIES.find((item) => item.name === name) ?? LOCALITIES[0]
  return { lat: found.lat, lng: found.lng }
}

/** Seed pins were set on site by the listing agent some days ago. */
const seedPin = (lat: number, lng: number, setById: string, daysAgo: number): PropertyPin => ({ lat, lng, source: 'device', setById, setAt: dayLabel(-daysAgo), accuracyM: 14 })

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`

export const SEED_PROPERTIES: Property[] = [
  { id: 1, name: 'The Courtyard House', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 2.65, areaSqft: 1865, address: '12th Main Road, Indiranagar 2nd Stage', pin: seedPin(12.9784, 77.6408, 'm-priya', 21), image: photo('1745301558339-44eb3217d5da'), status: 'available', listingAgentId: 'm-priya', ownerName: 'Ramesh Iyer', ownerPhone: '+91 98861 40123' },
  { id: 2, name: 'Windermere Residences', locality: 'Whitefield', city: 'Bengaluru', kind: 'Villa', bhk: 4, priceCr: 3.4, areaSqft: 2840, address: 'Varthur Main Road, near Forum Shantiniketan, Whitefield', pin: seedPin(12.9757, 77.7262, 'm-vivek', 18), image: photo('1641356916420-a4b06a824bb7'), status: 'available', listingAgentId: 'm-vivek', ownerName: 'Anita Desai', ownerPhone: '+91 99001 72244' },
  { id: 3, name: 'Lakeview Terraces', locality: 'HSR Layout', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.48, areaSqft: 1260, address: '24th Main, HSR Layout Sector 2', pin: seedPin(12.9081, 77.6476, 'm-sneha', 30), image: photo('1686569860484-b0b79f5d7959'), status: 'available', listingAgentId: 'm-sneha', ownerName: 'Suresh Hegde', ownerPhone: '+91 97411 30876' },
  { id: 4, name: 'Palm Grove Villas', locality: 'Whitefield', city: 'Bengaluru', kind: 'Villa', bhk: 4, priceCr: 4.2, areaSqft: 3200, address: 'Palm Grove Road, off ITPL Main Road, Whitefield', pin: seedPin(12.9698, 77.7499, 'm-manoj', 12), image: photo('1600596542815-ffad4c1539a9'), status: 'available', listingAgentId: 'm-manoj', ownerName: 'Mohan Rao', ownerPhone: '+91 98450 61290' },
  { id: 5, name: 'Indigo Heights', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.62, areaSqft: 1140, address: 'CMH Road, Indiranagar', pin: seedPin(12.9719, 77.6412, 'm-aditya', 9), image: photo('1502672260266-1c1ef2d93688'), status: 'available', listingAgentId: 'm-aditya', ownerName: 'Fatima Sait', ownerPhone: '+91 99860 11457' },
  { id: 6, name: 'Maple Court', locality: 'HSR Layout', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 1.95, areaSqft: 1580, address: '27th Main, HSR Layout Sector 1', pin: seedPin(12.9116, 77.6389, 'm-rohit', 25), image: photo('1600607687939-ce8a6c25118c'), status: 'available', listingAgentId: 'm-rohit', ownerName: 'Vinod Shetty', ownerPhone: '+91 98800 23519' },
  { id: 7, name: 'Brookside Towers', locality: 'Whitefield', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.12, areaSqft: 1050, address: 'Hoodi Main Road, Whitefield', image: photo('1522708323590-d24dbb6b0267'), status: 'hold', listingAgentId: 'm-ritu', ownerName: 'Leela Menon', ownerPhone: '+91 97390 44812' },
  { id: 8, name: 'Cedar Row', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 3.1, areaSqft: 1980, address: 'Cedar Row, 100 Feet Road, Indiranagar', pin: seedPin(12.9784, 77.638, 'm-kavya', 40), image: photo('1560448204-e02f11c3d0e2'), status: 'sold', listingAgentId: 'm-kavya', ownerName: 'Prakash Jain', ownerPhone: '+91 98455 70931' },
]

/** Who set a pin, in words: "Pinned on site by Priya N. · Mon, 29 Sep". The caller supplies the name. */
export function pinLabel(pin: PropertyPin, setterName: string): string {
  return `${pin.source === 'device' ? 'Pinned on site' : 'Pinned on the map'} by ${setterName} · ${pin.setAt}`
}

/** 2.65 → "₹2.65 Cr" */
export function priceLabel(property: Pick<Property, 'priceCr'>): string {
  return `₹${property.priceCr.toFixed(2)} Cr`
}
/** "3 BHK" or "4 BHK villa" */
export function bedroomsLabel(property: Pick<Property, 'bhk' | 'kind'>): string {
  return property.kind === 'Villa' ? `${property.bhk} BHK villa` : `${property.bhk} BHK`
}
/** 1865 → "1,865 sq ft" */
export function areaLabel(property: Pick<Property, 'areaSqft'>): string {
  return `${property.areaSqft.toLocaleString('en-IN')} sq ft`
}

export type PropertyMatch = { property: Property; score: number; reasons: string[] }

/**
 * Listings that fit a lead's brief, best first, each with reasons ("Indiranagar · 3 BHK · In budget").
 * Sold listings never match. Score: locality 3, type 2 (1 for any apartment when no size is given), in budget 3
 * (1 if up to 10% over), on hold −1. A match needs 4+, so budget alone or size alone is not enough.
 */
export function matchesForLead(lead: Pick<LeadSeed, 'need' | 'budget' | 'locality' | 'localities'>, properties: Property[]): PropertyMatch[] {
  const localities = lead.localities?.length ? lead.localities : [lead.locality]
  const wantsVilla = /villa/i.test(lead.need)
  const wantedBhk = Number(lead.need.match(/(\d)\s*BHK/i)?.[1] ?? 0)
  const budget = parseBudget(lead.budget)
  const distanceFromBudget = (property: Property) => (budget ? Math.abs(property.priceCr - (budget.min + budget.max) / 2) : 0)
  return properties
    .filter((property) => property.status !== 'sold')
    .map((property) => {
      let score = 0
      const reasons: string[] = []
      if (localities.some((name) => name.toLowerCase() === property.locality.toLowerCase())) { score += 3; reasons.push(property.locality) }
      if (wantsVilla && property.kind === 'Villa') { score += 2; reasons.push('Villa') }
      else if (wantedBhk && property.bhk === wantedBhk) { score += 2; reasons.push(`${wantedBhk} BHK`) }
      else if (!wantsVilla && !wantedBhk && property.kind === 'Apartment') { score += 1; reasons.push('Apartment') }
      if (budget && property.priceCr >= budget.min * 0.8) {
        if (property.priceCr <= budget.max) { score += 3; reasons.push('In budget') }
        else if (property.priceCr <= budget.max * 1.1) { score += 1; reasons.push(`${Math.round((property.priceCr / budget.max - 1) * 100)}% over budget`) }
      }
      if (property.status === 'hold') { score -= 1; reasons.push('On hold') }
      return { property, score, reasons }
    })
    .filter((match) => match.score >= 4)
    // Equal scores: the price closest to the middle of the buyer's budget first.
    .sort((a, b) => b.score - a.score || distanceFromBudget(a.property) - distanceFromBudget(b.property) || a.property.id - b.property.id)
}
