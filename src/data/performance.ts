// Monthly performance (spec §8.9). The prototype has no history, so monthly figures are
// generated per person (🧱). Live figures (pipeline, visits today, attendance) come from the store.
import { SEED_MEMBERS } from './team'

export type Period = 'this-month' | 'last-month'

export type MonthStats = {
  leadsHandled: number
  visitsBooked: number
  /** Visits with a verified check-in. */
  visitsVerified: number
  dealsClosed: number
  /** Commission earned, ₹ lakh. */
  commissionL: number
  /** Median minutes to first reply. */
  medianResponseMin: number
  /** Share of follow-ups done on time, 0–100. */
  followUpsOnTime: number
}

export type Target = { dealsClosed: number; commissionL: number; visitsVerified: number }

/** Deterministic pseudo-random 0..1 from a person and a salt, so numbers are stable across reloads. */
function noise(memberId: string, salt: number): number {
  const seed = [...memberId].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), salt * 97)
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** Month figures for Sales and Pre-sales. Pre-sales qualify leads, so they close no deals themselves. */
export function monthStats(memberId: string, period: Period): MonthStats {
  const person = SEED_MEMBERS.find((item) => item.id === memberId)
  const presales = !!person?.roles.includes('presales')
  const salt = period === 'this-month' ? 1 : 2
  const r = (n: number) => noise(memberId, salt * 10 + n)
  const leadsHandled = presales ? 55 + Math.round(r(1) * 40) : 14 + Math.round(r(1) * 18)
  const visitsBooked = presales ? 0 : 6 + Math.round(r(2) * 12)
  const visitsVerified = Math.max(0, visitsBooked - Math.round(r(3) * 3))
  const dealsClosed = presales ? 0 : Math.round(r(4) * 4)
  return {
    leadsHandled,
    visitsBooked,
    visitsVerified,
    dealsClosed,
    commissionL: presales ? Math.round(leadsHandled * 0.04 * 10) / 10 : Math.round(dealsClosed * (3.2 + r(5) * 3.4) * 10) / 10,
    medianResponseMin: presales ? 2 + Math.round(r(6) * 4) : 4 + Math.round(r(6) * 22),
    followUpsOnTime: 62 + Math.round(r(7) * 35),
  }
}

/** Monthly targets set by managers (spec §8.9). */
export function targetFor(memberId: string): Target {
  const presales = !!SEED_MEMBERS.find((item) => item.id === memberId)?.roles.includes('presales')
  return presales ? { dealsClosed: 0, commissionL: 3, visitsVerified: 0 } : { dealsClosed: 3, commissionL: 12, visitsVerified: 12 }
}

/** Response-time spread for the whole team this month (🧱), ordered fastest → slowest. */
export const RESPONSE_BANDS = [
  { label: 'Under 5 min', leads: 212 },
  { label: '5–15 min', leads: 148 },
  { label: '15–60 min', leads: 74 },
  { label: '1–4 hours', leads: 31 },
  { label: 'Over 4 hours', leads: 12 },
]

/** Why deals were lost this month (🧱). */
export const LOST_REASONS = [
  { label: 'Bought through another broker', deals: 9 },
  { label: 'Budget too low for the area', deals: 7 },
  { label: 'Stopped responding', deals: 6 },
  { label: 'Loan not approved', deals: 3 },
  { label: 'Changed plans', deals: 2 },
]

/** Per-source conversion this month (🧱), used with live cost per lead for cost per deal. */
export const SOURCE_FUNNEL: Record<string, { visits: number; deals: number }> = {
  '99acres': { visits: 41, deals: 6 },
  MagicBricks: { visits: 28, deals: 3 },
  Housing: { visits: 19, deals: 2 },
  'Facebook ads': { visits: 22, deals: 2 },
  WhatsApp: { visits: 24, deals: 4 },
  'Walk-in': { visits: 15, deals: 3 },
  Referral: { visits: 26, deals: 6 },
  'Quick capture': { visits: 6, deals: 1 },
}

/** Days each seeded lead has been in its current stage, for the "stuck leads" list. */
export const DAYS_IN_STAGE: Record<number, number> = { 1: 3, 2: 9, 3: 12, 4: 2, 5: 4, 6: 8, 7: 0, 8: 5, 9: 11, 10: 0, 11: 1, 12: 6 }
export const STUCK_AFTER_DAYS = 7

/** How many times each property was shared on WhatsApp this month (🧱). */
export const PROPERTY_SHARES: Record<number, number> = { 1: 46, 2: 31, 3: 38 }
