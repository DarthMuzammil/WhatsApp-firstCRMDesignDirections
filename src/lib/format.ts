const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Tuesday, 20 October" for today's date. */
export function todayLabel(date = new Date()): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

/** Index of today in a Monday-first week (Mon = 0 … Sun = 6). */
export function weekdayIndexMondayFirst(date = new Date()): number {
  return (date.getDay() + 6) % 7
}

/** "Sat, 24 Oct" for the coming Saturday (today if it is Saturday). Used for scheduled visits. */
export function nextSaturdayLabel(date = new Date()): string {
  const saturday = new Date(date)
  saturday.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7))
  return `Sat, ${saturday.getDate()} ${MONTHS[saturday.getMonth()].slice(0, 3)}`
}

/** 248 → "4:08" */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** 8.85 → "₹8.9 Cr" */
export function formatCrore(crore: number): string {
  return `₹${crore.toFixed(1)} Cr`
}

/** 0.098 crore → "₹9.8 L" (1 crore = 100 lakh) */
export function formatLakhFromCrore(crore: number): string {
  return `₹${(crore * 100).toFixed(1)} L`
}

/** "+91 98861 24018" → "+91 98XXX XX018". Used wherever the viewer may not see full numbers (spec §8.0). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10)
  if (digits.length < 10) return phone
  return `+91 ${digits.slice(0, 2)}XXX XX${digits.slice(7)}`
}

/** Day offset → label: 0 "Today", 1 "Tomorrow", -1 "Yesterday", otherwise "Sat, 24 Oct". */
export function dayLabel(offsetDays: number, date = new Date()): string {
  if (offsetDays === 0) return 'Today'
  if (offsetDays === 1) return 'Tomorrow'
  if (offsetDays === -1) return 'Yesterday'
  const day = new Date(date)
  day.setDate(date.getDate() + offsetDays)
  return `${WEEKDAYS[day.getDay()].slice(0, 3)}, ${day.getDate()} ${MONTHS[day.getMonth()].slice(0, 3)}`
}

/** For use after a verb: "today", "yesterday", "tomorrow" or "on Mon, 12 Oct". */
export function onDayLabel(offsetDays: number, date = new Date()): string {
  return Math.abs(offsetDays) <= 1 ? dayLabel(offsetDays, date).toLowerCase() : `on ${dayLabel(offsetDays, date)}`
}

/** Days from today until the coming Saturday (0 if today is Saturday). */
export function daysUntilSaturday(date = new Date()): number {
  return (6 - date.getDay() + 7) % 7
}

/** Current time as "2:14 PM", for timestamps on demo actions. */
export function clockLabel(date = new Date()): string {
  const hours = date.getHours()
  return `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
}

/** "2:30 PM" → minutes after midnight (870), for sorting by time of day. Unparseable times sort last. */
export function minutesOfDay(label: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim())
  if (!match) return 24 * 60
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return hours * 60 + Number(match[2])
}

/** Clock label for a moment `minutesAgo` before now, e.g. "10:24 AM". */
export function clockMinutesAgo(minutesAgo: number, now = new Date()): string {
  return clockLabel(new Date(now.getTime() - minutesAgo * 60_000))
}

/** Day label ("Today", "Yesterday", "Sat, 17 Oct") for a moment `minutesAgo` before now. */
export function dayOfMinutesAgo(minutesAgo: number, now = new Date()): string {
  const then = new Date(now.getTime() - minutesAgo * 60_000)
  const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return dayLabel(Math.round((startOf(then) - startOf(now)) / 86_400_000), now)
}

/** ₹ lakh with one decimal, dropping a trailing ".0": 42 → "₹42 L", 15.4 → "₹15.4 L". */
export function formatLakh(lakh: number): string {
  const rounded = Math.round(lakh * 10) / 10
  return `₹${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} L`
}

/** Whole rupees in the Indian grouping: 563760 → "₹5,63,760". */
export function formatRupees(amount: number): string {
  return `${amount < 0 ? '−' : ''}₹${Math.abs(Math.round(amount)).toLocaleString('en-IN')}`
}

/** "Tue, 20 Oct" for today (or `date`). */
export function shortDateLabel(date = new Date()): string {
  return `${WEEKDAYS[date.getDay()].slice(0, 3)}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`
}

/** dayLabel for use mid-sentence: "today" / "tomorrow" / "yesterday" in lower case, dates as they are. */
export function inlineDayLabel(offsetDays: number, date = new Date()): string {
  return Math.abs(offsetDays) <= 1 ? dayLabel(offsetDays, date).toLowerCase() : dayLabel(offsetDays, date)
}

/** Minutes → "1h 40m" / "35m" / "2h", for countdowns. */
export function formatMinutesLeft(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes))
  const hours = Math.floor(whole / 60)
  const rest = whole % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
