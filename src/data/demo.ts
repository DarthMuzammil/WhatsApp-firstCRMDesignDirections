// Seed data for the client demo. Everything the UI shows comes from here or
// from user actions stored by `state/useDemoStore.ts`.

export type Temperature = 'Hot' | 'Warm' | 'New'
export type Purpose = 'Live-in' | 'Investment'
export type AvatarColor = 'coral' | 'violet' | 'blue' | 'gold'

/** Pipeline stages, in order. A lead's `stage` is an index into this list. */
export const STAGES = ['New lead', 'Qualified', 'Visit planned', 'Negotiation'] as const
/** Short stage labels for compact progress tracks. Same order as STAGES. */
export const STAGE_SHORT_LABELS = ['New', 'Qualified', 'Visit', 'Offer'] as const
/** Probability a deal at each stage closes. Used for the weighted commission estimate. */
export const STAGE_CLOSE_PROBABILITY = [0.1, 0.3, 0.6, 0.8] as const
export const COMMISSION_RATE = 0.02

/** A lead as stored in seed data or created from the "Add lead" form. */
export type LeadSeed = {
  id: number
  name: string
  initials: string
  need: string
  /** Display budget, e.g. "₹2.4–2.8 Cr". */
  budget: string
  /** Budget midpoint in crore, used for totals. 0 when not yet qualified. */
  budgetCr: number
  locality: string
  /** Latest inbound WhatsApp message. */
  message: string
  /** The buyer's opening enquiry, shown first in the chat. */
  enquiry: string
  /** Minutes since the buyer's latest message. Shown as "2m" / "3h". */
  minutesAgo: number
  unread: number
  temp: Temperature
  source: string
  color: AvatarColor
  online: boolean
  phone: string
  moveIn: string
  mustHave: string
  initialStage: number
  /** Team member who owns the lead (see data/team.ts). null = unassigned queue. */
  ownerId: string | null
  /** All localities the buyer will consider; `locality` is the first. */
  localities?: string[]
  purpose?: Purpose
  /** Portal leads: roughly how many other brokers received the same enquiry (spec §8.5). */
  sharedWith?: number
  /** True for leads added during the demo; they start with an empty chat. */
  addedInDemo?: boolean
  /** True for leads that arrived from a source during the demo; the chat shows only their enquiry. */
  freshEnquiry?: boolean
  /** Demo arrivals: what the buyer will answer to the auto-qualification questions. */
  answers?: { budget: string; budgetCr: number; moveIn: string }
}

/** A lead with its live demo state applied. This is what components receive. */
export type Lead = LeadSeed & {
  stage: number
  visitScheduled: boolean
  /** Unread for longer than RESPONSE_SLA_MINUTES: shown as "Overdue" and listed in Escalations. */
  overdue: boolean
  /** Set once the deal is won or lost (spec §8.10). */
  closed?: { result: 'won' | 'lost'; reason?: string }
}

/** A buyer message unanswered for longer than this is overdue (spec §8.2). */
export const RESPONSE_SLA_MINUTES = 15

export type TaskChannel = 'WhatsApp' | 'Call' | 'Send details'
export type Task = { id: number; leadId: number; time: string; title: string; note: string; channel: TaskChannel }

export type Recording = { id: number; leadId: number; when: string; duration: number; note: string; aiSummary?: boolean }

export const SEED_LEADS: LeadSeed[] = [
  {
    id: 1, name: 'Ananya Rao', initials: 'AR', need: '3 BHK in Indiranagar', budget: '₹2.4–2.8 Cr', budgetCr: 2.6, locality: 'Indiranagar',
    message: 'Can we see the corner unit this Saturday?', enquiry: 'Hi, I’m looking for a 3 BHK in Indiranagar. Is anything good available?',
    minutesAgo: 2, unread: 2, temp: 'Hot', source: '99acres', color: 'coral', online: true, phone: '+91 98861 24018',
    moveIn: 'Within 3 months', mustHave: 'Natural light · Balcony', initialStage: 2, ownerId: 'm-priya', sharedWith: 6,
  },
  {
    id: 2, name: 'Rohan & Meera', initials: 'RM', need: 'Villa near Whitefield', budget: '₹3.5 Cr', budgetCr: 3.5, locality: 'Whitefield',
    message: 'The garden is lovely. Is the price negotiable?', enquiry: 'Hello! We’re looking for a villa near Whitefield with a garden.',
    minutesAgo: 18, unread: 1, temp: 'Warm', source: 'Referral', color: 'violet', online: true, phone: '+91 99001 55234',
    moveIn: 'Before school year', mustHave: 'Garden · 4 bedrooms', initialStage: 3, ownerId: 'm-vivek',
  },
  {
    id: 3, name: 'Vikram Shah', initials: 'VS', need: 'Investment flat, HSR Layout', budget: '₹1.2–1.5 Cr', budgetCr: 1.35, locality: 'HSR Layout',
    message: 'Please share the rental yield calculation.', enquiry: 'Hi, I want an investment flat that rents out easily. Budget around ₹1.3 Cr.',
    minutesAgo: 60, unread: 0, temp: 'Warm', source: 'MagicBricks', color: 'blue', online: false, phone: '+91 97411 80923',
    moveIn: 'Investment', mustHave: 'Rental yield > 3%', initialStage: 1, ownerId: 'm-sneha', purpose: 'Investment',
  },
  {
    id: 4, name: 'Sana Fathima', initials: 'SF', need: '2 BHK in HSR Layout', budget: '₹1.4 Cr', budgetCr: 1.4, locality: 'HSR Layout',
    message: 'I will confirm after speaking to my family.', enquiry: 'Hi, I’m looking for a 2 BHK in HSR Layout, close to the park.',
    minutesAgo: 180, unread: 0, temp: 'New', source: 'WhatsApp', color: 'gold', online: false, phone: '+91 90080 33671',
    moveIn: 'Within 6 months', mustHave: 'Near a park · Lift', initialStage: 0, ownerId: 'm-kiran',
  },
  {
    id: 5, name: 'Deepak Malhotra', initials: 'DM', need: '4 BHK in Whitefield', budget: '₹3–3.4 Cr', budgetCr: 3.2, locality: 'Whitefield',
    message: 'Is the clubhouse ready? Can I visit on Sunday?', enquiry: 'Looking for a 4 BHK in a gated community in Whitefield.',
    minutesAgo: 35, unread: 1, temp: 'Hot', source: 'Housing', color: 'blue', online: true, phone: '+91 98455 61207',
    moveIn: 'Within 2 months', mustHave: 'Gated · Clubhouse', initialStage: 2, ownerId: 'm-ritu', sharedWith: 5,
  },
  {
    id: 6, name: 'Nisha Kulkarni', initials: 'NK', need: '3 BHK in HSR Layout', budget: '₹1.8–2 Cr', budgetCr: 1.9, locality: 'HSR Layout',
    message: 'Thanks, we’ll discuss the shortlist tonight.', enquiry: 'Hi, we saw your ad for HSR Layout 3 BHKs. Anything near 27th Main?',
    minutesAgo: 120, unread: 0, temp: 'Warm', source: 'Facebook ads', color: 'violet', online: false, phone: '+91 99800 47215',
    moveIn: 'Within 4 months', mustHave: 'Near school · East facing', initialStage: 1, ownerId: 'm-rohit',
  },
  {
    id: 7, name: 'Farhan Qureshi', initials: 'FQ', need: '2 BHK in Indiranagar', budget: '₹1.5–1.7 Cr', budgetCr: 1.6, locality: 'Indiranagar',
    message: 'Hi, is the 2 BHK on 12th Main still available?', enquiry: 'Hi, is the 2 BHK on 12th Main still available?',
    minutesAgo: 8, unread: 1, temp: 'New', source: '99acres', color: 'gold', online: true, phone: '+91 97390 22814',
    moveIn: 'To confirm', mustHave: 'To confirm', initialStage: 0, ownerId: null, sharedWith: 4,
  },
  {
    id: 8, name: 'Lavanya Subramaniam', initials: 'LS', need: 'Villa in Whitefield', budget: '₹4–4.2 Cr', budgetCr: 4.1, locality: 'Whitefield',
    message: 'We can close this week if the owner agrees to ₹4 Cr.', enquiry: 'We want a ready-to-move villa in Whitefield, budget around ₹4 Cr.',
    minutesAgo: 50, unread: 0, temp: 'Hot', source: 'Referral', color: 'coral', online: false, phone: '+91 98868 70321',
    moveIn: 'Immediately', mustHave: 'Ready to move · 2 car parks', initialStage: 3, ownerId: 'm-manoj',
  },
  {
    id: 9, name: 'Gaurav Bhatia', initials: 'GB', need: '3 BHK in Indiranagar', budget: '₹2.8–3 Cr', budgetCr: 2.9, locality: 'Indiranagar',
    message: 'What are the maintenance charges and is there covered parking?', enquiry: 'Interested in 3 BHK options near 100 Feet Road.',
    minutesAgo: 25, unread: 2, temp: 'Warm', source: 'MagicBricks', color: 'blue', online: false, phone: '+91 99459 31876',
    moveIn: 'Within 6 months', mustHave: 'Covered parking', initialStage: 1, ownerId: 'm-aditya', sharedWith: 3,
  },
  {
    id: 10, name: 'Pooja Venkatesh', initials: 'PV', need: '2 BHK in HSR Layout', budget: '₹1.2–1.3 Cr', budgetCr: 1.25, locality: 'HSR Layout',
    message: 'Walked in to your office yesterday. Please call me.', enquiry: 'Walked in to your office yesterday. Please call me.',
    minutesAgo: 5, unread: 1, temp: 'New', source: 'Walk-in', color: 'violet', online: true, phone: '+91 96860 54419',
    moveIn: 'To confirm', mustHave: 'To confirm', initialStage: 0, ownerId: 'm-kiran',
  },
  {
    id: 11, name: 'Sanjay Mehta', initials: 'SM', need: 'Investment flat, Whitefield', budget: '₹1–1.2 Cr', budgetCr: 1.1, locality: 'Whitefield',
    message: 'Looking for something near ITPL that rents well.', enquiry: 'Looking for something near ITPL that rents well.',
    minutesAgo: 22, unread: 1, temp: 'New', source: 'WhatsApp', color: 'gold', online: false, phone: '+91 98804 66132',
    moveIn: 'Investment', mustHave: 'Near ITPL', initialStage: 0, ownerId: null, purpose: 'Investment',
  },
  {
    id: 12, name: 'Ishita Banerjee', initials: 'IB', need: '3 BHK in Indiranagar', budget: '₹2.4–2.6 Cr', budgetCr: 2.5, locality: 'Indiranagar',
    message: 'Could you send the floor plans for the Courtyard House?', enquiry: 'Hi, I liked the Courtyard House listing. Is it still available?',
    minutesAgo: 1580, unread: 0, temp: 'Hot', source: '99acres', color: 'coral', online: false, phone: '+91 99723 18850',
    moveIn: 'Within 3 months', mustHave: 'Low floor · Pet friendly', initialStage: 1, ownerId: 'm-priya', sharedWith: 6,
  },
]

export const SEED_TASKS: Task[] = [
  { id: 1, leadId: 1, time: '10:30 AM', title: 'Confirm Saturday property visit', note: 'The Courtyard House · Indiranagar', channel: 'WhatsApp' },
  { id: 2, leadId: 2, time: '12:00 PM', title: 'Send revised price and payment plan', note: 'Windermere Residences · Whitefield', channel: 'Send details' },
  { id: 3, leadId: 3, time: '3:30 PM', title: 'Discuss rental yield estimates', note: 'Lakeview Terraces · HSR Layout', channel: 'Call' },
  { id: 4, leadId: 4, time: '5:00 PM', title: 'Check family decision', note: '2 BHK shortlist · HSR Layout', channel: 'WhatsApp' },
  { id: 6, leadId: 6, time: '11:00 AM', title: 'Share HSR 3 BHK shortlist', note: 'Near 27th Main · East facing', channel: 'WhatsApp' },
  { id: 7, leadId: 8, time: '2:00 PM', title: 'Negotiate villa price with owner', note: 'Target ₹4 Cr · Whitefield', channel: 'Call' },
  { id: 8, leadId: 9, time: '4:00 PM', title: 'Answer parking and maintenance questions', note: '3 BHK · 100 Feet Road', channel: 'WhatsApp' },
  { id: 9, leadId: 12, time: '6:00 PM', title: 'Send Courtyard House floor plans', note: 'The Courtyard House · Indiranagar', channel: 'Send details' },
]

/** Offered by the "Add reminder" button on the Follow-ups page; attached to the viewer's first lead. */
export const EXTRA_REMINDER: Omit<Task, 'leadId'> = { id: 5, time: '6:30 PM', title: 'Send post-visit follow-up', note: 'Ask for feedback and next steps', channel: 'WhatsApp' }

export const SEED_RECORDINGS: Recording[] = [
  { id: 101, leadId: 2, when: 'Today · 9:42 AM', duration: 248, note: 'Discussed revised offer and garden maintenance.' },
  { id: 102, leadId: 3, when: 'Yesterday · 4:18 PM', duration: 375, note: 'Explained rental yield assumptions for HSR Layout.' },
  { id: 103, leadId: 1, when: '3 days ago · 11:06 AM', duration: 132, note: 'Confirmed preferences: corner unit and morning light.' },
  { id: 104, leadId: 8, when: 'Today · 10:15 AM', duration: 512, note: 'Owner open to ₹4 Cr if registration is done this month.' },
  { id: 105, leadId: 6, when: 'Yesterday · 6:40 PM', duration: 196, note: 'Explained school distances for the shortlist.' },
]

/** Fixed demo metrics that are not derived from the seed data. */
export const DEMO_METRICS = {
  followUpRate: 82,
  followUpRateChange: 12,
  weeklyFollowUps: [60, 85, 48, 72, 35, 18, 8],
  callsThisWeek: 18,
  callTimeThisWeek: '2h 14m',
  answerRate: 72,
  answerRateChange: 8,
}

export const PROPERTY_TYPES = ['2 BHK', '3 BHK', '4 BHK', 'Villa', 'Plot'] as const
export const MOVE_IN_OPTIONS = ['Immediately', 'Within 2 months', 'Within 3 months', 'Within 4 months', 'Within 6 months', 'Before school year', 'Investment', 'To confirm'] as const
/** Quick tags offered on every lead (spec §8.5). Custom tags can be typed too. */
export const TAG_SUGGESTIONS = ['First-time buyer', 'Loan needed', 'NRI', 'Investor', 'Urgent', 'Price sensitive', 'Repeat client'] as const

/** "₹2.4–2.8 Cr" → { min: 2.4, max: 2.8 }; "₹3.5 Cr" → { min: 3.5, max: 3.5 }; unqualified → null. */
export function parseBudget(budget: string): { min: number; max: number } | null {
  const numbers = (budget.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  if (numbers.length === 0) return null
  return { min: numbers[0], max: numbers[numbers.length - 1] }
}

/** { 2.4, 2.8 } → "₹2.4–2.8 Cr"; equal values → "₹3.5 Cr". */
export function formatBudget(min: number, max: number): string {
  const trim = (value: number) => String(Number(value.toFixed(2)))
  return min === max ? `₹${trim(min)} Cr` : `₹${trim(min)}–${trim(max)} Cr`
}

/** Last 10 digits, for comparing phone numbers written in different formats. */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

/** 2 → "2m", 60 → "1h", 190 → "3h", 1500 → "1d" */
export function relativeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`
  return `${Math.round(minutes / (60 * 24))}d`
}

/** "Rohan & Meera" → "Rohan", "Arjun Khanna" → "Arjun" */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function initialsFor(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}
