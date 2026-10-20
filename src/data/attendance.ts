// Attendance (spec §8.7). Day offsets are relative to today (0 = today, -1 = yesterday).
import { SEED_MEMBERS, type Member } from './team'

/** One day in the register. */
export type AttendanceCode = 'present' | 'late' | 'field' | 'absent' | 'leave' | 'pending'

export const ATTENDANCE_LABEL: Record<AttendanceCode, { short: string; long: string }> = {
  present: { short: 'P', long: 'Present' },
  late: { short: 'L', long: 'Late' },
  field: { short: 'F', long: 'Field day' },
  absent: { short: 'A', long: 'Absent' },
  leave: { short: 'LV', long: 'On leave' },
  pending: { short: '–', long: 'Not checked in yet' },
}

/** Today's live record for one person. */
export type TodayAttendance = {
  status: 'not-in' | 'office' | 'field' | 'out' | 'leave'
  /** Started the day in the office or in the field (kept after checking out). */
  mode?: 'office' | 'field'
  inAt?: string
  outAt?: string
  late?: boolean
  /** Office check-ins refused today for being outside the radius. */
  refused?: number
}

export type CorrectionRequest = { id: number; memberId: string; day: number; reason: string; status: 'pending' | 'approved' | 'rejected' }

export const WORK_START_OPTIONS = ['9:00 AM', '9:30 AM', '10:00 AM'] as const
export const GRACE_OPTIONS = [10, 15, 30] as const

/** People whose attendance is tracked: everyone except the owner. */
export function tracksAttendance(person: Member): boolean {
  return !person.roles.includes('owner') && person.status !== 'deactivated'
}

/** The last `count` working days before today (Sundays skipped), oldest first, as day offsets. */
export function pastWorkingDays(count: number, today = new Date()): number[] {
  const days: number[] = []
  for (let offset = -1; days.length < count; offset--) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    if (date.getDay() !== 0) days.unshift(offset)
  }
  return days
}

/** Three working days ago: the day Sameer forgot to check in (he has asked for a correction). */
export const SAMEER_MISSED_DAY = pastWorkingDays(3)[0]

/** Deterministic history so the register looks lived-in. Kavya has been on leave for three days. */
export function seedAttendance(memberId: string, day: number): AttendanceCode {
  if (memberId === 'm-kavya' && day >= -3) return 'leave'
  if (memberId === 'm-sameer' && day === SAMEER_MISSED_DAY) return 'absent'
  const index = SEED_MEMBERS.findIndex((person) => person.id === memberId)
  const n = (((index + 3) * 7 + day * 13) % 23 + 23) % 23
  if (n === 0) return 'absent'
  if (n <= 3) return 'late'
  if (n <= 7) return 'field'
  return 'present'
}

/** Today's state when the demo starts. Priya, Neha, Kiran and Sameer haven't checked in, so the demo can do it. */
export const SEED_TODAY: Record<string, TodayAttendance> = {
  'm-aditya': { status: 'office', mode: 'office', inAt: '9:18 AM' },
  'm-kavya': { status: 'leave' },
  'm-divya': { status: 'office', mode: 'office', inAt: '9:52 AM', late: true },
  'm-rahul': { status: 'office', mode: 'office', inAt: '9:05 AM' },
  'm-vivek': { status: 'field', mode: 'field', inAt: '9:21 AM' },
  'm-ritu': { status: 'field', mode: 'field', inAt: '9:40 AM' },
  'm-manoj': { status: 'field', mode: 'field', inAt: '9:02 AM' },
  'm-ayesha': { status: 'office', mode: 'office', inAt: '9:26 AM' },
  'm-karthik': { status: 'office', mode: 'office', inAt: '10:04 AM', late: true },
  'm-farah': { status: 'office', mode: 'office', inAt: '9:10 AM' },
  'm-sneha': { status: 'office', mode: 'office', inAt: '9:31 AM' },
  'm-rohit': { status: 'office', mode: 'office', inAt: '9:24 AM' },
  'm-ananth': { status: 'office', mode: 'office', inAt: '9:15 AM' },
  'm-meghna': { status: 'field', mode: 'field', inAt: '9:45 AM' },
  'm-tarun': { status: 'office', mode: 'office', inAt: '9:58 AM', late: true },
  'm-lakshmi': { status: 'office', mode: 'office', inAt: '9:20 AM' },
  'm-imran': { status: 'office', mode: 'office', inAt: '9:34 AM' },
}

export const SEED_CORRECTIONS: CorrectionRequest[] = [
  { id: 1, memberId: 'm-sameer', day: SAMEER_MISSED_DAY, reason: 'Was at a site visit in Domlur all morning; my phone died before I could check in.', status: 'pending' },
]
