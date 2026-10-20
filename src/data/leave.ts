// Leave with a cover agent (spec §8.8). Day offsets are relative to today (0 = today).

export type LeaveType = 'Casual' | 'Sick' | 'Earned'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'ended'

export type LeaveRequest = {
  id: number
  memberId: string
  type: LeaveType
  from: number
  to: number
  reason: string
  status: LeaveStatus
  /** Who handles the absent person's leads and visits (chosen when approving). */
  coverId?: string
  /** Leads moved to the cover on approval, so they can be returned afterwards. */
  movedLeadIds?: number[]
  /** Visits moved to the cover on approval. */
  movedVisitIds?: number[]
  /** Day the person came back early ("Return leads"); leave stops the day before. */
  endedOn?: number
}

export const LEAVE_TYPES: LeaveType[] = ['Casual', 'Sick', 'Earned']
/** Days per year for each type. */
export const LEAVE_ALLOWANCE: Record<LeaveType, number> = { Casual: 8, Sick: 6, Earned: 15 }

/** Days already used this year before the demo, so balances look realistic. */
export function seedLeaveUsed(memberId: string, type: LeaveType): number {
  const hash = [...memberId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return { Casual: hash % 4, Sick: hash % 3, Earned: (hash % 5) + 2 }[type]
}

export const SEED_LEAVE: LeaveRequest[] = [
  { id: 1, memberId: 'm-kavya', type: 'Casual', from: -3, to: 1, reason: 'Family wedding in Mysuru', status: 'approved', coverId: 'm-sameer', movedLeadIds: [], movedVisitIds: [] },
  { id: 2, memberId: 'm-aditya', type: 'Casual', from: 2, to: 3, reason: 'Moving house', status: 'pending' },
  { id: 3, memberId: 'm-rohit', type: 'Sick', from: 1, to: 1, reason: 'Doctor’s appointment and rest', status: 'pending' },
]

/** Fixed-date public holidays observed in Bengaluru (dates that don't move year to year). */
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, name: 'New Year’s Day' },
  { month: 0, day: 26, name: 'Republic Day' },
  { month: 4, day: 1, name: 'May Day' },
  { month: 7, day: 15, name: 'Independence Day' },
  { month: 9, day: 2, name: 'Gandhi Jayanti' },
  { month: 10, day: 1, name: 'Kannada Rajyotsava' },
  { month: 11, day: 25, name: 'Christmas' },
]

/** Holidays in the next `days` days, as day offsets from today. */
export function upcomingHolidays(days: number, today = new Date()): { name: string; day: number }[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const result: { name: string; day: number }[] = []
  for (const year of [start.getFullYear(), start.getFullYear() + 1]) {
    for (const holiday of FIXED_HOLIDAYS) {
      const date = new Date(year, holiday.month, holiday.day)
      const offset = Math.round((date.getTime() - start.getTime()) / 86400000)
      if (offset >= 0 && offset <= days) result.push({ name: holiday.name, day: offset })
    }
  }
  return result.sort((a, b) => a.day - b.day)
}

export function leaveDays(request: Pick<LeaveRequest, 'from' | 'to'>): number {
  return request.to - request.from + 1
}

/** True if this approved (or finished) leave covers the given day. */
export function coversDay(request: Pick<LeaveRequest, 'from' | 'to' | 'status' | 'endedOn'>, day: number): boolean {
  if (request.status !== 'approved' && request.status !== 'ended') return false
  const lastDay = request.status === 'ended' && request.endedOn !== undefined ? Math.min(request.to, request.endedOn - 1) : request.to
  return day >= request.from && day <= lastDay
}
