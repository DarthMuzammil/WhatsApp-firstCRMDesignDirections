import { useState } from 'react'
import type { Lead } from '../data/demo'
import { TEAMS, shortName } from '../data/team'
import { QUALIFICATION_QUESTIONS } from '../data/templates'
import { pretendReading } from '../lib/location'
import type { DemoStore } from '../state/useDemoStore'
import { Icon } from './Icon'
import type { View } from './navigation'
import './DemoGuide.css'

const OWNER_ID = 'm-arjun'

type GuideProps = {
  store: DemoStore
  /** Simulates a portal enquiry and returns the new lead (no arrival banner: the guide opens the chat itself). */
  onSimulate: (sourceName: string) => Lead | undefined
  onOpenLead: (lead: Lead) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
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
 * Guided demo (spec §8.16 step 7): a presenter's panel that runs the whole loop with real store actions,
 * one click per step: 99acres enquiry → auto-reply and AI brief → hand to Sales → visit → refused and
 * verified check-ins → outcome → won → leaderboard. Every step can be skipped; nothing here is fake
 * beyond what the rest of the demo already simulates.
 */
export function DemoGuide({ store, onSimulate, onOpenLead, onNavigate, notify, onClose }: GuideProps) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [minimised, setMinimised] = useState(false)
  const [leadId, setLeadId] = useState<number | null>(null)

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
    notify(store.recordVisitStep(visit.id, 'check-in', at).message)
  }

  const steps: Step[] = [
    {
      title: 'A buyer enquires on 99acres',
      say: 'The enquiry lands in Daira within seconds: routed to Pre-sales, an automatic WhatsApp reply goes out, and the portal’s “also sent to other brokers” warning shows.',
      action: 'Send a 99acres enquiry',
      run: () => {
        store.setViewer(OWNER_ID)
        const arrived = onSimulate('99acres')
        if (!arrived) { notify('Connect 99acres in Lead sources to run the guided demo'); return }
        setLeadId(arrived.id)
        onOpenLead(arrived)
      },
    },
    {
      title: 'Auto-qualification and the AI brief',
      say: 'Daira asks the qualifying questions on WhatsApp; AI turns the answers into a buyer brief. Nothing changes until a person accepts it.',
      action: 'Accept the AI brief',
      // Ready once every question is answered and AI has suggestions (or someone already accepted them in the lead panel).
      ready: (!!leadId && store.qualifyStepFor(leadId) >= QUALIFICATION_QUESTIONS.length * 2 && !!store.aiSuggestionsFor(leadId)) || (!!lead && lead.budget !== 'Budget to qualify'),
      waiting: 'Waiting for the buyer’s answers…',
      run: () => { if (leadId) store.acceptSuggestions(leadId); open() },
    },
    {
      title: 'Pre-sales hands over to Sales',
      say: `The qualified lead goes to ${agentName} in the ${lead?.locality ?? ''} team. ${agentName} gets a notification, and the hand-over is in the Owner’s audit log.`,
      action: `Hand to ${agentName}`,
      run: () => { if (leadId && agent) store.reassignLead(leadId, agent.id, 'Qualified by Pre-sales'); open() },
    },
    {
      title: 'Share a match and book the visit',
      say: `Matches come with reasons. ${property?.name ?? 'The best match'} is shared on WhatsApp and a visit is booked for today, confirmed to the buyer.`,
      action: 'Share and book for 4:00 PM',
      run: () => {
        if (!leadId || !property || !agent || !lead) return
        store.shareProperties(leadId, [property.id], `Hi ${lead.name.split(' ')[0]}, ${property.name} fits your brief well. Would you like to visit?`)
        store.sendMessage(leadId, store.scheduleVisit(leadId, { day: 0, time: '4:00 PM', propertyId: property.id, agentId: agent.id }))
        open()
      },
    },
    {
      title: `Switch to ${agentName}’s phone`,
      say: `Field agents use Daira on their phone. ${agentName}’s Visits screen shows today’s visit with Left office, Check in and Check out.`,
      action: `View as ${agentName}`,
      run: () => { if (agent) store.setViewer(agent.id); onNavigate('visits') },
    },
    {
      title: 'A check-in from the wrong place is refused',
      say: 'Checking in 1.4 km from the property is refused, and the manager and Owner are told. Location is read once, at the tap: no tracking, no live map.',
      action: 'Check in from 1.4 km away',
      ready: !!visit,
      run: () => checkIn('far'),
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
      run: () => { store.setViewer(OWNER_ID); onNavigate('reports') },
    },
  ]

  const finished = index >= steps.length
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
      {finished ? <>
        <h2>That’s the full loop</h2>
        <p>From a portal enquiry to a won deal and a moving leaderboard, with every step on the lead’s timeline. Reset demo data before the next client.</p>
        <footer><button className="btn btn-primary" onClick={onClose}>Finish</button></footer>
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
