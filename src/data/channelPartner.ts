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

// ---------- Developer client registrations (spec §8.17.2) ----------
export type RegistrationMethod = 'Developer’s CP portal' | 'Email to CP manager' | 'WhatsApp to CP manager'
export const REGISTRATION_METHODS: RegistrationMethod[] = ['Developer’s CP portal', 'Email to CP manager', 'WhatsApp to CP manager']
export const REGISTRATION_DISPUTE_REASONS = ['Another CP registered first', 'Developer has no record', 'Other']

/** The firm's registration of a buyer with a developer, which protects the brokerage until it lapses. */
export type Registration = {
  id: number
  leadId: number
  projectId: string
  /** Who registered the buyer (may differ from the lead's current owner). */
  byId: string
  /** Day registered (or last renewed), as an offset from today. */
  day: number
  method: RegistrationMethod
  pan?: string
  developerRef?: string
  proof?: boolean
  /** "Recorded by Priya N. · Tue, 20 Oct, 2:14 PM" for registrations recorded in the demo. */
  recordedAt?: string
  disputed?: { reason: string }
  /** Resolved as lost to another CP: shows as Lapsed. */
  lost?: boolean
  booked?: boolean
}

export const SEED_REGISTRATIONS: Registration[] = [
  { id: 1, leadId: 1, projectId: 'kestrel-heights', byId: 'm-priya', day: -42, method: 'Developer’s CP portal', developerRef: 'KD-CP-88213' },
  { id: 2, leadId: 12, projectId: 'larkspur-residences', byId: 'm-priya', day: -10, method: 'Email to CP manager' },
  { id: 3, leadId: 101, projectId: 'larkspur-residences', byId: 'm-priya', day: -12, method: 'WhatsApp to CP manager', disputed: { reason: 'Another CP registered first' } },
  { id: 4, leadId: 9, projectId: 'kestrel-heights', byId: 'm-kavya', day: -30, method: 'Developer’s CP portal', developerRef: 'KD-CP-87650' },
  { id: 5, leadId: 106, projectId: 'larkspur-residences', byId: 'm-sameer', day: -32, method: 'Email to CP manager' },
  { id: 6, leadId: 5, projectId: 'kestrel-heights', byId: 'm-ritu', day: -20, method: 'Developer’s CP portal', developerRef: 'KD-CP-88004' },
  { id: 7, leadId: 118, projectId: 'halcyon-grove', byId: 'm-ayesha', day: -5, method: 'Developer’s CP portal' },
  { id: 8, leadId: 6, projectId: 'banyan-bay', byId: 'm-rohit', day: -23, method: 'WhatsApp to CP manager' },
  { id: 9, leadId: 3, projectId: 'banyan-bay', byId: 'm-sneha', day: -29, method: 'Email to CP manager' },
]

export type RegistrationStatus =
  | { kind: 'registered'; label: string; daysLeft: number }
  | { kind: 'expiring'; label: string; daysLeft: number }
  | { kind: 'lapsed'; label: string; daysAgo: number }
  | { kind: 'disputed'; label: string; reason: string }
  | { kind: 'booked'; label: string }

/** Day the registration stops protecting the brokerage (offset from today). */
export function registrationValidUntil(registration: Registration): number {
  return registration.day + (developerOfProject(registration.projectId)?.registrationDays ?? 30)
}

export function registrationStatus(registration: Registration): RegistrationStatus {
  if (registration.booked) return { kind: 'booked', label: 'Booked' }
  if (registration.disputed) return { kind: 'disputed', label: 'Disputed', reason: registration.disputed.reason }
  const left = registrationValidUntil(registration)
  if (registration.lost || left < 0) {
    const ago = Math.max(0, -left)
    return { kind: 'lapsed', label: registration.lost ? 'Lapsed · lost to another CP' : ago === 0 ? 'Lapsed today' : `Lapsed ${ago} ${ago === 1 ? 'day' : 'days'} ago`, daysAgo: ago }
  }
  if (left <= 7) return { kind: 'expiring', label: left === 0 ? 'Expires today' : left === 1 ? 'Expires tomorrow' : `Expiring · ${left} days left`, daysLeft: left }
  return { kind: 'registered', label: `Registered · ${left} days left`, daysLeft: left }
}

/** Still protecting the brokerage (counts for the conflict check). */
export function isActiveRegistration(registration: Registration): boolean {
  const kind = registrationStatus(registration).kind
  return kind === 'registered' || kind === 'expiring' || kind === 'booked'
}

/** "ABCPM1234K" → "XXXXXX234K" (spec: PAN always shows masked; full only on request for seeFullNumbers). */
export function maskPan(pan: string): string {
  return `XXXXXX${pan.slice(-4)}`
}
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/

// ---------- Launch broadcasts (spec §8.17.3) ----------
export type LaunchRecipient = { leadId: number; state: 'sent' | 'delivered' | 'read' | 'failed'; reply?: string }
export type Launch = {
  id: number
  projectId: string
  /** "Phase 2", "Tower D". */
  phase: string
  configs: ProjectConfig[]
  launchDay: number
  eoiL: number
  possession: string
  rera: string
  status: 'draft' | 'sent'
  sentDay?: number
  recipients?: LaunchRecipient[]
  /** A project typed in for this launch (not one of PROJECTS). */
  project?: Project
  /** Seeded history for launches sent before the demo (🧱): sent / delivered / read / replied. */
  history?: { sent: number; delivered: number; read: number; replied: number }
}

export const SEED_LAUNCHES: Launch[] = [
  { id: 1, projectId: 'banyan-bay', phase: 'Phase 2', configs: [{ bhk: '2 BHK', fromCr: 1.35, toCr: 1.55 }, { bhk: '3 BHK', fromCr: 1.85, toCr: 2.1 }], launchDay: 4, eoiL: 2, possession: 'Dec 2029', rera: 'PRM/KA/RERA/DEMO/0142', status: 'draft' },
  { id: 2, projectId: 'halcyon-grove', phase: 'Tower D', configs: [{ bhk: '2 BHK', fromCr: 1.1, toCr: 1.35 }, { bhk: '3 BHK', fromCr: 1.6, toCr: 1.9 }], launchDay: -2, eoiL: 1, possession: 'Jun 2028', rera: 'PRM/KA/RERA/DEMO/0118', status: 'sent', sentDay: -6, history: { sent: 8, delivered: 8, read: 6, replied: 2 } },
]

/** The launch's project: a typed-in one, or one of PROJECTS. */
export const launchProject = (launch: Pick<Launch, 'projectId' | 'project'>) => launch.project ?? findProject(launch.projectId)
export const launchDeveloper = (launch: Pick<Launch, 'projectId' | 'project'>) => findDeveloper(launchProject(launch)?.developerId ?? '')
export const launchName = (launch: Pick<Launch, 'projectId' | 'phase' | 'project'>) => `${launchProject(launch)?.name ?? 'New project'}${launch.phase ? ` · ${launch.phase}` : ''}`
const crText = (value: number) => String(Number(value.toFixed(2)))
export const configLabel = (config: ProjectConfig) => `${config.bhk} · ₹${crText(config.fromCr)}–${crText(config.toCr)} Cr`

export type LaunchFilters = { locality: boolean; bhk: boolean; budget: boolean }
export type LaunchMatch = { leadId: number; reason: string; registered?: string }

type MatchableLead = { id: number; need: string; budget: string; locality: string; localities?: string[]; purpose?: string; closed?: unknown }
const budgetOf = (budget: string) => {
  const numbers = (budget.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  return numbers.length ? { min: numbers[0], max: numbers[numbers.length - 1] } : null
}

/**
 * Buyers to send a launch to (spec §8.17.3): open leads matched on locality (one of the buyer's localities is the
 * project's), BHK (a configured BHK; investment flats match any, villas never) and budget (overlaps that
 * configuration's price band). Any filter can be switched off. Each match carries the reason shown in the list.
 */
export function buyersForLaunch(leads: MatchableLead[], launch: Pick<Launch, 'projectId' | 'configs' | 'project'>, filters: LaunchFilters, registeredWith?: (leadId: number) => string | undefined): LaunchMatch[] {
  const project = launchProject(launch)
  if (!project) return []
  const matches: LaunchMatch[] = []
  for (const lead of leads) {
    if (lead.closed) continue
    const localities = lead.localities ?? [lead.locality]
    if (filters.locality && !localities.includes(project.locality)) continue
    const villa = /villa/i.test(lead.need)
    const investment = lead.purpose === 'Investment' || /^investment/i.test(lead.need)
    const configs = filters.bhk
      ? launch.configs.filter((config) => !villa && (investment || lead.need.toLowerCase().includes(config.bhk.toLowerCase())))
      : launch.configs
    if (configs.length === 0) continue
    const budget = budgetOf(lead.budget)
    const fitting = filters.budget ? configs.filter((config) => budget && budget.min <= config.toCr && budget.max >= config.fromCr) : configs
    if (fitting.length === 0) continue
    const config = fitting[0]
    const where = localities.includes(project.locality) ? project.locality : localities[0]
    const what = investment ? 'Investment' : (lead.need.match(/\d BHK/i)?.[0] ?? lead.need)
    const fit = budget && filters.budget ? ` · ${lead.budget} fits ₹${crText(config.fromCr)}–${crText(config.toCr)} Cr` : ` · ${lead.budget}`
    matches.push({ leadId: lead.id, reason: `${where} · ${what}${fit}`, registered: registeredWith?.(lead.id) })
  }
  return matches
}

/** The marketing template each buyer gets (personalised with their first name). */
/** `when` reads "on Sat, 24 Oct", "tomorrow" or "today" (see onDayLabel). */
export function launchMessage(launch: Launch, firstName: string, senderFirstName: string, when: string): string {
  const project = launchProject(launch)
  const developer = launchDeveloper(launch)
  const configs = launch.configs.map((config) => `• ${configLabel(config)}`).join(' ')
  return `Hi ${firstName}, ${launchName(launch)} by ${developer?.name} launches ${when} ${project?.area === project?.locality ? `in ${project?.area}` : project?.area}. ${configs}. Possession ${launch.possession} · RERA ${launch.rera}. Early-access EOI ₹${launch.eoiL} L (refundable). Want floor plans and a site visit? — ${senderFirstName}, ${BROKERAGE.name}`
}

/**
 * Scripted delivery for the seed draft (🎭): who isn't on WhatsApp, who doesn't open it, and who replies.
 * Other launches: about 80% read and the first quarter reply.
 */
export const LAUNCH_SCRIPT: Record<number, { failed?: boolean; unread?: boolean; reply?: string }> = {
  132: { failed: true }, // Omkar Jadhav: not on WhatsApp
  126: { unread: true }, 130: { unread: true }, 131: { unread: true }, // Vinay Prabhu, Tejas Patil, Bhavana Shenoy
  6: { reply: 'Yes, send details' }, // Nisha Kulkarni
  124: { reply: 'Any 3 BHK on a high floor, east facing? Is the EOI fully refundable?' }, // Aman Khurana
  133: { reply: 'Yes, send details' }, // Asha Thomas
}
