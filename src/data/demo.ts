// Seed data for the client demo. Everything the UI shows comes from here or
// from user actions stored by `state/useDemoStore.ts`.

export type Temperature = 'Hot' | 'Warm' | 'New'
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
  time: string
  unread: number
  temp: Temperature
  source: string
  color: AvatarColor
  online: boolean
  phone: string
  moveIn: string
  mustHave: string
  initialStage: number
  /** True for leads added during the demo; they start with an empty chat. */
  addedInDemo?: boolean
}

/** A lead with its live demo state applied. This is what components receive. */
export type Lead = LeadSeed & { stage: number; visitScheduled: boolean }

export type Property = {
  id: number
  name: string
  locality: string
  city: string
  price: string
  bedrooms: string
  area: string
  image: string
}

export type TaskChannel = 'WhatsApp' | 'Call' | 'Send details'
export type Task = { id: number; leadId: number; time: string; title: string; note: string; channel: TaskChannel }

export type Recording = { id: number; leadId: number; when: string; duration: number; note: string }

export const BROKER = { name: 'Arjun Khanna', initials: 'AK', base: 'Indiranagar' }

export const PROPERTIES: Property[] = [
  { id: 1, name: 'The Courtyard House', locality: 'Indiranagar', city: 'Bengaluru', price: '₹2.65 Cr', bedrooms: '3 BHK', area: '1,865 sq ft', image: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?auto=format&fit=crop&w=1200&q=85' },
  { id: 2, name: 'Windermere Residences', locality: 'Whitefield', city: 'Bengaluru', price: '₹3.40 Cr', bedrooms: '4 BHK', area: '2,840 sq ft', image: 'https://images.unsplash.com/photo-1641356916420-a4b06a824bb7?auto=format&fit=crop&w=1200&q=85' },
  { id: 3, name: 'Lakeview Terraces', locality: 'HSR Layout', city: 'Bengaluru', price: '₹1.48 Cr', bedrooms: '2 BHK', area: '1,260 sq ft', image: 'https://images.unsplash.com/photo-1686569860484-b0b79f5d7959?auto=format&fit=crop&w=1200&q=85' },
]

export const SEED_LEADS: LeadSeed[] = [
  {
    id: 1, name: 'Ananya Rao', initials: 'AR', need: '3 BHK in Indiranagar', budget: '₹2.4–2.8 Cr', budgetCr: 2.6, locality: 'Indiranagar',
    message: 'Can we see the corner unit this Saturday?', enquiry: 'Hi, I’m looking for a 3 BHK in Indiranagar. Is anything good available?',
    time: '2m', unread: 2, temp: 'Hot', source: '99acres', color: 'coral', online: true, phone: '+91 98861 24018',
    moveIn: 'Within 3 months', mustHave: 'Natural light · Balcony', initialStage: 2,
  },
  {
    id: 2, name: 'Rohan & Meera', initials: 'RM', need: 'Villa near Whitefield', budget: '₹3.5 Cr', budgetCr: 3.5, locality: 'Whitefield',
    message: 'The garden is lovely. Is the price negotiable?', enquiry: 'Hello! We’re looking for a villa near Whitefield with a garden.',
    time: '18m', unread: 1, temp: 'Warm', source: 'Referral', color: 'violet', online: true, phone: '+91 99001 55234',
    moveIn: 'Before school year', mustHave: 'Garden · 4 bedrooms', initialStage: 3,
  },
  {
    id: 3, name: 'Vikram Shah', initials: 'VS', need: 'Investment flat, HSR Layout', budget: '₹1.2–1.5 Cr', budgetCr: 1.35, locality: 'HSR Layout',
    message: 'Please share the rental yield calculation.', enquiry: 'Hi, I want an investment flat that rents out easily. Budget around ₹1.3 Cr.',
    time: '1h', unread: 0, temp: 'Warm', source: 'MagicBricks', color: 'blue', online: false, phone: '+91 97411 80923',
    moveIn: 'Investment', mustHave: 'Rental yield > 3%', initialStage: 1,
  },
  {
    id: 4, name: 'Sana Fathima', initials: 'SF', need: '2 BHK in HSR Layout', budget: '₹1.4 Cr', budgetCr: 1.4, locality: 'HSR Layout',
    message: 'I will confirm after speaking to my family.', enquiry: 'Hi, I’m looking for a 2 BHK in HSR Layout, close to the park.',
    time: '3h', unread: 0, temp: 'New', source: 'WhatsApp', color: 'gold', online: false, phone: '+91 90080 33671',
    moveIn: 'Within 6 months', mustHave: 'Near a park · Lift', initialStage: 0,
  },
]

export const SEED_TASKS: Task[] = [
  { id: 1, leadId: 1, time: '10:30 AM', title: 'Confirm Saturday property visit', note: 'The Courtyard House · Indiranagar', channel: 'WhatsApp' },
  { id: 2, leadId: 2, time: '12:00 PM', title: 'Send revised price and payment plan', note: 'Windermere Residences · Whitefield', channel: 'Send details' },
  { id: 3, leadId: 3, time: '3:30 PM', title: 'Discuss rental yield estimates', note: 'Lakeview Terraces · HSR Layout', channel: 'Call' },
  { id: 4, leadId: 4, time: '5:00 PM', title: 'Check family decision', note: '2 BHK shortlist · HSR Layout', channel: 'WhatsApp' },
]

/** Offered by the "Add reminder" button on the Follow-ups page. */
export const EXTRA_REMINDER: Task = { id: 5, leadId: 1, time: '6:30 PM', title: 'Send post-visit follow-up', note: 'Ask for feedback and next steps', channel: 'WhatsApp' }

export const SEED_RECORDINGS: Recording[] = [
  { id: 101, leadId: 2, when: 'Today · 9:42 AM', duration: 248, note: 'Discussed revised offer and garden maintenance.' },
  { id: 102, leadId: 3, when: 'Yesterday · 4:18 PM', duration: 375, note: 'Explained rental yield assumptions for HSR Layout.' },
  { id: 103, leadId: 1, when: '3 days ago · 11:06 AM', duration: 132, note: 'Confirmed preferences: corner unit and morning light.' },
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

/** Best property for a lead: same locality first, then same BHK, then the first listing. */
export function matchPropertyForLead(lead: LeadSeed): Property {
  return (
    PROPERTIES.find((p) => p.locality.toLowerCase() === lead.locality.toLowerCase()) ??
    PROPERTIES.find((p) => lead.need.startsWith(p.bedrooms)) ??
    PROPERTIES[0]
  )
}

export function initialsFor(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}
