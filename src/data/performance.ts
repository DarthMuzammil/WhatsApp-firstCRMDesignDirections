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
  'Broker groups': { visits: 9, deals: 1 },
}

/** Days each seeded lead has been in its current stage, for the "stuck leads" list. */
export const DAYS_IN_STAGE: Record<number, number> = { 1: 3, 2: 9, 3: 12, 4: 2, 5: 4, 6: 8, 7: 0, 8: 5, 9: 11, 10: 0, 11: 1, 12: 6 }
export const STUCK_AFTER_DAYS = 7

/** How many times each property was shared on WhatsApp this month (🧱). */
export const PROPERTY_SHARES: Record<number, number> = { 1: 46, 2: 31, 3: 38, 4: 22, 5: 27, 6: 19, 7: 12, 8: 34 }

// ---------- Owner analytics shortlist (spec §8.19) ----------

/** Sources the Speed to lead table compares, in display order (the ones that produce enquiries with a first reply). */
export const SPEED_SOURCES = ['99acres', 'MagicBricks', 'Housing', 'Facebook ads', 'WhatsApp', 'Walk-in', 'Referral'] as const
export const PORTAL_SOURCES: readonly string[] = ['99acres', 'MagicBricks', 'Housing']
/** A first reply within this many minutes is "fast"; RESPONSE_SLA_MINUTES (15) is the red line. */
export const SPEED_TARGET_MIN = 5
const SOURCE_SPEED_FACTOR: Record<string, number> = { '99acres': 1.3, MagicBricks: 1.5, Housing: 1.8, 'Facebook ads': 1.2, WhatsApp: 0.6, 'Walk-in': 0.45, Referral: 0.8 }

/**
 * Minutes to the first human reply for each lead this person handled from a source this month (🧱 generated,
 * consistent with their median first reply; [] = no leads from that source). The view adds live demo replies.
 */
export function firstReplySamples(memberId: string, source: string, period: Period): number[] {
  const base = monthStats(memberId, period).medianResponseMin
  const salt = (period === 'this-month' ? 100 : 200) + Math.max(0, SPEED_SOURCES.indexOf(source as (typeof SPEED_SOURCES)[number])) * 7
  const r = (n: number) => noise(memberId, salt + n)
  if (r(0) < 0.22) return []
  const count = 2 + Math.round(r(1) * 5)
  const factor = SOURCE_SPEED_FACTOR[source] ?? 1
  return Array.from({ length: count }, (_, index) => Math.max(1, Math.round(base * factor * (0.55 + r(2 + index) * 0.9))))
}

/** Median of a list, or null when empty. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/** Chats that slipped past WhatsApp's 24-hour window this month and needed a paid template to re-open (🧱). */
export const WINDOW_TEMPLATES_THIS_MONTH = { chats: 38, rupees: 41 }

/**
 * Days since anyone on the team last touched a seeded lead (message, note, follow-up or visit), for "Leads at risk" (🧱).
 * Only quieter leads from the wider book are listed, so the scripted twelve keep their story. Any demo action resets it.
 */
export const DAYS_SINCE_TOUCH: Record<number, number> = { 108: 12, 110: 9, 114: 11, 116: 14, 119: 8, 121: 10, 123: 9, 125: 8, 130: 8, 132: 7 }
export const QUIET_AFTER_DAYS = 7

/** Per-listing funnel this month (🧱): visits booked, verified check-ins and deals closed. Live visits and won deals are added. */
export const PROPERTY_FUNNEL: Record<number, { booked: number; verified: number; deals: number }> = {
  1: { booked: 14, verified: 12, deals: 3 },
  2: { booked: 9, verified: 8, deals: 1 },
  3: { booked: 11, verified: 9, deals: 2 },
  4: { booked: 7, verified: 6, deals: 2 },
  5: { booked: 10, verified: 8, deals: 0 },
  6: { booked: 8, verified: 6, deals: 1 },
  7: { booked: 6, verified: 6, deals: 0 },
  8: { booked: 5, verified: 5, deals: 2 },
}
/** A listing with this many verified visits and no deal gets a "Retire?" nudge. */
export const RETIRE_AFTER_VISITS = 6
