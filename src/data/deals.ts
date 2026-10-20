// Deal closing (spec §8.10): offers, documents, commission split, won/lost.

export type DealDocs = { kyc: boolean; token: boolean; agreement: boolean }
export type SplitShare = { memberId: string; pct: number }
export type Deal = {
  /** Asking price, ₹ crore. */
  askedCr: number
  offeredCr?: number
  agreedCr?: number
  /** Token (booking) amount, ₹ lakh. */
  tokenL?: number
  docs: DealDocs
  split: SplitShare[]
}
export type Closure = { result: 'won' | 'lost'; reason?: string }

export const DOC_LABELS: Record<keyof DealDocs, string> = { kyc: 'Buyer KYC', token: 'Token receipt', agreement: 'Sale agreement' }

export const LOST_REASON_OPTIONS = ['Bought through another broker', 'Budget too low for the area', 'Stopped responding', 'Loan not approved', 'Changed plans', 'Other'] as const

/** Deals already in negotiation when the demo starts. */
export const SEED_DEALS: Record<number, Deal> = {
  2: { askedCr: 3.4, offeredCr: 3.2, docs: { kyc: true, token: false, agreement: false }, split: [{ memberId: 'm-vivek', pct: 100 }] },
  8: { askedCr: 4.2, offeredCr: 4.0, docs: { kyc: true, token: false, agreement: false }, split: [{ memberId: 'm-manoj', pct: 100 }] },
}
