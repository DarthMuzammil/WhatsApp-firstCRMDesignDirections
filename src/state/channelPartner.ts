// M14 · Channel partner state (spec §8.17), used inside useDemoStore and exposed as `store.cp`.
// Kept in its own file so the main store stays readable; it shares the store's viewer, log, notifications and audit.

import {
  LAUNCH_SCRIPT, META_MARKETING_RATE, SEED_BOOKINGS, SEED_LAUNCHES, SEED_REGISTRATIONS, launchName, launchProject, bookingStatus, brokerageL, developerOfProject, findProject, isActiveRegistration, nextInvoiceNumber, registrationValidUntil, taxLines,
  REMINDER_REPLY, type Booking, type Launch, type LaunchRecipient, type Registration, type RegistrationMethod,
} from '../data/channelPartner'
import { phoneKey, type Lead } from '../data/demo'
import type { AuditKind, NotificationKind, NotificationView } from '../data/notifications'
import type { Member } from '../data/team'
import { clockLabel, dayLabel, shortDateLabel } from '../lib/format'
import type { Permission } from '../lib/permissions'
import { useLocalState } from '../lib/storage'
import type { ActivityKind, ChatEntry } from './useDemoStore'

export type ChannelPartnerDeps = {
  viewer: Member
  viewerCan: (permission: Permission) => boolean
  members: Member[]
  findMember: (id: string | null | undefined) => Member | undefined
  nameOf: (memberId: string | null | undefined) => string
  log: (leadId: number, kind: ActivityKind, text: string, byId?: string) => void
  pushNotification: (forIds: (string | null | undefined)[], kind: NotificationKind, text: string, target?: { leadId?: number; view?: NotificationView }) => void
  recordAudit: (kind: AuditKind, text: string, key?: string) => void
  approversFor: (memberId: string | null | undefined) => string[]
  /** Every lead in the firm (registrations are checked across all of them) and the ones the viewer may see. */
  allLeads: Lead[]
  leads: Lead[]
  /** Chat helpers for launch broadcasts (see useDemoStore). */
  postChat: (leadId: number, entry: ChatEntry) => void
  setLaunchDelivery: (leadId: number, launchId: number, delivery: NonNullable<ChatEntry['delivery']>) => void
  receiveReply: (leadId: number, text: string) => void
}

const rupeeText = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

export function useChannelPartner({ viewer, viewerCan, findMember, nameOf, log, pushNotification, recordAudit, approversFor, allLeads, leads, postChat, setLaunchDelivery, receiveReply }: ChannelPartnerDeps) {
  const [bookings, setBookings] = useLocalState<Booking[]>('cp-bookings', SEED_BOOKINGS)
  const [registrations, setRegistrations] = useLocalState<Registration[]>('cp-registrations', SEED_REGISTRATIONS)
  const [launches, setLaunches] = useLocalState<Launch[]>('launches', SEED_LAUNCHES)

  /** Owner: every booking. Manager: their team's agents. Sales and Pre-sales: their own (status words only). */
  const visibleBookings = bookings.filter((booking) => {
    if (viewerCan('seeAllLeads')) return true
    if (viewerCan('viewReceivables')) return findMember(booking.agentId)?.teamId === viewer.teamId && !!viewer.teamId
    return booking.agentId === viewer.id
  })
  const findBooking = (id: number) => bookings.find((booking) => booking.id === id)
  const update = (id: number, change: (booking: Booking) => Booking) => setBookings((current) => current.map((booking) => (booking.id === id ? change(booking) : booking)))
  const label = (booking: Booking) => `${booking.buyer} (${findProject(booking.projectId)?.name} ${booking.unit})`

  // Registrations: shown on leads the viewer can see; the conflict check looks across the whole firm.
  const visibleLeadIds = new Set(leads.map((lead) => lead.id))
  const visibleRegistrations = registrations.filter((registration) => visibleLeadIds.has(registration.leadId))
  const findRegistration = (id: number) => registrations.find((registration) => registration.id === id)
  const updateRegistration = (id: number, change: (registration: Registration) => Registration) => setRegistrations((current) => current.map((item) => (item.id === id ? change(item) : item)))
  const leadOf = (registration: Registration) => allLeads.find((lead) => lead.id === registration.leadId)
  const regLabel = (registration: Registration) => `${findProject(registration.projectId)?.name} · ${developerOfProject(registration.projectId)?.name}`
  /** An active registration with the same developer for the same phone number, on any lead in the firm. */
  function registrationConflict(leadId: number, projectId: string): Registration | undefined {
    const phone = phoneKey(allLeads.find((lead) => lead.id === leadId)?.phone ?? '')
    const developerId = developerOfProject(projectId)?.id
    return registrations.find((registration) => isActiveRegistration(registration)
      && developerOfProject(registration.projectId)?.id === developerId
      && phoneKey(leadOf(registration)?.phone ?? '-') === phone)
  }

  const updateRecipient = (launchId: number, leadId: number, change: Partial<LaunchRecipient>) =>
    setLaunches((current) => current.map((launch) => (launch.id === launchId ? { ...launch, recipients: launch.recipients?.map((item) => (item.leadId === leadId ? { ...item, ...change } : item)) } : launch)))

  return {
    launches,
    /** Saves a draft (new or edited) and returns its id. */
    saveLaunch: (launch: Omit<Launch, 'id' | 'status'> & { id?: number }) => {
      const id = launch.id ?? Date.now()
      setLaunches((current) => (current.some((item) => item.id === id)
        ? current.map((item) => (item.id === id ? { ...item, ...launch, id } : item))
        : [{ ...launch, id, status: 'draft' }, ...current]))
      return id
    },
    /**
     * Sends a launch to buyers on WhatsApp (🎭): each chat gets the marketing template with ticks that move from sent
     * (grey ✓) to delivered (~1.5 s) to read (3–6 s); scripted buyers don't get it, don't open it, or reply (6–8 s).
     */
    sendLaunch: (launch: Launch, leadIds: number[], messageFor: (leadId: number) => string) => {
      const name = launchName(launch)
      const scripted = launch.id === SEED_LAUNCHES[0].id
      const plan = leadIds.map((leadId, index) => {
        const script = scripted ? LAUNCH_SCRIPT[leadId] ?? {} : { unread: index % 5 === 4, reply: index < Math.ceil(leadIds.length / 4) ? 'Yes, send details' : undefined }
        return { leadId, index, ...script }
      })
      setLaunches((current) => current.map((item) => (item.id === launch.id ? { ...item, ...launch, status: 'sent', sentDay: 0, recipients: leadIds.map((leadId) => ({ leadId, state: 'sent' })) } : item)))
      for (const { leadId } of plan) {
        postChat(leadId, { from: 'agent', text: messageFor(leadId), at: clockLabel(), template: 'New launch', delivery: 'sent', launchId: launch.id })
        log(leadId, 'launch', `Sent the ${name} launch on WhatsApp`)
      }
      recordAudit('channel-partner', `Sent ${name} to ${leadIds.length} buyers · ₹${(leadIds.length * META_MARKETING_RATE).toFixed(2)}`)
      window.setTimeout(() => plan.forEach(({ leadId, failed }) => {
        setLaunchDelivery(leadId, launch.id, failed ? 'failed' : 'delivered')
        updateRecipient(launch.id, leadId, { state: failed ? 'failed' : 'delivered' })
      }), 1500)
      plan.filter((item) => !item.failed && !item.unread).forEach(({ leadId, index }) => window.setTimeout(() => {
        setLaunchDelivery(leadId, launch.id, 'read')
        updateRecipient(launch.id, leadId, { state: 'read' })
      }, 3000 + (index % 4) * 1000))
      plan.filter((item) => item.reply && !item.failed && !item.unread).forEach(({ leadId, reply }, order) => window.setTimeout(() => {
        const lead = allLeads.find((item) => item.id === leadId)
        receiveReply(leadId, reply!)
        updateRecipient(launch.id, leadId, { state: 'read', reply })
        log(leadId, 'launch', `Replied to the ${name} launch: “${reply}”`, 'buyer')
        pushNotification([lead?.ownerId], 'launch-reply', `${lead?.name} replied to the ${launchProject(launch)?.name.split(' ').slice(0, 2).join(' ')} ${launch.phase} launch: “${reply}”`, { leadId })
      }, 6000 + order * 800))
    },
    registrations: visibleRegistrations,
    registrationsFor: (leadId: number) => registrations.filter((registration) => registration.leadId === leadId),
    findRegistration,
    registrationConflict,
    /** Records a registration done on the developer's side (Bayana submits nothing). Returns its id. */
    register: (leadId: number, entry: { projectId: string; day: number; method: RegistrationMethod; pan?: string; developerRef?: string; proof?: boolean }) => {
      const lead = allLeads.find((item) => item.id === leadId)
      if (!lead) return
      const conflict = registrationConflict(leadId, entry.projectId)
      const id = Date.now()
      const recordedAt = `Recorded by ${nameOf(viewer.id)} · ${shortDateLabel()}, ${clockLabel()}`
      setRegistrations((current) => [...current, { id, leadId, byId: viewer.id, recordedAt, ...entry }])
      const developer = developerOfProject(entry.projectId)
      if (conflict) {
        const first = `already registered by ${nameOf(conflict.byId)}`
        log(leadId, 'registration', `Registered anyway with ${developer?.name} for ${findProject(entry.projectId)?.name} (${first})`)
        recordAudit('channel-partner', `Registered ${lead.name} with ${developer?.name} anyway (${first} on ${dayLabel(conflict.day)})`)
        pushNotification([...approversFor(conflict.byId), ...approversFor(viewer.id)], 'registration', `${nameOf(viewer.id)} registered ${lead.name} with ${developer?.name} again; ${nameOf(conflict.byId)} already registered them on ${dayLabel(conflict.day)}.`, { leadId })
      } else {
        log(leadId, 'registration', `Registered with ${developer?.name} for ${findProject(entry.projectId)?.name} · valid ${developer?.registrationDays} days`)
      }
      return id
    },
    renewRegistration: (id: number, day: number) => {
      const registration = findRegistration(id)
      if (!registration) return
      updateRegistration(id, (item) => ({ ...item, day, disputed: undefined, lost: undefined, proof: true }))
      log(registration.leadId, 'registration', `Renewed the registration with ${developerOfProject(registration.projectId)?.name} · valid until ${dayLabel(day + (developerOfProject(registration.projectId)?.registrationDays ?? 30))}`)
    },
    disputeRegistration: (id: number, reason: string) => {
      const registration = findRegistration(id)
      if (!registration) return
      updateRegistration(id, (item) => ({ ...item, disputed: { reason } }))
      log(registration.leadId, 'registration', `Registration with ${developerOfProject(registration.projectId)?.name} disputed · ${reason}`)
    },
    /** Owner or Manager: the developer accepted ours, or it was lost to another CP (then it lapses). */
    resolveRegistration: (id: number, outcome: 'accepted' | 'lost') => {
      const registration = findRegistration(id)
      if (!registration) return
      updateRegistration(id, (item) => ({ ...item, disputed: undefined, lost: outcome === 'lost' || undefined }))
      log(registration.leadId, 'registration', outcome === 'accepted' ? `${developerOfProject(registration.projectId)?.name} accepted our registration` : `Registration lost to another CP (${developerOfProject(registration.projectId)?.name})`)
    },
    /**
     * Won deal on a lead registered with a developer (spec §8.17.1 "From a won deal"): records a new-launch booking
     * (booked today, agreement = agreed price), marks the registration Booked and tells the Owner.
     */
    bookFromDeal: (registrationId: number, unit: string, agreedCr: number) => {
      const registration = findRegistration(registrationId)
      const lead = registration ? leadOf(registration) : undefined
      if (!registration || !lead) return
      const project = findProject(registration.projectId)
      setBookings((current) => [...current, { id: Date.now(), buyer: lead.name, projectId: registration.projectId, unit, agentId: lead.ownerId ?? viewer.id, agreementCr: agreedCr, bookedDay: 0, reminders: [], leadId: lead.id }])
      updateRegistration(registrationId, (item) => ({ ...item, booked: true, disputed: undefined }))
      log(lead.id, 'registration', `Booked ${project?.name} ${unit} · ₹${agreedCr} Cr`)
      pushNotification(approversFor(lead.ownerId), 'cp-paid', `New-launch booking: ${lead.name} at ${project?.name} ${unit} · ₹${agreedCr} Cr. Brokerage due from ${developerOfProject(registration.projectId)?.name}.`, { view: 'brokerage' })
    },
    /** Days left before the registration lapses (negative once lapsed). */
    daysLeft: (registration: Registration) => registrationValidUntil(registration),
    regLabel,
    nameOf,
    bookings: visibleBookings,
    /** Every booking in the firm (for invoice numbering). */
    allBookings: bookings,
    findBooking,
    nextInvoiceNumber: () => nextInvoiceNumber(bookings),

    markMarginPaid: (id: number, day: number) => {
      const booking = findBooking(id)
      if (!booking) return
      update(id, (item) => ({ ...item, marginDay: day }))
      recordAudit('channel-partner', `Marked margin money paid on ${label(booking)}`)
    },
    raiseInvoice: (id: number, day: number, number: string) => {
      const booking = findBooking(id)
      if (!booking) return
      update(id, (item) => ({ ...item, invoice: { number, day } }))
      recordAudit('channel-partner', `Raised invoice ${number} to ${developerOfProject(booking.projectId)?.name} for ${label(booking)} · ${rupeeText(taxLines(booking).brokerage)} + GST`)
    },
    recordPayment: (id: number, payment: { day: number; utr?: string; tdsCertificate?: boolean }) => {
      const booking = findBooking(id)
      if (!booking) return
      const developer = developerOfProject(booking.projectId)
      update(id, (item) => ({ ...item, paid: payment }))
      recordAudit('channel-partner', `Recorded payment ${rupeeText(taxLines(booking).net)} from ${developer?.name} (${booking.invoice?.number})`)
      pushNotification([booking.agentId], 'cp-paid', `${developer?.name} paid the brokerage for ${booking.buyer}. Your share goes out with this month’s payout.`, { view: 'launches' })
    },
    /** Takes back the latest milestone (payment, then invoice, then margin money). */
    undoLastStep: (id: number) => {
      const booking = findBooking(id)
      if (!booking) return
      const step = booking.paid ? 'payment' : booking.invoice ? `invoice ${booking.invoice.number}` : booking.marginDay !== undefined ? 'margin money' : null
      if (!step) return
      update(id, (item) => {
        if (item.paid) return { ...item, paid: undefined }
        if (item.invoice) return { ...item, invoice: undefined }
        return { ...item, marginDay: undefined }
      })
      recordAudit('channel-partner', `Undid ${step} on ${label(booking)}`)
    },
    markDisputed: (id: number, reason: string) => {
      const booking = findBooking(id)
      if (!booking) return
      update(id, (item) => ({ ...item, disputed: { reason } }))
      recordAudit('channel-partner', `Marked ${label(booking)} disputed · ${reason}`)
      pushNotification(approversFor(booking.agentId), 'cp-dispute', `${developerOfProject(booking.projectId)?.name} disputed the brokerage for ${booking.buyer}: ${reason}.`, { view: 'brokerage' })
    },
    resolveDispute: (id: number) => {
      const booking = findBooking(id)
      if (!booking) return
      update(id, (item) => ({ ...item, disputed: undefined }))
      recordAudit('channel-partner', `Resolved the dispute on ${label(booking)}`)
    },
    /** Sends the WhatsApp reminder (🎭) to the developer's CP manager; their scripted reply lands about 4 s later. */
    sendReminder: (id: number, tone: 'gentle' | 'firm', text: string) => {
      const reminderId = Date.now()
      update(id, (item) => ({ ...item, reminders: [{ id: reminderId, tone, text, at: clockLabel(), byId: viewer.id }, ...item.reminders] }))
      window.setTimeout(() => update(id, (item) => ({ ...item, reminders: item.reminders.map((reminder) => (reminder.id === reminderId ? { ...reminder, reply: REMINDER_REPLY } : reminder)) })), 4000)
    },
    /** Pending brokerage (before GST and TDS) in ₹ lakh and its count, for any list of bookings. */
    pending: (list: Booking[]) => {
      const open = list.filter((booking) => !booking.paid)
      return { lakh: open.reduce((sum, booking) => sum + brokerageL(booking), 0), count: open.length }
    },
    overdue: (list: Booking[]) => list.filter((booking) => bookingStatus(booking).kind === 'overdue'),
    /** The agent who sold it, as "Vivek S.". */
    agentName: (booking: Booking) => nameOf(booking.agentId),
  }
}

export type ChannelPartnerStore = ReturnType<typeof useChannelPartner>
