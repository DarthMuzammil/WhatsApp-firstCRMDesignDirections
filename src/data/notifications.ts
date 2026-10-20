// Notifications and the Owner's audit log (spec §8.12). Seed entries match the seed data
// (pending leave of Aditya and Rohit, Vivek's refused check-in at 9:55 AM, routed leads).

/** Screens a notification can open (a subset of the app's views). */
export type NotificationView = 'attendance' | 'visits' | 'escalations' | 'pipeline' | 'team' | 'brokerage' | 'launches'
export type NotificationKind = 'assigned' | 'moved' | 'checkin-refused' | 'leave-request' | 'leave-decision' | 'correction' | 'deal-won' | 'cp-overdue' | 'cp-paid' | 'cp-dispute' | 'registration' | 'launch-reply'

export type AppNotification = {
  id: number
  /** Who sees it. */
  forId: string
  kind: NotificationKind
  text: string
  at: string
  leadId?: number
  view?: NotificationView
  read: boolean
}

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 1, forId: 'm-arjun', kind: 'checkin-refused', text: 'Vivek S.’s check-in at Windermere Residences was refused (1.3 km away). He checked in at 10:04 AM.', at: '9:55 AM', view: 'visits', read: false },
  { id: 2, forId: 'm-arjun', kind: 'leave-request', text: 'Aditya R. asked for 2 days of Casual leave (moving house).', at: '9:40 AM', view: 'attendance', read: false },
  { id: 3, forId: 'm-arjun', kind: 'leave-request', text: 'Rohit V. asked for 1 day of Sick leave.', at: '8:15 AM', view: 'attendance', read: true },
  { id: 4, forId: 'm-rahul', kind: 'checkin-refused', text: 'Vivek S.’s check-in at Windermere Residences was refused (1.3 km away). He checked in at 10:04 AM.', at: '9:55 AM', view: 'visits', read: false },
  { id: 5, forId: 'm-neha', kind: 'leave-request', text: 'Aditya R. asked for 2 days of Casual leave (moving house).', at: '9:40 AM', view: 'attendance', read: false },
  { id: 6, forId: 'm-farah', kind: 'leave-request', text: 'Rohit V. asked for 1 day of Sick leave.', at: '8:15 AM', view: 'attendance', read: false },
  { id: 7, forId: 'm-priya', kind: 'assigned', text: 'Ishita Banerjee was assigned to you by routing.', at: 'Yesterday', leadId: 12, read: false },
  { id: 8, forId: 'm-kiran', kind: 'assigned', text: 'Pooja Venkatesh was assigned to you by routing.', at: 'Yesterday', leadId: 10, read: false },
  // M14 (spec §8.17): the oldest unpaid developer invoice.
  // M14: developer registrations about to lapse (7, 3 and 1 days → agent; 1 day and lapsed → their manager too).
  { id: 10, forId: 'm-priya', kind: 'registration', text: 'Ananya Rao’s registration with Kestrel Developers expires in 3 days. Renew it to keep the brokerage protected.', at: '8:00 AM', leadId: 1, read: false },
  { id: 11, forId: 'm-rohit', kind: 'registration', text: 'Nisha Kulkarni’s registration with Banyan Bay Developers expires in 7 days.', at: '8:00 AM', leadId: 6, read: false },
  { id: 12, forId: 'm-sneha', kind: 'registration', text: 'Vikram Shah’s registration with Banyan Bay Developers expires tomorrow.', at: '8:00 AM', leadId: 3, read: false },
  { id: 13, forId: 'm-farah', kind: 'registration', text: 'Vikram Shah’s registration with Banyan Bay Developers (Sneha P.) expires tomorrow.', at: '8:00 AM', leadId: 3, read: false },
  { id: 14, forId: 'm-sameer', kind: 'registration', text: 'Meenakshi Raghavan’s registration with Larkspur Estates lapsed 2 days ago. The developer may refuse brokerage.', at: '8:00 AM', leadId: 106, read: false },
  { id: 15, forId: 'm-neha', kind: 'registration', text: 'Meenakshi Raghavan’s registration with Larkspur Estates (Sameer J.) lapsed 2 days ago.', at: '8:00 AM', leadId: 106, read: false },
  { id: 9, forId: 'm-arjun', kind: 'cp-overdue', text: 'Halcyon Habitats: invoice BDR/26-27/014 for Rajiv Menezes is 43 days overdue.', at: '8:00 AM', view: 'brokerage', read: false },
]

export type AuditKind = 'reassign' | 'team' | 'settings' | 'property' | 'deal' | 'channel-partner' | 'export'
export const AUDIT_KIND_LABELS: Record<AuditKind, string> = { reassign: 'Reassignments', team: 'Team', settings: 'Settings', property: 'Properties', deal: 'Deals', 'channel-partner': 'Channel partner', export: 'Exports' }

export type AuditEntry = {
  id: number
  byId: string
  kind: AuditKind
  text: string
  at: string
  /** Repeated edits of the same thing by the same person (e.g. typing a cost) update one entry instead of adding many. */
  key?: string
}

export const SEED_AUDIT: AuditEntry[] = [
  { id: 1, byId: 'm-arjun', kind: 'settings', text: 'Check-in radius set to 200 m', at: 'Yesterday' },
  { id: 2, byId: 'm-neha', kind: 'reassign', text: 'Reassigned Gaurav Bhatia from Kavya R. to Aditya R. · Kavya on leave', at: '3 days ago' },
  { id: 3, byId: 'm-farah', kind: 'reassign', text: 'Reassigned Vikram Shah from Tarun G. to Sneha P. · Better locality fit', at: 'Last week' },
  { id: 4, byId: 'm-arjun', kind: 'export', text: 'Exported leads as CSV (214 rows)', at: 'Last week' },
  { id: 5, byId: 'm-arjun', kind: 'team', text: 'Invited Lakshmi Narayan as Pre-sales', at: '2 weeks ago' },
]
