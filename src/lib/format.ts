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
