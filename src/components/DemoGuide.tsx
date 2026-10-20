import { useState } from 'react'
import type { Lead } from '../data/demo'
import { TEAMS, shortName } from '../data/team'
import { QUALIFICATION_QUESTIONS } from '../data/templates'
import { dayLabel, formatLakh } from '../lib/format'
import { bookingStatus, developerOfProject, reminderText } from '../data/channelPartner'
import { pretendReading } from '../lib/location'
import type { DemoStore } from '../state/useDemoStore'
import { Icon } from './Icon'
import type { Notify } from './Toast'
import type { View } from './navigation'
import './DemoGuide.css'

const OWNER_ID = 'm-arjun'

type GuideProps = {
  store: DemoStore
  /** Simulates a portal enquiry and returns the new lead (no arrival banner: the guide opens the chat itself). */
  onSimulate: (sourceName: string) => Lead | undefined
  onOpenLead: (lead: Lead) => void
  onNavigate: (view: View, param?: string) => void
  notify: Notify
  onClose: () => void
}

type Step = {
  title: string
  /** What the presenter points out while the step runs. */
  say: string
  action: string
  run: () => void
  /** False while the step is waiting for something (e.g. the buyer's scripted answers). */
  ready?: boolean
  waiting?: string
}

/**
 * Guided demo (spec §3.16): a presenter's panel that runs the whole loop with real store actions, one click per
 * step: Owner's team home → 99acres enquiry → auto-reply and AI brief → the telecaller's call queue → hand to Sales
 * → share and book a visit → Remind me → refused and verified check-ins → outcome → won → leaderboard. Every step can be skipped; nothing here is fake
 * beyond what the rest of the demo already simulates.
 */
export function DemoGuide({ store, onSimulate, onOpenLead, onNavigate, notify, onClose }: GuideProps) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [leadId, setLeadId] = useState<number | null>(null)
  // After the 12 steps: the optional M14 bonus (money developers owe you).
  const [bonus, setBonus] = useState<'off' | 'ready' | 'done'>('off')
  // The Pre-sales person routing gave the enquiry to (Lakshmi Narayan on fresh data).
  const [presalesId, setPresalesId] = useState<string | null>(null)
  const presales = presalesId ? store.findMember(presalesId) : undefined
  const presalesName = shortName(presales?.name ?? 'Pre-sales')

  const lead = leadId === null ? undefined : store.findLead(leadId)
  // The salesperson in the lead's locality team (falls back to Priya for areas without a team).
  const teamId = TEAMS.find((team) => team.locality === lead?.locality)?.id
  const agent = store.members.find((person) => person.teamId === teamId && person.roles.includes('sales') && person.status === 'active') ?? store.findMember('m-priya')
  const agentName = shortName(agent?.name ?? 'the agent')
  const property = lead ? store.bestMatch(lead) : undefined
  const visit = store.visits.find((item) => item.leadId === leadId && item.day === 0)
  const agreedCr = property ? Math.round(property.priceCr * 0.98 * 100) / 100 : 0
  const open = () => { if (lead) onOpenLead(lead) }
  const reading = (mode: 'far' | 'client') => (property ? pretendReading(mode, property, store.officeFor(agent)) : undefined)
  const checkIn = (mode: 'far' | 'client') => {
    const at = reading(mode)
    if (!visit || !at) return
    const result = store.recordVisitStep(visit.id, 'check-in', at)
    notify(result.message, result.ok ? 'success' : 'warning')
  }

  // "Remind me" in the demo: call back on the coming Thursday (a week today if today is Thursday).
  const thursday = (4 - new Date().getDay() + 7) % 7 || 7

  const steps: Step[] = [
    {
      title: 'The Owner’s morning',
      say: 'Arjun opens Bayana to his team’s day: overdue replies, who hasn’t checked in, visits and leave requests, each one tap away, with an AI digest of what needs attention.',
      action: 'Show the team home',
      run: () => { store.setViewer(OWNER_ID); onNavigate('today') },
    },
    {
      title: 'A buyer enquires on 99acres',
      say: 'The enquiry lands in Bayana within seconds: routed to Pre-sales, an automatic WhatsApp reply goes out, and the portal’s “also sent to other brokers” warning shows.',
      action: 'Send a 99acres enquiry',
      run: () => {
        store.setViewer(OWNER_ID)
        const arrived = onSimulate('99acres')
        if (!arrived) { notify('Connect 99acres in Lead sources to run the guided demo'); return }
        setLeadId(arrived.id)
        setPresalesId(arrived.ownerId)
        onOpenLead(arrived)
      },
    },
    {
      title: 'Auto-qualification and the AI brief',
      say: 'Bayana asks the qualifying questions on WhatsApp; AI turns the answers into a buyer brief. Nothing changes until a person accepts it.',
      action: 'Accept the AI brief',
      // Ready once every question is answered and AI has suggestions (or someone already accepted them in the lead panel).
      ready: (!!leadId && store.qualifyStepFor(leadId) >= QUALIFICATION_QUESTIONS.length * 2 && !!store.aiSuggestionsFor(leadId)) || (!!lead && lead.budget !== 'Budget to qualify'),
      waiting: 'Waiting for the buyer’s answers…',
      run: () => { if (leadId) store.acceptSuggestions(leadId); open() },
    },
    {
      title: `${presalesName}’s call queue`,
      say: `Telecallers see a queue, not a dashboard: up next is the buyer to call, with Call now and Message. Telecallers see only their own leads, with phone numbers masked.`,
      action: `View as ${presalesName}`,
      run: () => { if (presalesId) store.setViewer(presalesId); onNavigate('today') },
    },
    {
      title: 'Pre-sales hands over to Sales',
      say: `Qualified: ${presalesName} taps Hand to Sales in the chat. The lead goes to ${agentName} in the ${lead?.locality ?? ''} team, who gets a notification; the hand-over is in the Owner’s audit log.`,
      action: `Hand to ${agentName}`,
      run: () => {
        if (!leadId || !agent) return
        store.reassignLead(leadId, agent.id, 'Qualified by Pre-sales')
        // Now it's the salesperson's lead: carry on as them.
        store.setViewer(agent.id)
        open()
      },
    },
    {
      title: 'Share a match and book the visit',
      say: `Now on ${agentName}’s phone. Matches come with reasons: ${property?.name ?? 'the best match'} is shared on WhatsApp and a visit is booked for today, confirmed to the buyer.`,
      action: 'Share and book for 4:00 PM',
      run: () => {
        if (!leadId || !property || !agent || !lead) return
        store.shareProperties(leadId, [property.id], `Hi ${lead.name.split(' ')[0]}, ${property.name} fits your brief well. Would you like to visit?`)
        store.sendMessage(leadId, store.scheduleVisit(leadId, { day: 0, time: '4:00 PM', propertyId: property.id, agentId: agent.id }))
        open()
      },
    },
    {
      title: 'A follow-up in four taps',
      say: `Remind me → Call back → Thursday → Set reminder. It lands in ${agentName}’s Follow-ups under Coming up, with a Call button, and on the lead’s timeline.`,
      action: 'Remind me: call back Thursday',
      run: () => {
        if (!leadId) return
        store.addTask(leadId, { title: 'Call back', day: thursday, time: '11:00 AM', channel: 'Call' })
        onNavigate('tasks')
        notify(`Reminder set · ${dayLabel(thursday)} at 11:00 AM`)
      },
    },
    {
      title: 'A check-in from the wrong place is refused',
      say: `${agentName}’s Visits screen shows today’s visit with Left office, Check in and Check out. Checking in 1.4 km from the property is refused, and the manager and Owner are told. Location is read once, at the tap: no tracking, no live map.`,
      action: 'Check in from 1.4 km away',
      ready: !!visit,
      run: () => { onNavigate('visits'); checkIn('far') },
    },
    {
      title: 'A verified check-in at the property',
      say: 'Within 200 m of the address the check-in is verified, with the distance and time on the lead’s timeline.',
      action: 'Check in at the property',
      ready: !!visit,
      run: () => checkIn('client'),
    },
    {
      title: 'Visit outcome',
      say: 'Checking out asks what the buyer thought and the next step, so managers see outcomes, not just attendance.',
      action: 'Check out: the buyer liked it',
      ready: visit?.status === 'checked-in',
      run: () => {
        const at = reading('client')
        if (!visit || !at) return
        store.recordVisitStep(visit.id, 'check-out', at)
        store.completeVisit(visit.id, { result: 'Liked it', feedback: 'Liked the layout and the light; wants to negotiate.', nextStep: 'Send the owner an offer' })
        notify('Visit completed: the buyer liked it')
      },
    },
    {
      title: 'Negotiate and win',
      say: `The buyer offers, the owner counters, and every offer is kept with its date, along with the token, documents and commission split. ${agentName} marks it won at ₹${agreedCr} Cr; the manager and Owner are notified.`,
      action: 'Mark the deal won',
      run: () => {
        if (!leadId || !property || !agent) return
        store.setStage(leadId, 3)
        store.updateDeal(leadId, {
          askedCr: property.priceCr, agreedCr, tokenL: 5, tokenDay: 0, agreementDay: 14,
          offers: [{ id: Date.now(), by: 'buyer', amountCr: Math.round(property.priceCr * 0.94 * 100) / 100, day: 0 }, { id: Date.now() + 1, by: 'owner', amountCr: agreedCr, day: 0 }],
          docs: { kyc: true, token: true, agreement: false }, split: [{ memberId: agent.id, pct: 100 }],
        })
        store.closeLead(leadId, { result: 'won' }, agreedCr)
        onNavigate('pipeline')
        notify(`${lead?.name} won at ₹${agreedCr} Cr`)
      },
    },
    {
      title: 'The leaderboard moves',
      say: `Back as the Owner: ${agentName}’s commission this month goes up by ₹${(agreedCr * 2).toFixed(1)} L (2% fee), live on the leaderboard. Check the bell and the audit log too.`,
      action: 'View as the Owner',
      run: () => {
        store.setViewer(OWNER_ID)
        onNavigate('reports')
        notify(`${agentName}: +₹${(agreedCr * 2).toFixed(1)} L commission this month`)
        // Bring the salesperson's bar into view and pulse it, so the change is visible without hunting.
        window.setTimeout(() => {
          const row = [...document.querySelectorAll<HTMLElement>('.reports-grid .bar-list li')].find((item) => item.textContent?.includes(agent?.name ?? '-'))
          if (!row) return
          row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          row.classList.add('demo-spotlight')
          window.setTimeout(() => row.classList.remove('demo-spotlight'), 6000)
        }, 400)
      },
    },
  ]

  const finished = index >= steps.length
  /** M14 bonus: as the Owner, open Brokerage on Overdue with the most overdue invoice and send the gentle reminder. */
  function runBonus() {
    // The most overdue invoice (Rajiv Menezes, 43 days past Halcyon's terms, on fresh data).
    const days = (booking: (typeof store.cp.bookings)[number]) => { const status = bookingStatus(booking); return status.kind === 'overdue' ? status.days : 0 }
    const oldest = store.cp.overdue(store.cp.bookings).sort((a, b) => days(b) - days(a))[0]
    store.setViewer(OWNER_ID)
    if (!oldest) { onNavigate('brokerage', 'overdue'); setBonus('done'); return }
    store.cp.sendReminder(oldest.id, 'gentle', reminderText(oldest, 'gentle', store.findMember(OWNER_ID)?.name ?? 'Arjun Khanna', oldest.invoice ? dayLabel(oldest.invoice.day) : ''))
    onNavigate('brokerage', `overdue#${oldest.id}`)
    const developer = developerOfProject(oldest.projectId)
    notify(`Reminder sent to ${developer?.cpManager.name} (${developer?.name})`)
    setBonus('done')
  }
  const step = steps[Math.min(index, steps.length - 1)]
  const ready = step.ready ?? true
  const next = () => { setIndex(index + 1); setDone(false) }

  if (minimised) {
    return (
      <button className="demo-guide-pill" onClick={() => setMinimised(false)} aria-label="Show the guided demo">
        <Icon name="play" size={14} /> Demo · {finished ? 'done' : `step ${index + 1} of ${steps.length}`}
      </button>
    )
  }

  return (
    <aside className="demo-guide" aria-label="Guided demo">
      <header>
        <span className="eyebrow">Guided demo · {finished ? 'done' : `step ${index + 1} of ${steps.length}`}</span>
        <span className="demo-guide-buttons">
          <button className="icon-button" aria-label="Minimise the guided demo" onClick={() => setMinimised(true)}><Icon name="chevron" size={16} /></button>
          <button className="icon-button" aria-label="End the guided demo" onClick={onClose}><Icon name="close" size={16} /></button>
        </span>
      </header>
      <div className="demo-guide-progress" aria-hidden="true"><i style={{ width: `${(Math.min(index, steps.length) / steps.length) * 100}%` }} /></div>
      {finished && bonus !== 'off' ? <>
        <h2>Bonus: money developers owe you</h2>
        <p>Developers pay brokerage late. Arjun sees {formatLakh(store.cp.pending(store.cp.bookings).lakh)} pending and {store.cp.overdue(store.cp.bookings).length} overdue, and chases the most overdue invoice in one tap: a gentle WhatsApp reminder to the developer’s CP manager, who replies a few seconds later.</p>
        <footer>
          {bonus === 'ready'
            ? <button className="btn btn-primary" onClick={runBonus}>Chase the most overdue invoice</button>
            : <button className="btn btn-primary" onClick={onClose}>Finish</button>}
        </footer>
      </> : finished ? <>
        <h2>That’s the full loop</h2>
        <p>From the Owner’s morning and a portal enquiry, through the telecaller’s queue and the field visit, to a won deal and a moving leaderboard, with every step on the lead’s timeline. Reset demo data before the next client.</p>
        <footer>
          <button className="btn btn-secondary demo-guide-bonus" onClick={() => setBonus('ready')}>Bonus: money developers owe you</button>
          <button className="btn btn-primary" onClick={onClose}>Finish</button>
        </footer>
      </> : <>
        <h2>{step.title}</h2>
        <p>{step.say}</p>
        <footer>
          <button className="demo-guide-skip" onClick={next}>Skip</button>
          {done
            ? <button className="btn btn-primary" onClick={next}>Next step <Icon name="arrow" size={16} /></button>
            : <button className="btn btn-primary" disabled={!ready} onClick={() => { step.run(); setDone(true) }}>{ready ? step.action : step.waiting ?? 'Waiting…'}</button>}
        </footer>
      </>}
    </aside>
  )
}
