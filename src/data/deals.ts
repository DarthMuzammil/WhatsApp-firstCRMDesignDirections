// Deal closing (spec §8.10): offers, documents, commission split, won/lost.

export type DealDocs = { kyc: boolean; token: boolean; agreement: boolean }
export type SplitShare = { memberId: string; pct: number }
export type OfferBy = 'buyer' | 'owner'
/** One step of the negotiation. `day` is days from today (0 = today, −3 = three days ago), like visits and leave. */
export type Offer = { id: number; by: OfferBy; amountCr: number; day: number }
export type Deal = {
  /** Asking price, ₹ crore. */
  askedCr: number
  /** Buyer offers and owner counter-offers, oldest first. */
  offers: Offer[]
  agreedCr?: number
  /** Token (booking) amount, ₹ lakh, and the day it was paid. */
  tokenL?: number
  tokenDay?: number
  /** Target day for signing the sale agreement (usually in the future). */
  agreementDay?: number
  docs: DealDocs
  split: SplitShare[]
}
export type Closure = { result: 'won' | 'lost'; reason?: string }

export const OFFER_BY_LABELS: Record<OfferBy, string> = { buyer: 'Buyer offered', owner: 'Owner countered' }
/** An open deal whose latest offer is older than this gets a "No new offer in N days" flag (spec §8.10). */
export const STALE_OFFER_DAYS = 7

/** The most recent offer, optionally only the buyer's or the owner's. */
export function latestOffer(deal: Deal | undefined, by?: OfferBy): Offer | undefined {
  return deal?.offers.filter((offer) => !by || offer.by === by).reduce<Offer | undefined>((latest, offer) => (!latest || offer.day >= latest.day ? offer : latest), undefined)
}

/** Days since the latest offer when that is more than STALE_OFFER_DAYS, else null. */
export function staleOfferDays(deal: Deal | undefined): number | null {
  const latest = latestOffer(deal)
  return latest && -latest.day > STALE_OFFER_DAYS ? -latest.day : null
}

export const DOC_LABELS: Record<keyof DealDocs, string> = { kyc: 'Buyer KYC', token: 'Token receipt', agreement: 'Sale agreement' }

export const LOST_REASON_OPTIONS = ['Bought through another broker', 'Budget too low for the area', 'Stopped responding', 'Loan not approved', 'Changed plans', 'Other'] as const

/**
 * Deals already in negotiation when the demo starts. Rohan & Meera have gone quiet (last offer 9 days ago,
 * so the stale flag shows); Lavanya is close to agreeing at ₹4 Cr.
 */
export const SEED_DEALS: Record<number, Deal> = {
  2: {
    askedCr: 3.4,
    offers: [{ id: 1, by: 'buyer', amountCr: 3.1, day: -14 }, { id: 2, by: 'owner', amountCr: 3.35, day: -11 }, { id: 3, by: 'buyer', amountCr: 3.2, day: -9 }],
    docs: { kyc: true, token: false, agreement: false }, split: [{ memberId: 'm-vivek', pct: 100 }],
  },
  8: {
    askedCr: 4.2,
    offers: [{ id: 4, by: 'buyer', amountCr: 3.9, day: -5 }, { id: 5, by: 'owner', amountCr: 4.1, day: -3 }, { id: 6, by: 'buyer', amountCr: 4.0, day: -2 }],
    agreementDay: 7,
    docs: { kyc: true, token: false, agreement: false }, split: [{ memberId: 'm-manoj', pct: 100 }],
  },
}
