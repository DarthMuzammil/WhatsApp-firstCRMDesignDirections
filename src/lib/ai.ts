// "AI assist" (spec §8.13). In the prototype every output is fixed demo text built from the lead's data;
// a real model would replace these functions. Nothing here sends anything: people review and choose.
import { firstName, type Lead } from '../data/demo'

export type Draft = { language: string; text: string }

/** Three reply drafts for the buyer's latest message. */
export function draftReplies(lead: Lead, broker: string): Draft[] {
  const name = firstName(lead.name)
  const me = firstName(broker)
  return [
    { language: 'English', text: `Hi ${name}, thanks for your message. ${lead.visitScheduled ? 'Looking forward to the visit.' : 'Shall I set up a visit this weekend?'} I can also share two more options in ${lead.locality}.` },
    { language: 'Hindi', text: `Namaste ${name} ji, aapke message ke liye dhanyavaad. ${lead.locality} mein do aur achhe options hain. Kya is weekend visit rakh lein? – ${me}` },
    { language: 'Kannada + English', text: `Namaskara ${name}, thank you! ${lead.locality} alli innu eradu olle options ide. Ee weekend visit maadona? – ${me}` },
  ]
}

/** Score 0–100 with plain-language reasons, from what the CRM knows about the lead. */
export function leadScore(lead: Lead): { score: number; label: string; reasons: string[] } {
  const reasons: string[] = []
  let score = 35
  if (lead.budgetCr > 0) { score += 15; reasons.push('budget confirmed') } else reasons.push('budget not yet known')
  if (lead.stage >= 2) { score += 15; reasons.push(lead.stage === 3 ? 'negotiating' : 'visit planned') }
  if (lead.visitScheduled) { score += 10; reasons.push('visit booked') }
  if (lead.minutesAgo <= 30) { score += 15; reasons.push(lead.minutesAgo < 1 ? 'replied just now' : `replied ${lead.minutesAgo} min ago`) } else if (lead.minutesAgo > 24 * 60) { score -= 15; reasons.push('quiet for over a day') }
  if (lead.temp === 'Hot') score += 10
  score = Math.max(5, Math.min(98, score))
  return { score, label: score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cool', reasons: reasons.slice(0, 4) }
}

/** Plain-language weekly digest for a manager from the numbers they can see. */
export function weeklyDigest(input: {
  team: string; overdue: number; unassigned: number; stuck: number; topName?: string; topCommissionL?: number; notCheckedIn: number; pipelineCr: number
  /** M14: the developer that owes the most, and its most overdue invoice. */
  owedBy?: { developer: string; amount: string; count: number; overdueBuyer?: string; overdueDays?: number }
  /** M14: developer registrations expiring within 7 days. */
  registrationsExpiring?: number
  /** Chats whose free 24-hour WhatsApp window closes within 3 hours (spec §3.1). */
  closingSoon?: number
  /** Speed to lead (spec §3.14): median minutes portal leads waited for a human, and the slowest person × source. */
  speed?: { portalMedian: number; slowest?: string }
}): string[] {
  const lines = [
    `${input.team} has ₹${input.pipelineCr.toFixed(1)} Cr in open pipeline.`,
    input.topName ? `${input.topName} leads the month with ₹${input.topCommissionL?.toFixed(1)} L in commission.` : '',
    input.overdue > 0 ? `${input.overdue} ${input.overdue === 1 ? 'buyer is' : 'buyers are'} waiting more than 15 minutes for a reply. Reassign or nudge today.` : 'Every buyer got a reply within 15 minutes.',
    input.unassigned > 0 ? `${input.unassigned} new ${input.unassigned === 1 ? 'lead has' : 'leads have'} no owner yet.` : '',
    input.stuck > 0 ? `${input.stuck} ${input.stuck === 1 ? 'lead has' : 'leads have'} sat in the same stage for over a week. Worth a call.` : '',
    input.notCheckedIn > 0 ? `${input.notCheckedIn} ${input.notCheckedIn === 1 ? 'person hasn’t' : 'people haven’t'} checked in yet today.` : '',
    input.owedBy ? `${input.owedBy.developer} owes ${input.owedBy.amount} across ${input.owedBy.count} ${input.owedBy.count === 1 ? 'booking' : 'bookings'}${input.owedBy.overdueBuyer ? `; ${input.owedBy.overdueBuyer}’s invoice is ${input.owedBy.overdueDays} days overdue` : ''}.` : '',
    input.registrationsExpiring ? `${input.registrationsExpiring} developer ${input.registrationsExpiring === 1 ? 'registration expires' : 'registrations expire'} this week.` : '',
    input.closingSoon ? `${input.closingSoon} ${input.closingSoon === 1 ? 'chat leaves' : 'chats leave'} the free 24-hour WhatsApp window in the next 3 hours. A reply now avoids a paid template.` : '',
    input.speed ? `Portal leads waited a median ${input.speed.portalMedian} min for a human reply this month${input.speed.slowest ? `; ${input.speed.slowest}` : ''}.` : '',
  ]
  return lines.filter(Boolean)
}


// ---------- M14 · WhatsApp group lead capture (spec §8.17.4) ----------
/** What `parseGroupMessage` found. Every field is a suggestion the person confirms or edits. */
export type GroupMessageReading = {
  /** 10-digit mobile number. */
  phone?: string
  name?: string
  /** "3 BHK", "4 BHK villa", "Villa". */
  kind?: string
  localities: string[]
  budget?: string
  budgetCr?: number
  mustHaves: string[]
  /** The number belongs to the broker who posted it, not the buyer. */
  numberIsBroker: boolean
  /** Broker's firm, e.g. "MG Estates". */
  brokerFirm?: string
  /** Reads like a property for sale, not a buyer's requirement. */
  looksLikeListing: boolean
}

const AREA_ALIASES: [RegExp, string][] = [
  [/\bindira\s?nagar\b/i, 'Indiranagar'], [/\bwhitefield\b/i, 'Whitefield'], [/\bWF\b/, 'Whitefield'], [/\bhsr(\s?layout)?\b/i, 'HSR Layout'], [/\bkoramangala\b|\bkora\b/i, 'Koramangala'],
]
const MUST_HAVES: [RegExp, string][] = [
  [/\bOC received\b/i, 'OC received'], [/\bloan pre-?approved\b/i, 'Loan pre-approved'], [/\bnear metro\b/i, 'Near metro'], [/\beast facing\b/i, 'East facing'],
  [/\bNRI\b/, 'NRI buyer'], [/\bgated\b/i, 'Gated community'], [/\bready to move\b/i, 'Ready to move'],
]

/**
 * Reads a requirement forwarded from a brokers' WhatsApp group (🎭: rules, not a model). Finds the mobile number
 * (+91, a leading 0 and spaces allowed), the name after "Client:", "Contact" or "Call", BHK or villa, localities
 * (including "HSR", "Kora", "WF"), the budget ("1.8–2.1 Cr", "90 L") and must-haves. A number posted by a broker
 * ("brokers call", "Properties", "Estates") is flagged, and so is text that reads like a listing.
 */
export function parseGroupMessage(text: string): GroupMessageReading {
  const phoneMatch = text.match(/(?:\+?91[\s-]?|\b0)?([6-9]\d{4})[\s-]?(\d{5})\b/)
  const phone = phoneMatch ? phoneMatch[1] + phoneMatch[2] : undefined
  // The name sits right before the number: "Client: Arnav Sethi 98451…", "Contact Farhan 97390…", "call Manjunath 99000…".
  const nameMatch = text.match(/\b(?:client|contact|call)\b:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:\+?91[\s-]?|0)?[6-9]\d{4}/)
    ?? text.match(/\b(?:Client|Contact|Call)\b:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:\+?91[\s-]?|0)?[6-9]\d{4}/i)
  const name = nameMatch?.[1]
  const bhk = text.match(/\b(\d)\s?BHK\b/i)
  const villa = /\bvilla\b/i.test(text)
  const kind = bhk ? `${bhk[1]} BHK${villa ? ' villa' : ''}` : villa ? 'Villa' : undefined
  const localities: string[] = []
  // Areas in the order the message mentions them.
  const found = AREA_ALIASES.map(([pattern, area]) => ({ area, at: text.search(pattern) })).filter((item) => item.at >= 0).sort((a, b) => a.at - b.at)
  for (const { area } of found) if (!localities.includes(area)) localities.push(area)
  const range = text.match(/(\d+(?:\.\d+)?)\s?(?:[-–]|to)\s?(\d+(?:\.\d+)?)\s?(Cr|crore|L|lakh)\b/i)
  const single = text.match(/(?:budget|₹)\s?(\d+(?:\.\d+)?)\s?(Cr|crore|L|lakh)\b/i) ?? text.match(/\b(\d+(?:\.\d+)?)\s?(Cr|L)\b/)
  let budget: string | undefined
  let budgetCr: number | undefined
  const toCr = (value: number, unit: string) => (/^l/i.test(unit) ? value / 100 : value)
  const trim = (value: number) => String(Number(value.toFixed(2)))
  if (range) {
    const low = toCr(Number(range[1]), range[3]); const high = toCr(Number(range[2]), range[3])
    budget = `₹${trim(low)}–${trim(high)} Cr`; budgetCr = (low + high) / 2
  } else if (single) {
    const value = toCr(Number(single[1]), single[2])
    budget = `₹${trim(value)} Cr`; budgetCr = value
  }
  const mustHaves = MUST_HAVES.filter(([pattern]) => pattern.test(text)).map(([, label]) => label)
  const firm = text.match(/\(([^)]*(?:Estates|Properties|Realty|Realtors)[^)]*)\)/i)?.[1]
  const numberIsBroker = /\bbrokers?\b[^.]*\bcall\b|\bproperties\b|\bestates\b/i.test(text)
  const looksLikeListing = /\b(available|resale|for sale)\b/i.test(text)
  return { phone, name, kind, localities, budget, budgetCr, mustHaves, numberIsBroker, brokerFirm: firm, looksLikeListing }
}

/** "98451 62730" style numbers in a pasted message, masked for the team note. */
export function maskNumbersInText(text: string): string {
  return text.replace(/(?:\+?91[\s-]?|\b0)?([6-9]\d)(\d{2})(\d)[\s-]?(\d{2})(\d{3})\b/g, (_, a) => `${a}XXX XX${_.replace(/\D/g, '').slice(-3)}`)
}

/** The four sample forwards offered in paste mode. */
export const GROUP_MESSAGE_SAMPLES = [
  '*URGENT requirement* 3 BHK in HSR / Koramangala, budget 1.8–2.1 Cr, OC received only. Client: Arnav Sethi 98451 62730. Loan pre-approved.',
  'Need 2 BHK Indiranagar near metro, 1.5–1.7 Cr. Contact Farhan 97390 22814',
  'Client requirement: 4 BHK villa Whitefield, 3.5–4 Cr, NRI visiting next week. Brokers with options call Manjunath 99000 81234 (MG Estates)',
  'Resale available: 2 BHK Indiranagar, 1,150 sq ft, ₹1.65 Cr, east facing. Call 98860 44120',
]
export const BROKER_GROUPS = ['HSR Brokers Network', 'Whitefield Property Connect', 'Bengaluru Realty Partners', 'Other']
