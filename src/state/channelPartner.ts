// M14 · Channel partner state (spec §8.17), used inside useDemoStore and exposed as `store.cp`.
// Kept in its own file so the main store stays readable; it shares the store's viewer, log, notifications and audit.

import { SEED_BOOKINGS, bookingStatus, brokerageL, developerOfProject, findProject, nextInvoiceNumber, taxLines, REMINDER_REPLY, type Booking } from '../data/channelPartner'
import type { AuditKind, NotificationKind, NotificationView } from '../data/notifications'
import type { Member } from '../data/team'
import { clockLabel } from '../lib/format'
import type { Permission } from '../lib/permissions'
import { useLocalState } from '../lib/storage'
import type { ActivityKind } from './useDemoStore'

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
}

const rupeeText = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

export function useChannelPartner({ viewer, viewerCan, findMember, nameOf, pushNotification, recordAudit, approversFor }: ChannelPartnerDeps) {
  const [bookings, setBookings] = useLocalState<Booking[]>('cp-bookings', SEED_BOOKINGS)

  /** Owner: every booking. Manager: their team's agents. Sales and Pre-sales: their own (status words only). */
  const visibleBookings = bookings.filter((booking) => {
    if (viewerCan('seeAllLeads')) return true
    if (viewerCan('viewReceivables')) return findMember(booking.agentId)?.teamId === viewer.teamId && !!viewer.teamId
    return booking.agentId === viewer.id
  })
  const findBooking = (id: number) => bookings.find((booking) => booking.id === id)
  const update = (id: number, change: (booking: Booking) => Booking) => setBookings((current) => current.map((booking) => (booking.id === id ? change(booking) : booking)))
  const label = (booking: Booking) => `${booking.buyer} (${findProject(booking.projectId)?.name} ${booking.unit})`

  return {
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
      pushNotification([booking.agentId], 'cp-paid', `${developer?.name} paid the brokerage for ${booking.buyer}. Your share goes out with this month’s payout.`)
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
