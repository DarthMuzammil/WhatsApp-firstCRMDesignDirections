// Site visits and field check-ins (spec §8.6). `day` is relative to today: 0 = today, 1 = tomorrow, -1 = yesterday.
import type { TeamId } from './team'

export type VisitStatus = 'planned' | 'on-the-way' | 'checked-in' | 'completed' | 'no-show'
export type VisitStepKind = 'left-office' | 'check-in' | 'check-in-refused' | 'check-out'
/** One location reading taken when the agent tapped a button. */
export type VisitStep = { kind: VisitStepKind; at: string; distanceM: number; accuracyM: number; note?: string }
export type VisitResult = 'Liked it' | 'Not interested' | 'Wants another visit'
export type VisitOutcome = { result: VisitResult; feedback: string; nextStep: string }

export type Visit = {
  id: number
  leadId: number
  propertyId: number
  agentId: string
  day: number
  time: string
  status: VisitStatus
  steps: VisitStep[]
  outcome?: VisitOutcome
}

export type Office = { teamId: TeamId; name: string; address: string; lat: number; lng: number }

export const OFFICES: Office[] = [
  { teamId: 'indiranagar', name: 'Indiranagar office (HQ)', address: '100 Feet Road, Indiranagar', lat: 12.9719, lng: 77.6412 },
  { teamId: 'whitefield', name: 'Whitefield office', address: 'ITPL Main Road, Whitefield', lat: 12.9698, lng: 77.7500 },
  { teamId: 'hsr', name: 'HSR Layout office', address: '27th Main, HSR Layout Sector 1', lat: 12.9116, lng: 77.6389 },
]

export const VISIT_TIME_SLOTS = ['9:30 AM', '10:30 AM', '11:30 AM', '12:30 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'] as const
export const VISIT_RESULTS: VisitResult[] = ['Liked it', 'Wants another visit', 'Not interested']
export const CHECK_IN_RADIUS_OPTIONS = [100, 200, 300, 500] as const
/** Readings less precise than this are refused even if they look close enough (spec §8.0). */
export const MAX_ACCURACY_M = 100

export const SEED_VISITS: Visit[] = [
  { id: 1, leadId: 1, propertyId: 1, agentId: 'm-priya', day: 0, time: '11:30 AM', status: 'planned', steps: [] },
  { id: 2, leadId: 5, propertyId: 2, agentId: 'm-ritu', day: 0, time: '4:00 PM', status: 'planned', steps: [] },
  {
    id: 3, leadId: 8, propertyId: 2, agentId: 'm-manoj', day: 0, time: '9:30 AM', status: 'completed',
    steps: [
      { kind: 'left-office', at: '9:02 AM', distanceM: 35, accuracyM: 18 },
      { kind: 'check-in', at: '9:34 AM', distanceM: 45, accuracyM: 12 },
      { kind: 'check-out', at: '10:20 AM', distanceM: 60, accuracyM: 15 },
    ],
    outcome: { result: 'Liked it', feedback: 'Loved the garden; wants the owner to fix the gate before registration.', nextStep: 'Send revised offer at ₹4 Cr' },
  },
  {
    id: 4, leadId: 2, propertyId: 2, agentId: 'm-vivek', day: 0, time: '10:00 AM', status: 'checked-in',
    steps: [
      { kind: 'left-office', at: '9:21 AM', distanceM: 40, accuracyM: 20 },
      { kind: 'check-in-refused', at: '9:55 AM', distanceM: 1300, accuracyM: 25, note: 'Too far from the property' },
      { kind: 'check-in', at: '10:04 AM', distanceM: 60, accuracyM: 14 },
    ],
  },
  { id: 5, leadId: 6, propertyId: 3, agentId: 'm-rohit', day: 1, time: '10:30 AM', status: 'planned', steps: [] },
  { id: 6, leadId: 3, propertyId: 3, agentId: 'm-sneha', day: -1, time: '5:00 PM', status: 'no-show', steps: [] },
]

/** "11:30 AM" → minutes after midnight, for sorting. */
export function slotMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return 0
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return hours * 60 + Number(match[2])
}

/** 1400 → "1.4 km", 60 → "60 m" */
export function formatDistance(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}
