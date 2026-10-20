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
  if (lead.sharedWith) { score -= 5; reasons.push(`also with ~${lead.sharedWith} brokers`) }
  score = Math.max(5, Math.min(98, score))
  return { score, label: score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cool', reasons: reasons.slice(0, 4) }
}

/** Summary of a recorded call: what was discussed and the next step. */
export function callSummary(lead: Lead, durationSec: number): string {
  const minutes = Math.max(1, Math.round(durationSec / 60))
  return `${minutes}-min call. ${firstName(lead.name)} is keen on ${lead.need} around ${lead.budget}; ${lead.mustHave !== 'To confirm' ? `must-haves: ${lead.mustHave.toLowerCase()}. ` : ''}Next step: ${lead.visitScheduled ? 'confirm the visit timing on WhatsApp' : 'share 3 matches and propose a weekend visit'}.`
}

/** Plain-language weekly digest for a manager from the numbers they can see. */
export function weeklyDigest(input: {
  team: string; overdue: number; unassigned: number; stuck: number; topName?: string; topCommissionL?: number; notCheckedIn: number; pipelineCr: number
  /** M14: the developer that owes the most, and its most overdue invoice. */
  owedBy?: { developer: string; amount: string; count: number; overdueBuyer?: string; overdueDays?: number }
  /** M14: developer registrations expiring within 7 days. */
  registrationsExpiring?: number
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
  ]
  return lines.filter(Boolean)
}

