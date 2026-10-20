// Inventory (spec §8.11): listings with availability, a listing agent and the owner's contact,
// plus matching a lead's brief to listings with plain-language reasons.
import { parseBudget, type LeadSeed } from './demo'

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
  /** Address coordinates, used to verify visit check-ins (spec §8.6). */
  lat: number
  lng: number
  status: PropertyStatus
  listingAgentId: string
  ownerName: string
  ownerPhone: string
  addedInDemo?: boolean
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = { available: 'Available', hold: 'On hold', sold: 'Sold' }
export const PROPERTY_KINDS: PropertyKind[] = ['Apartment', 'Villa']

/** Localities the brokerage lists in, with a centre point used as the address of listings added in the demo. */
export const LOCALITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.75 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
]

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`

export const SEED_PROPERTIES: Property[] = [
  { id: 1, name: 'The Courtyard House', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 2.65, areaSqft: 1865, lat: 12.9784, lng: 77.6408, image: photo('1745301558339-44eb3217d5da'), status: 'available', listingAgentId: 'm-priya', ownerName: 'Ramesh Iyer', ownerPhone: '+91 98861 40123' },
  { id: 2, name: 'Windermere Residences', locality: 'Whitefield', city: 'Bengaluru', kind: 'Villa', bhk: 4, priceCr: 3.4, areaSqft: 2840, lat: 12.9757, lng: 77.7262, image: photo('1641356916420-a4b06a824bb7'), status: 'available', listingAgentId: 'm-vivek', ownerName: 'Anita Desai', ownerPhone: '+91 99001 72244' },
  { id: 3, name: 'Lakeview Terraces', locality: 'HSR Layout', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.48, areaSqft: 1260, lat: 12.9081, lng: 77.6476, image: photo('1686569860484-b0b79f5d7959'), status: 'available', listingAgentId: 'm-sneha', ownerName: 'Suresh Hegde', ownerPhone: '+91 97411 30876' },
  { id: 4, name: 'Palm Grove Villas', locality: 'Whitefield', city: 'Bengaluru', kind: 'Villa', bhk: 4, priceCr: 4.2, areaSqft: 3200, lat: 12.9698, lng: 77.7499, image: photo('1600596542815-ffad4c1539a9'), status: 'available', listingAgentId: 'm-manoj', ownerName: 'Mohan Rao', ownerPhone: '+91 98450 61290' },
  { id: 5, name: 'Indigo Heights', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.62, areaSqft: 1140, lat: 12.9719, lng: 77.6412, image: photo('1502672260266-1c1ef2d93688'), status: 'available', listingAgentId: 'm-aditya', ownerName: 'Fatima Sait', ownerPhone: '+91 99860 11457' },
  { id: 6, name: 'Maple Court', locality: 'HSR Layout', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 1.95, areaSqft: 1580, lat: 12.9116, lng: 77.6389, image: photo('1600607687939-ce8a6c25118c'), status: 'available', listingAgentId: 'm-rohit', ownerName: 'Vinod Shetty', ownerPhone: '+91 98800 23519' },
  { id: 7, name: 'Brookside Towers', locality: 'Whitefield', city: 'Bengaluru', kind: 'Apartment', bhk: 2, priceCr: 1.12, areaSqft: 1050, lat: 12.9855, lng: 77.731, image: photo('1522708323590-d24dbb6b0267'), status: 'hold', listingAgentId: 'm-ritu', ownerName: 'Leela Menon', ownerPhone: '+91 97390 44812' },
  { id: 8, name: 'Cedar Row', locality: 'Indiranagar', city: 'Bengaluru', kind: 'Apartment', bhk: 3, priceCr: 3.1, areaSqft: 1980, lat: 12.9784, lng: 77.638, image: photo('1560448204-e02f11c3d0e2'), status: 'sold', listingAgentId: 'm-kavya', ownerName: 'Prakash Jain', ownerPhone: '+91 98455 70931' },
]

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
    .sort((a, b) => b.score - a.score || a.property.id - b.property.id)
}
