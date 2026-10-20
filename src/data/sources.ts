// Where leads come from (spec §8.3). Connection status, weekly numbers and arrivals are simulated.
import type { LeadSeed } from './demo'
import type { TeamId } from './team'

export type SourceKind = 'Portal' | 'Ads' | 'Messaging' | 'Offline'

export type LeadSource = {
  /** Must match `LeadSeed.source` exactly. */
  name: string
  kind: SourceKind
  /** Seed weekly figures 🧱 (the prototype has no history to compute them from). */
  leadsThisWeek: number
  avgResponseMin: number
  defaultCostPerLead: number
  defaultTeamId: TeamId
  /** Can the demo simulate a lead arriving from here? (Referrals and walk-ins are entered by hand.) */
  canSimulate: boolean
  /** Status for sources captured by hand rather than connected ("Manual capture"). */
  manual?: string
}

export const LEAD_SOURCES: LeadSource[] = [
  { name: '99acres', kind: 'Portal', leadsThisWeek: 38, avgResponseMin: 6, defaultCostPerLead: 450, defaultTeamId: 'indiranagar', canSimulate: true },
  { name: 'MagicBricks', kind: 'Portal', leadsThisWeek: 27, avgResponseMin: 9, defaultCostPerLead: 400, defaultTeamId: 'hsr', canSimulate: true },
  { name: 'Housing', kind: 'Portal', leadsThisWeek: 21, avgResponseMin: 11, defaultCostPerLead: 350, defaultTeamId: 'whitefield', canSimulate: true },
  { name: 'Facebook ads', kind: 'Ads', leadsThisWeek: 44, avgResponseMin: 14, defaultCostPerLead: 180, defaultTeamId: 'hsr', canSimulate: true },
  { name: 'WhatsApp', kind: 'Messaging', leadsThisWeek: 19, avgResponseMin: 3, defaultCostPerLead: 0, defaultTeamId: 'whitefield', canSimulate: true },
  { name: 'Walk-in', kind: 'Offline', leadsThisWeek: 6, avgResponseMin: 0, defaultCostPerLead: 0, defaultTeamId: 'indiranagar', canSimulate: false },
  { name: 'Referral', kind: 'Offline', leadsThisWeek: 9, avgResponseMin: 0, defaultCostPerLead: 0, defaultTeamId: 'whitefield', canSimulate: false },
  { name: 'Quick capture', kind: 'Offline', leadsThisWeek: 4, avgResponseMin: 0, defaultCostPerLead: 0, defaultTeamId: 'indiranagar', canSimulate: false },
  // M14: requirements forwarded from brokers' WhatsApp groups and pasted into Add lead (spec §8.17.4).
  { name: 'Broker groups', kind: 'Messaging', leadsThisWeek: 7, avgResponseMin: 0, defaultCostPerLead: 0, defaultTeamId: 'hsr', canSimulate: false, manual: 'Manual capture' },
]

/** Buyers used, in turn, when the demo simulates an incoming lead. */
export const INCOMING_LEAD_TEMPLATES: Pick<LeadSeed, 'name' | 'initials' | 'need' | 'budget' | 'budgetCr' | 'locality' | 'message' | 'temp' | 'color' | 'moveIn' | 'mustHave' | 'phone'>[] = [
  { name: 'Meera Iyer', initials: 'MI', need: '2 BHK in HSR Layout', budget: '₹1.3–1.5 Cr', budgetCr: 1.4, locality: 'HSR Layout', message: 'Hi, saw your listing. Can I visit this weekend?', temp: 'New', color: 'violet', moveIn: 'Within 3 months', mustHave: 'To confirm', phone: '+91 98451 77320' },
  { name: 'Arvind Rao', initials: 'AR', need: '3 BHK in Indiranagar', budget: '₹2.2–2.5 Cr', budgetCr: 2.35, locality: 'Indiranagar', message: 'Is the 3 BHK near CMH Road still available?', temp: 'New', color: 'blue', moveIn: 'To confirm', mustHave: 'To confirm', phone: '+91 99010 42876' },
  { name: 'Sunita Reddy', initials: 'SR', need: 'Villa in Whitefield', budget: '₹3.6–4 Cr', budgetCr: 3.8, locality: 'Whitefield', message: 'Looking for a ready villa, gated community. Budget around ₹3.8 Cr.', temp: 'New', color: 'gold', moveIn: 'Within 6 months', mustHave: 'Gated community', phone: '+91 97393 15560' },
  { name: 'Karan Malhotra', initials: 'KM', need: '2 BHK in Whitefield', budget: '₹0.9–1 Cr', budgetCr: 0.95, locality: 'Whitefield', message: 'Need a 2 BHK near ITPL for my parents.', temp: 'New', color: 'coral', moveIn: 'Within 3 months', mustHave: 'Lift · Near hospital', phone: '+91 98806 23194' },
  { name: 'Fatima Sheikh', initials: 'FS', need: '3 BHK in HSR Layout', budget: '₹1.8–2 Cr', budgetCr: 1.9, locality: 'HSR Layout', message: 'Hi! Any 3 BHK close to Agara Lake?', temp: 'New', color: 'violet', moveIn: 'To confirm', mustHave: 'To confirm', phone: '+91 96631 70482' },
  { name: 'Harish Gowda', initials: 'HG', need: '4 BHK in Indiranagar', budget: '₹3.4–3.8 Cr', budgetCr: 3.6, locality: 'Indiranagar', message: 'Interested in independent floors, 4 BHK.', temp: 'New', color: 'blue', moveIn: 'Within 4 months', mustHave: 'Independent floor', phone: '+91 99459 88013' },
]

export function findSource(name: string): LeadSource | undefined {
  return LEAD_SOURCES.find((source) => source.name === name)
}
