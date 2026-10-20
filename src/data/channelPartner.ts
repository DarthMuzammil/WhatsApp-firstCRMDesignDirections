// M14 · Channel partner (spec §8.17): developers the brokerage sells new launches for, their projects, and the
// bookings whose brokerage the developers still owe. All companies, people and RERA numbers are fictional.
// Day numbers are offsets from today (negative = days ago); time doesn't pass in the demo.

import { BROKERAGE } from './brand'

/** Demo settings (the Brokerage screen's footer says to confirm them with a CA). */
export const GST_RATE = 0.18
export const TDS_RATE = 0.02
/** Meta's India rate for a delivered marketing template message, ₹. */
export const META_MARKETING_RATE = 0.86

export type Developer = {
  id: string
  name: string
  cpManager: { name: string; phone: string }
  /** Brokerage as a share of the agreement value. */
  brokeragePct: number
  /** Brokerage becomes billable once the buyer has paid this share of the price. */
  billableAfterPct: number
  /** The developer pays within this many days of the invoice. */
  payDays: number
  /** A client registration protects the brokerage for this many days. */
  registrationDays: number
}

export const DEVELOPERS: Developer[] = [
  { id: 'halcyon', name: 'Halcyon Habitats', cpManager: { name: 'Rakesh Iyengar', phone: '+91 98450 70112' }, brokeragePct: 3, billableAfterPct: 10, payDays: 45, registrationDays: 30 },
  { id: 'banyan', name: 'Banyan Bay Developers', cpManager: { name: 'Deepa Raghunath', phone: '+91 99000 81455' }, brokeragePct: 2.5, billableAfterPct: 10, payDays: 60, registrationDays: 30 },
  { id: 'kestrel', name: 'Kestrel Developers', cpManager: { name: 'Joseph D’Souza', phone: '+91 97400 62318' }, brokeragePct: 2, billableAfterPct: 15, payDays: 30, registrationDays: 45 },
  { id: 'larkspur', name: 'Larkspur Estates', cpManager: { name: 'Nikhil Thakur', phone: '+91 96320 50947' }, brokeragePct: 2, billableAfterPct: 20, payDays: 30, registrationDays: 30 },
]

export type ProjectConfig = { bhk: string; fromCr: number; toCr: number }
export type Project = {
  id: string
  name: string
  developerId: string
  /** Locality used for matching buyers (one of the app's localities). */
  locality: string
  /** How the address reads in messages ("off Sarjapur Road, HSR Layout"). */
  area: string
  configs: ProjectConfig[]
  rera: string
}

export const PROJECTS: Project[] = [
  { id: 'halcyon-grove', name: 'Halcyon Grove', developerId: 'halcyon', locality: 'Whitefield', area: 'Whitefield', configs: [{ bhk: '2 BHK', fromCr: 1.1, toCr: 1.35 }, { bhk: '3 BHK', fromCr: 1.6, toCr: 1.9 }], rera: 'PRM/KA/RERA/DEMO/0118' },
  { id: 'banyan-bay', name: 'Banyan Bay Residences', developerId: 'banyan', locality: 'HSR Layout', area: 'off Sarjapur Road, HSR Layout', configs: [{ bhk: '2 BHK', fromCr: 1.35, toCr: 1.55 }, { bhk: '3 BHK', fromCr: 1.85, toCr: 2.1 }], rera: 'PRM/KA/RERA/DEMO/0142' },
  { id: 'kestrel-heights', name: 'Kestrel Heights', developerId: 'kestrel', locality: 'Koramangala', area: 'Koramangala', configs: [{ bhk: '3 BHK', fromCr: 2.6, toCr: 3.1 }, { bhk: '4 BHK', fromCr: 3.3, toCr: 3.8 }], rera: 'PRM/KA/RERA/DEMO/0167' },
  { id: 'larkspur-residences', name: 'Larkspur Residences', developerId: 'larkspur', locality: 'Indiranagar', area: 'Indiranagar', configs: [{ bhk: '3 BHK', fromCr: 2.6, toCr: 3.2 }], rera: 'PRM/KA/RERA/DEMO/0175' },
]

export const findDeveloper = (id: string) => DEVELOPERS.find((developer) => developer.id === id)
export const findProject = (id: string) => PROJECTS.find((project) => project.id === id)
export const developerOfProject = (projectId: string) => findDeveloper(findProject(projectId)?.developerId ?? '')

export type BookingReminder = { id: number; tone: 'gentle' | 'firm'; text: string; at: string; byId: string; reply?: string }

/** A unit sold through the firm. Milestones: booked → margin money paid → invoice raised → payment received. */
export type Booking = {
  id: number
  buyer: string
  projectId: string
  unit: string
  agentId: string
  agreementCr: number
  bookedDay: number
  marginDay?: number
  invoice?: { number: string; day: number }
  paid?: { day: number; utr?: string; tdsCertificate?: boolean }
  disputed?: { reason: string }
  reminders: BookingReminder[]
  /** Set for bookings recorded from a won deal in the demo. */
  leadId?: number
}

const invoiceNo = (seq: number) => `BDR/26-27/${String(seq).padStart(3, '0')}`

/** Seed bookings (spec §8.17.1). They predate Bayana, so none is linked to a lead. */
export const SEED_BOOKINGS: Booking[] = [
  { id: 1, buyer: 'Rajiv Menezes', projectId: 'halcyon-grove', unit: 'B-1204', agentId: 'm-vivek', agreementCr: 1.62, bookedDay: -120, marginDay: -95, invoice: { number: invoiceNo(14), day: -88 }, reminders: [] },
  { id: 2, buyer: 'Sunaina Dutta', projectId: 'halcyon-grove', unit: 'A-0703', agentId: 'm-ayesha', agreementCr: 1.18, bookedDay: -60, marginDay: -45, invoice: { number: invoiceNo(22), day: -40 }, paid: { day: -6, utr: 'HDFCR52026101400012', tdsCertificate: true }, reminders: [] },
  { id: 3, buyer: 'Arun Pai', projectId: 'halcyon-grove', unit: 'C-1502', agentId: 'm-manoj', agreementCr: 1.86, bookedDay: -150, marginDay: -130, invoice: { number: invoiceNo(9), day: -120 }, paid: { day: -60, tdsCertificate: true }, reminders: [] },
  { id: 4, buyer: 'Prerna Chatterjee', projectId: 'banyan-bay', unit: '2-1103', agentId: 'm-sneha', agreementCr: 1.48, bookedDay: -110, marginDay: -100, invoice: { number: invoiceNo(12), day: -95 }, reminders: [] },
  { id: 5, buyer: 'Manish Kothari', projectId: 'banyan-bay', unit: '3-0405', agentId: 'm-rohit', agreementCr: 1.96, bookedDay: -30, reminders: [] },
  { id: 6, buyer: 'Farida Lokhandwala', projectId: 'banyan-bay', unit: '1-0902', agentId: 'm-meghna', agreementCr: 1.52, bookedDay: -75, marginDay: -60, invoice: { number: invoiceNo(19), day: -58 }, reminders: [] },
  { id: 7, buyer: 'Vikrant Saluja', projectId: 'kestrel-heights', unit: 'T2-1801', agentId: 'm-priya', agreementCr: 3.42, bookedDay: -70, marginDay: -50, invoice: { number: invoiceNo(21), day: -48 }, reminders: [] },
  { id: 8, buyer: 'Ruchi Bhargava', projectId: 'kestrel-heights', unit: 'T1-0602', agentId: 'm-aditya', agreementCr: 2.85, bookedDay: -25, marginDay: -8, reminders: [] },
  { id: 9, buyer: 'Harpreet Sodhi', projectId: 'kestrel-heights', unit: 'T2-2203', agentId: 'm-ritu', agreementCr: 3.1, bookedDay: -45, marginDay: -30, invoice: { number: invoiceNo(24), day: -28 }, disputed: { reason: 'Developer says another CP registered this buyer first' }, reminders: [] },
  { id: 10, buyer: 'Neeraj Wadhwa', projectId: 'larkspur-residences', unit: '3B', agentId: 'm-divya', agreementCr: 3.0, bookedDay: -15, reminders: [] },
]

// ---------- Money ----------
/** Brokerage before GST and TDS, in ₹ lakh (agreement value × the developer's %). */
export function brokerageL(booking: Booking): number {
  return (booking.agreementCr * (developerOfProject(booking.projectId)?.brokeragePct ?? 0)) // Cr × % = lakh
}
const rupees = (lakh: number) => Math.round(lakh * 100000)
/** Brokerage, GST added, TDS deducted and the net receivable, in whole rupees. */
export function taxLines(booking: Booking) {
  const brokerage = rupees(brokerageL(booking))
  const gst = Math.round(brokerage * GST_RATE)
  const tds = Math.round(brokerage * TDS_RATE)
  return { brokerage, gst, tds, net: brokerage + gst - tds }
}

// ---------- Status ----------
export type BookingStatus =
  | { kind: 'waiting'; label: string }
  | { kind: 'ready'; label: string }
  | { kind: 'due'; label: string; days: number }
  | { kind: 'overdue'; label: string; days: number }
  | { kind: 'disputed'; label: string; reason: string }
  | { kind: 'paid'; label: string }

export function bookingStatus(booking: Booking): BookingStatus {
  const developer = developerOfProject(booking.projectId)
  if (booking.paid) return { kind: 'paid', label: 'Paid' }
  if (booking.disputed) return { kind: 'disputed', label: 'Disputed', reason: booking.disputed.reason }
  if (booking.invoice) {
    const left = booking.invoice.day + (developer?.payDays ?? 30)
    if (left < 0) return { kind: 'overdue', label: `Overdue ${-left} ${-left === 1 ? 'day' : 'days'}`, days: -left }
    return { kind: 'due', label: left === 0 ? 'Due today' : `Due in ${left} ${left === 1 ? 'day' : 'days'}`, days: left }
  }
  if (booking.marginDay !== undefined) return { kind: 'ready', label: 'Ready to invoice' }
  return { kind: 'waiting', label: `Waiting for ${developer?.billableAfterPct ?? 10}% payment` }
}

/** What Sales and Pre-sales see about their own bookings: status words only, never amounts (spec §8.17.1). */
export function bookingStatusWords(booking: Booking): string {
  const status = bookingStatus(booking)
  if (status.kind === 'waiting') return `Booked · ${status.label.toLowerCase()} from the buyer`
  if (status.kind === 'ready') return 'Ready to invoice · with the Owner'
  if (status.kind === 'due' || status.kind === 'overdue') return 'Invoice raised · awaiting developer payment'
  if (status.kind === 'disputed') return 'On hold · the developer has a query'
  return 'Paid · your share goes out with the monthly payout'
}

/** Order on the screen: most overdue first, then disputed, ready to invoice, due soonest, waiting; paid last. */
export function bookingSortKey(booking: Booking): number {
  const status = bookingStatus(booking)
  if (status.kind === 'overdue') return -1000 - status.days
  if (status.kind === 'disputed') return -500
  if (status.kind === 'ready') return -400
  if (status.kind === 'due') return status.days
  if (status.kind === 'waiting') return 500
  return 1000
}

export type BookingFilter = 'all' | 'overdue' | 'ready' | 'awaiting' | 'disputed' | 'paid'
export const BOOKING_FILTER_LABELS: Record<BookingFilter, string> = { all: 'All', overdue: 'Overdue', ready: 'Ready to invoice', awaiting: 'Awaiting payment', disputed: 'Disputed', paid: 'Paid' }
export function matchesBookingFilter(booking: Booking, filter: BookingFilter): boolean {
  const kind = bookingStatus(booking).kind
  if (filter === 'all') return true
  if (filter === 'awaiting') return kind === 'waiting' || kind === 'due'
  return kind === filter
}

/** Age since booking, in order (spec: 0–30 / 31–60 / 61–90 / 90+ days). */
export const AGE_BANDS = [
  { key: '0-30', label: '0–30 days', test: (days: number) => days <= 30 },
  { key: '31-60', label: '31–60 days', test: (days: number) => days > 30 && days <= 60 },
  { key: '61-90', label: '61–90 days', test: (days: number) => days > 60 && days <= 90 },
  { key: '90+', label: '90+ days', test: (days: number) => days > 90 },
] as const
export type AgeBand = (typeof AGE_BANDS)[number]['key']

// ---------- Invoices and reminders ----------
/** "26-27" for the Indian financial year (April–March) that contains `date`. */
export function financialYear(date = new Date()): string {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`
}
/** Next invoice number after the highest one used ("BDR/26-27/025"). */
export function nextInvoiceNumber(bookings: Booking[], date = new Date()): string {
  const used = bookings.map((booking) => Number(booking.invoice?.number.split('/').pop() ?? 0))
  return `BDR/${financialYear(date)}/${String(Math.max(0, ...used) + 1).padStart(3, '0')}`
}

/** The WhatsApp reminder to the developer's CP manager, in a gentle or a firm tone. */
export function reminderText(booking: Booking, tone: 'gentle' | 'firm', senderName: string, invoiceDateLabel: string): string {
  const developer = developerOfProject(booking.projectId)
  const project = findProject(booking.projectId)
  const status = bookingStatus(booking)
  const net = `₹${taxLines(booking).net.toLocaleString('en-IN')}`
  const who = `${booking.buyer}, ${project?.name} ${booking.unit}`
  const first = developer?.cpManager.name.split(' ')[0] ?? 'there'
  const late = status.kind === 'overdue' ? status.days : 0
  if (tone === 'gentle') {
    const when = late > 0 ? `is ${late} days past your ${developer?.payDays}-day terms` : `is due ${status.kind === 'due' ? status.label.toLowerCase().replace('due ', '') : 'soon'}`
    return `Hi ${first}, a gentle reminder from ${BROKERAGE.name}. Our invoice ${booking.invoice?.number} for ${net} (${who}) was raised on ${invoiceDateLabel} and ${when}. Could you share the payment date? Thanks, ${senderName}`
  }
  const when = late > 0 ? `is ${late} days overdue` : 'falls due shortly'
  return `Hi ${first}, this is ${senderName} from ${BROKERAGE.name}. Our invoice ${booking.invoice?.number} for ${net} (${who}), raised on ${invoiceDateLabel}, ${when}. Please release it this week, or tell us what’s pending from our side.`
}

/** The CP manager's scripted answer to a reminder (🎭). */
export const REMINDER_REPLY = 'Noted. Checking with accounts, will confirm the date by Friday.'
