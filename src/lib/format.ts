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
