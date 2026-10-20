import { useEffect, useRef, useState, type FormEvent } from 'react'
import { STAGES, STAGE_SHORT_LABELS, firstName, relativeMinutes, type Lead } from '../data/demo'
import { DOC_LABELS, OFFER_BY_LABELS, staleOfferDays, type DealDocs } from '../data/deals'
import { roleSummary, shortName } from '../data/team'
import { Avatar, LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { HeatBadge } from '../components/HeatBadge'
import { Icon } from '../components/Icon'
import { LeadActions, type LeadActionHandlers } from '../components/LeadActions'
import { LeadNotes } from '../components/LeadNotes'
import { LeadTags } from '../components/LeadTags'
import { LeadTimeline } from '../components/LeadTimeline'
import { PropertyCard } from '../components/PropertyCard'
import { clockMinutesAgo, dayLabel, dayOfMinutesAgo, onDayLabel } from '../lib/format'
import { BROKERAGE } from '../data/brand'
import { areaLabel, bedroomsLabel, priceLabel } from '../data/inventory'
import type { View } from '../components/navigation'
import { AssignDialog } from '../modals/AssignDialog'
import { EditLeadDialog } from '../modals/EditLeadDialog'
import { DealDialog, LostDialog } from '../modals/DealDialog'
import { ShareDialog } from '../modals/ShareDialog'
import { ReminderDialog } from '../modals/ReminderDialog'
import { RegisterDialog, RegistrationDisputeDialog, RenewDialog } from '../modals/RegistrationDialogs'
import { LeadRegistrations, type RegistrationAction } from '../components/LeadRegistrations'
import { ScheduleVisitDialog } from '../modals/ScheduleVisitDialog'
import { TemplateDialog } from '../modals/TemplateDialog'
import { QUALIFICATION_QUESTIONS } from '../data/templates'
import { draftReplies, leadScore } from '../lib/ai'
import { SYSTEM_ID, type ChatEntry, type DemoStore } from '../state/useDemoStore'
import './ChatView.css'

type ChatViewProps = {
  lead: Lead
  store: DemoStore
  onBack: () => void
  onCall: (lead: Lead) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}

/**
 * WhatsApp conversation with a lead.
 * Desktop/tablet: the lead's details sit in a side panel.
 * Phone: a "Details" button in the chat header opens the same details as a bottom sheet.
 */
export function ChatView({ lead, store, onBack, onCall, onNavigate, notify }: ChatViewProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'reassign' | 'handoff' | null>(null)
  const [editing, setEditing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [dealMode, setDealMode] = useState<'edit' | 'win' | 'lost' | null>(null)
  const [sharing, setSharing] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [registrationAction, setRegistrationAction] = useState<RegistrationAction | null>(null)
  const actionRegistration = registrationAction && registrationAction.kind !== 'register' ? store.cp.findRegistration(registrationAction.id) : undefined
  // Pre-sales hand a lead they own to Sales (when the company has a separate pre-sales team).
  const canHandOff = store.settings.separatePresales && store.viewerCan('handToSales') && !store.viewerCan('reassignLeads') && lead.ownerId === store.viewer.id
  const actions: LeadActionHandlers = {
    shareHomes: () => { setDetailsOpen(false); setSharing(true) },
    // Booked already: go to the visit; otherwise pick a day and time. Only for people who run visits.
    scheduleVisit: store.viewerCan('handleVisits') ? () => (lead.visitScheduled ? onNavigate('visits') : setScheduling(true)) : undefined,
    handToSales: canHandOff ? () => setAssignMode('handoff') : undefined,
    remind: () => setReminding(true),
  }
  return (
    <div className="chat-layout">
      <ChatPanel lead={lead} store={store} actions={actions} onBack={onBack} onCall={() => onCall(lead)} onShowDetails={() => setDetailsOpen(true)} />
      <aside className="lead-detail"><LeadDetails lead={lead} store={store} actions={actions} onAssign={setAssignMode} onEdit={() => setEditing(true)} onDeal={setDealMode} onRegistration={setRegistrationAction} /></aside>
      {detailsOpen && (
        <Dialog label={`${lead.name} details`} variant="sheet" onClose={() => setDetailsOpen(false)}>
          <header className="lead-detail-sheet-head">
            <strong>Lead details</strong>
            <button className="icon-button bordered" onClick={() => setDetailsOpen(false)} aria-label="Close"><Icon name="close" /></button>
          </header>
          <div className="lead-detail-sheet-body dialog-scroll"><LeadDetails lead={lead} store={store} actions={actions} onAssign={(mode) => { setDetailsOpen(false); setAssignMode(mode) }} onEdit={() => { setDetailsOpen(false); setEditing(true) }} onDeal={(mode) => { setDetailsOpen(false); setDealMode(mode) }} onRegistration={(action) => { setDetailsOpen(false); setRegistrationAction(action) }} /></div>
        </Dialog>
      )}
      {registrationAction?.kind === 'register' && <RegisterDialog lead={lead} store={store} onClose={() => setRegistrationAction(null)} onSaved={(message) => { setRegistrationAction(null); notify(message) }} />}
      {registrationAction?.kind === 'renew' && actionRegistration && <RenewDialog registration={actionRegistration} store={store} onClose={() => setRegistrationAction(null)} onSaved={(message) => { setRegistrationAction(null); notify(message) }} />}
      {(registrationAction?.kind === 'dispute' || registrationAction?.kind === 'resolve') && actionRegistration && <RegistrationDisputeDialog registration={actionRegistration} store={store} mode={registrationAction.kind} onClose={() => setRegistrationAction(null)} onSaved={(message) => { setRegistrationAction(null); notify(message) }} />}
      {reminding && <ReminderDialog lead={lead} store={store} onClose={() => setReminding(false)} onSaved={(message) => { setReminding(false); notify(message) }} />}
      {sharing && <ShareDialog store={store} lead={lead} onClose={() => setSharing(false)} onSent={(message) => { setSharing(false); notify(message) }} />}
      {(dealMode === 'edit' || dealMode === 'win') && (
        <DealDialog lead={lead} store={store} mode={dealMode} onClose={() => setDealMode(null)} onSaved={(message) => { setDealMode(null); notify(message) }} />
      )}
      {dealMode === 'lost' && (
        <LostDialog lead={lead} onClose={() => setDealMode(null)} onConfirm={(reason) => { store.closeLead(lead.id, { result: 'lost', reason }); setDealMode(null); notify(`${lead.name} marked lost`) }} />
      )}
      {scheduling && (
        <ScheduleVisitDialog
          lead={lead}
          store={store}
          onBooked={(confirmation) => {
            setScheduling(false)
            if (confirmation) store.sendMessage(lead.id, confirmation)
            notify('Visit booked · confirmation sent on WhatsApp')
          }}
          onClose={() => setScheduling(false)}
        />
      )}
      {editing && (
        <EditLeadDialog
          lead={lead}
          onSave={(edit) => { store.updateLeadProfile(lead.id, edit); setEditing(false); notify('Buyer brief saved') }}
          onClose={() => setEditing(false)}
        />
      )}
      {assignMode === 'reassign' && (
        <AssignDialog
          title={lead.ownerId ? `Reassign ${lead.name}` : `Assign ${lead.name}`}
          description="The new owner gets the conversation, tasks and visits. The change is recorded on the lead."
          candidates={store.assignableMembers.filter((person) => person.id !== lead.ownerId)}
          openLeadCount={store.openLeadCount}
          reasons={['Workload balance', 'Locality expertise', 'Leave cover', 'Buyer request', 'Other']}
          confirmLabel={lead.ownerId ? 'Reassign lead' : 'Assign lead'}
          onConfirm={(memberId, reason) => {
            store.reassignLead(lead.id, memberId, reason)
            setAssignMode(null)
            notify(`${lead.name} assigned to ${store.findMember(memberId)?.name}`)
          }}
          onClose={() => setAssignMode(null)}
        />
      )}
      {assignMode === 'handoff' && (
        <AssignDialog
          title="Hand to Sales"
          description={`${firstName(lead.name)} is qualified. Pick the salesperson who will take the visit and the deal.`}
          candidates={store.members.filter((person) => person.status === 'active' && person.roles.includes('sales'))}
          openLeadCount={store.openLeadCount}
          confirmLabel="Hand over"
          onConfirm={(memberId) => {
            store.reassignLead(lead.id, memberId, 'Qualified by Pre-sales')
            setAssignMode(null)
            notify(`${lead.name} handed to ${store.findMember(memberId)?.name}`)
          }}
          onClose={() => setAssignMode(null)}
        />
      )}
    </div>
  )
}

type ChatPanelProps = { lead: Lead; store: DemoStore; actions: LeadActionHandlers; onBack: () => void; onCall: () => void; onShowDetails: () => void }

function ChatPanel({ lead, store, actions, onBack, onCall, onShowDetails }: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const [menu, setMenu] = useState<'attach' | 'drafts' | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const chat = store.chatFor(lead.id)
  const shares = store.sharesFor(lead.id)
  const introProperty = store.introProperty(lead)
  const bestMatch = store.bestMatch(lead)
  // WhatsApp allows free text only within 24 h of the buyer's last message (spec §8.4).
  const windowClosed = store.serviceWindowClosed(lead)

  // Auto-qualification for leads that arrived in the demo: question, answer, question… one every ~1.4 s.
  // The step is stored, so leaving and coming back continues where it stopped.
  const qualifying = !!lead.freshEnquiry && !!lead.answers && store.settings.autoReply.enabled && store.settings.autoReply.qualify
  const step = store.qualifyStepFor(lead.id)
  const qualifyDone = step >= QUALIFICATION_QUESTIONS.length * 2
  useEffect(() => {
    if (!qualifying || qualifyDone || !lead.answers) return
    const timer = window.setTimeout(() => {
      const question = QUALIFICATION_QUESTIONS[Math.floor(step / 2)]
      if (step % 2 === 0) {
        store.sendMessage(lead.id, question.ask, { from: 'auto' })
      } else if (question.key === 'budget') {
        store.sendMessage(lead.id, `${lead.answers!.budget} is my range.`, { from: 'buyer' })
        store.suggestProfile(lead.id, { budget: lead.answers!.budget, budgetCr: lead.answers!.budgetCr })
      } else if (question.key === 'need') {
        store.sendMessage(lead.id, `${lead.need}, ideally.`, { from: 'buyer' })
        store.suggestProfile(lead.id, { need: lead.need, locality: lead.locality, localities: [lead.locality] })
      } else {
        store.sendMessage(lead.id, `${lead.answers!.moveIn}.`, { from: 'buyer' })
        store.suggestProfile(lead.id, { moveIn: lead.answers!.moveIn })
      }
      store.setQualifyStep(lead.id, step + 1)
    }, step === 0 ? 1200 : 1400)
    return () => window.clearTimeout(timer)
  }, [qualifying, qualifyDone, step, lead.id]) // store functions are recreated every render; the step drives this effect

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat.length])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || windowClosed) return
    store.sendMessage(lead.id, draft.trim())
    setDraft('')
  }

  function fillDraft(text: string) {
    setDraft(text)
    setMenu(null)
  }

  // Seeded history: the first enquiry came in a few days before the latest message for leads past
  // "New lead", and about 20 minutes before it for new ones. Times count back from now.
  const seedStart = lead.minutesAgo + (lead.stage >= 1 ? 4 * 24 * 60 + 35 : 20)

  const quickReplies = lead.addedInDemo || lead.freshEnquiry
    ? [{ label: 'Send a welcome message', text: `Hi ${firstName(lead.name)}, thanks for reaching out! I’m ${firstName(store.viewer.name)} from ${BROKERAGE.name}. When is a good time to talk about your ${lead.need}?` }]
    : [
        { label: 'Suggest a time', text: 'Saturday works. Would 11:30 AM suit you?' },
        { label: 'Share location', text: 'I’ll share the location pin right away.' },
      ]

  return (
    <section className="chat-panel">
      <header className="chat-head">
        <button className="icon-button" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        <LeadAvatar lead={lead} size="sm" showStatus />
        <div className="chat-person">
          <strong>{lead.name}</strong>
          <span>{lead.addedInDemo ? `New lead · ${store.displayPhone(lead.phone)}` : lead.online ? 'Online on WhatsApp' : `Last seen ${relativeMinutes(lead.minutesAgo)} ago`}</span>
        </div>
        <button className="icon-button chat-details-button" aria-label={`${lead.name} details`} onClick={onShowDetails}><Icon name="info" /></button>
        <button className="icon-button" aria-label={`Call ${lead.name}`} onClick={onCall}><Icon name="phone" /></button>
      </header>

      <div className="chat-context">
        <Icon name="spark" size={14} />
        <p><strong>Brief</strong> {lead.need} · {lead.budget} · {lead.moveIn}</p>
      </div>

      <div className="chat-actions"><LeadActions lead={lead} actions={actions} visitLabel={store.upcomingVisits.find((visit) => visit.leadId === lead.id)?.when} /></div>

      <div className="messages" ref={messagesRef}>
        {(lead.addedInDemo || lead.freshEnquiry) && <span className="day-label">Today</span>}
        {lead.addedInDemo ? (
          <p className="chat-note">Lead captured just now. Say hello on WhatsApp to start the conversation.</p>
        ) : lead.freshEnquiry ? (
          <div className="message theirs">{lead.enquiry}<time>Just now</time></div>
        ) : <>
          <span className="day-label">{dayOfMinutesAgo(seedStart)}</span>
          <div className="message theirs">{lead.enquiry}<time>{clockMinutesAgo(seedStart)}</time></div>
          <div className="message mine message-auto"><span className="message-tag">Automatic</span>Hi {firstName(lead.name)}, thanks for reaching out to {BROKERAGE.name}! A property expert will reply in a few minutes.<time>{clockMinutesAgo(seedStart)} <Icon name="check" size={12} /></time></div>
          <div className="message mine">Hi {firstName(lead.name)}! Yes, I have a strong match within your {lead.budget} budget. Sharing it here.<time>{clockMinutesAgo(seedStart - 2)} <Icon name="check" size={12} /></time></div>
          <div className="message mine message-property"><PropertyCard property={introProperty} /><time>{clockMinutesAgo(seedStart - 2)} <Icon name="check" size={12} /></time></div>
          {dayOfMinutesAgo(lead.minutesAgo) !== dayOfMinutesAgo(seedStart) && <span className="day-label">{dayOfMinutesAgo(lead.minutesAgo)}</span>}
          <div className="message theirs">{lead.message}<time>{clockMinutesAgo(lead.minutesAgo)}</time></div>
          {chat.length > 0 && dayOfMinutesAgo(lead.minutesAgo) !== 'Today' && <span className="day-label">Today</span>}
        </>}
        {chat.map((entry, index) => (
          <div key={index} className={`message new-message ${entry.from === 'buyer' ? 'theirs' : 'mine'} ${entry.from === 'auto' ? 'message-auto' : ''} ${entry.propertyIds ? 'message-shared' : ''}`}>
            {entry.from === 'auto' && <span className="message-tag">Automatic</span>}
            {entry.template && <span className="message-tag">Template · {entry.template}</span>}
            {entry.text}
            {entry.propertyIds && <span className="message-cards">{entry.propertyIds.map(store.findProperty).filter((item) => !!item).map((item) => <PropertyCard key={item.id} property={item} />)}</span>}
            <time>{entry.at}{entry.delivery ? <DeliveryTicks state={entry.delivery} /> : entry.from !== 'buyer' && <> <Icon name="check" size={12} /></>}{entry.propertyIds?.every((id) => shares.find((share) => share.propertyId === id)?.seen) && <span className="message-seen">Seen</span>}</time>
          </div>
        ))}
        {qualifying && !qualifyDone && <p className="chat-typing" aria-live="polite">Auto-qualifying… {Math.floor(step / 2) + 1} of {QUALIFICATION_QUESTIONS.length}</p>}
        {qualifying && qualifyDone && store.aiSuggestionsFor(lead.id) && (
          <button className="chat-note chat-note-ai" onClick={onShowDetails}><Icon name="spark" size={14} /> AI read the answers and suggested brief fields. Review them in the lead details.</button>
        )}
      </div>

      {windowClosed ? (
        <div className="window-closed" role="note">
          <Icon name="clock" size={16} />
          <span><strong>Outside WhatsApp’s 24-hour window</strong><small>The buyer last wrote {relativeMinutes(lead.minutesAgo)} ago. Only approved templates can be sent.</small></span>
          <button className="btn btn-primary" onClick={() => setTemplatesOpen(true)}>Use a template</button>
        </div>
      ) : <>
        <div className="chip-row quick-replies">
          {quickReplies.map((reply) => <button key={reply.label} className="chip chip-success" onClick={() => fillDraft(reply.text)}>{reply.label}</button>)}
          <button className="chip" onClick={() => setTemplatesOpen(true)}><Icon name="whatsapp" size={14} /> Templates</button>
        </div>

        <form className="composer" onSubmit={submit}>
          {menu === 'attach' && (
            <div className="attachment-menu">
              <button type="button" onClick={() => fillDraft(`Sharing ${bestMatch.name} with you: ${bedroomsLabel(bestMatch)}, ${areaLabel(bestMatch)}, ${priceLabel(bestMatch)}.`)}><Icon name="home" size={16} /> Property</button>
              <button type="button" onClick={() => fillDraft('Sharing the location pin for our visit.')}><Icon name="pin" size={16} /> Location</button>
            </div>
          )}
          {menu === 'drafts' && (
            <div className="attachment-menu draft-menu" role="menu" aria-label="AI reply drafts">
              <span className="eyebrow"><Icon name="spark" size={12} /> AI drafts · edit before sending</span>
              {draftReplies(lead, store.viewer.name).map((item) => (
                <button type="button" role="menuitem" key={item.language} onClick={() => fillDraft(item.text)}><small>{item.language}</small>{item.text}</button>
              ))}
            </div>
          )}
          <button type="button" className="icon-button" aria-label={menu === 'attach' ? 'Close attachments' : 'Attach'} aria-expanded={menu === 'attach'} onClick={() => setMenu(menu === 'attach' ? null : 'attach')}>
            <Icon name={menu === 'attach' ? 'close' : 'plus'} />
          </button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a WhatsApp message…" aria-label="Message" />
          <button type="button" className="icon-button draft-button" aria-label="AI reply drafts" aria-expanded={menu === 'drafts'} onClick={() => setMenu(menu === 'drafts' ? null : 'drafts')}><Icon name="spark" /></button>
          <button className="send-button" aria-label="Send" disabled={!draft.trim()}><Icon name="send" /></button>
        </form>
      </>}

      {templatesOpen && (
        <TemplateDialog
          lead={lead}
          store={store}
          onClose={() => setTemplatesOpen(false)}
          onSend={(text, label) => { store.sendMessage(lead.id, text, { template: label }); setTemplatesOpen(false) }}
        />
      )}
    </section>
  )
}

type LeadDetailsProps = {
  lead: Lead
  store: DemoStore
  actions: LeadActionHandlers
  onAssign: (mode: 'reassign' | 'handoff') => void
  onEdit: () => void
  onDeal: (mode: 'edit' | 'win' | 'lost') => void
  onRegistration: (action: RegistrationAction) => void
}
type DetailsTab = 'overview' | 'timeline' | 'notes'

/**
 * Everything about a lead, in three tabs. Rendered in the desktop side panel and in the phone details sheet.
 * Overview runs from what matters when replying (owner, stage and budget, AI score, deal,
 * matching homes) to reference details (buyer brief, tags); ownership history is folded away.
 */
function LeadDetails({ lead, store, actions, onAssign, onEdit, onDeal, onRegistration }: LeadDetailsProps) {
  const [tab, setTab] = useState<DetailsTab>('overview')
  const notes = store.notesFor(lead.id)
  const timeline = store.timelineFor(lead.id)
  const tabs: { id: DetailsTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: `Timeline · ${timeline.length}` },
    { id: 'notes', label: notes.length > 0 ? `Notes · ${notes.length}` : 'Notes' },
  ]
  return <>
    <div className="segmented lead-detail-tabs" role="tablist" aria-label="Lead details">
      {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>
    {tab === 'overview' && <LeadOverview lead={lead} store={store} actions={actions} onAssign={onAssign} onEdit={onEdit} onDeal={onDeal} onRegistration={onRegistration} />}
    {tab === 'timeline' && <LeadTimeline events={timeline} findMember={store.findMember} />}
    {tab === 'notes' && <LeadNotes notes={notes} onAdd={(text) => store.addNote(lead.id, text)} findMember={store.findMember} />}
  </>
}

function LeadOverview({ lead, store, actions, onAssign, onEdit, onDeal, onRegistration }: LeadDetailsProps) {
  const owner = store.findMember(lead.ownerId)
  const canReassign = store.viewerCan('reassignLeads')
  const canHandOff = store.settings.separatePresales && store.viewerCan('handToSales') && lead.ownerId === store.viewer.id
  const history = store.assignments.filter((entry) => entry.leadId === lead.id)
  // Who owned the lead before: collapsed by default so the panel opens on the deal, not its paperwork.
  const [showHistory, setShowHistory] = useState(false)
  return <>
    <div className="lead-owner-card">
      {owner
        ? <Avatar initials={owner.initials} color={owner.color} size="sm" />
        : <span className="icon-badge sm lead-owner-empty"><Icon name="user" size={18} /></span>}
      <span>
        <small>Lead owner</small>
        <strong>{owner ? owner.name : 'Unassigned'}</strong>
        {owner && <small>{roleSummary(owner)}</small>}
      </span>
      {canReassign && <button className="btn btn-secondary" onClick={() => onAssign('reassign')}><Icon name="swap" size={16} /> {owner ? 'Reassign' : 'Assign'}</button>}
      {!canReassign && canHandOff && <button className="btn btn-soft" onClick={() => onAssign('handoff')}><Icon name="arrow" size={16} /> Hand to Sales</button>}
    </div>
    {history.length > 0 && (
      <button className="owner-history-toggle" aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}>
        Ownership history · {history.length} <Icon name="chevron" size={14} />
      </button>
    )}
    {history.length > 0 && showHistory && (
      <ol className="owner-history" aria-label="Ownership history">
        {history.map((entry, index) => (
          <li key={index}>
            <span><strong>{store.findMember(entry.toId)?.name}</strong> · {entry.reason}</span>
            <small>{entry.fromId ? `from ${store.findMember(entry.fromId)?.name} · ` : ''}{entry.byId === SYSTEM_ID ? 'automatically' : `by ${store.findMember(entry.byId)?.name}`} · {entry.at}</small>
          </li>
        ))}
      </ol>
    )}

    <div className="lead-detail-heading">
      <div><span className="eyebrow">{lead.closed ? (lead.closed.result === 'won' ? 'Won' : 'Lost') : STAGES[lead.stage]}</span><h2>{lead.budget}</h2><p>{lead.need}</p></div>
      <HeatBadge temp={lead.temp} />
    </div>

    <AiScore lead={lead} />

    <ol className="stage-track" aria-label={`Stage: ${STAGES[lead.stage]}`}>
      {STAGE_SHORT_LABELS.map((label, index) => (
        <li key={label} className={index < lead.stage ? 'done' : index === lead.stage ? 'current' : ''}>{label}</li>
      ))}
    </ol>

    {/* AI suggestions from the chat: shown up here because they need a decision (Accept / Dismiss). */}
    <AiSuggestions lead={lead} store={store} />

    {(lead.stage >= 3 || lead.closed || store.dealFor(lead.id)) && <DealPanel lead={lead} store={store} onDeal={onDeal} />}

    <LeadRegistrations lead={lead} store={store} onAction={onRegistration} />

    <LeadMatches lead={lead} store={store} />

    <div className="buyer-brief">
      <header><strong>Buyer brief</strong><button className="brief-edit" onClick={onEdit}><Icon name="edit" size={14} /> Edit</button></header>
      <div><span>Purpose</span><strong>{lead.purpose ?? (lead.moveIn === 'Investment' ? 'Investment' : 'Live-in')}</strong></div>
      <div><span>Localities</span><strong>{(lead.localities ?? [lead.locality]).join(', ')}</strong></div>
      <div><span>Move-in</span><strong>{lead.moveIn}</strong></div>
      <div><span>Must-have</span><strong>{lead.mustHave}</strong></div>
      <div><span>Phone</span><strong>{store.displayPhone(lead.phone)}</strong></div>
      <div><span>Source</span><strong>{lead.source}</strong></div>
    </div>

    <span className="eyebrow lead-detail-label">Tags</span>
    <div className="lead-detail-tags"><LeadTags tags={store.tagsFor(lead.id)} onToggle={(tag) => store.toggleTag(lead.id, tag)} /></div>
  </>
}

/** WhatsApp ticks for launch messages (🎭), with a text label: ✓ sent, ✓✓ delivered, blue ✓✓ read, or not delivered. */
function DeliveryTicks({ state }: { state: NonNullable<ChatEntry['delivery']> }) {
  if (state === 'failed') return <span className="delivery failed">Not delivered · not on WhatsApp</span>
  return (
    <span className={`delivery ${state}`}>
      <span className="ticks" aria-hidden="true"><Icon name="check" size={12} />{state !== 'sent' && <Icon name="check" size={12} />}</span>
      {state === 'sent' ? 'Sent' : state === 'delivered' ? 'Delivered' : 'Read'}
    </span>
  )
}

/** AI lead score with plain-language reasons (spec §8.13, demo heuristic). */
function AiScore({ lead }: { lead: Lead }) {
  const { score, label, reasons } = leadScore(lead)
  return (
    <div className="ai-score">
      <span className="ai-chip"><Icon name="spark" size={12} /> AI score</span>
      <strong>{score}</strong>
      <span className="ai-score-label">{label}</span>
      <small>{reasons.join(' · ')}</small>
    </div>
  )
}

/** Brief fields AI read from the chat. They change nothing until someone accepts them (spec §8.13). */
function AiSuggestions({ lead, store }: { lead: Lead; store: DemoStore }) {
  const suggestion = store.aiSuggestionsFor(lead.id)
  if (!suggestion) return null
  const rows = [
    suggestion.budget && ['Budget', suggestion.budget],
    suggestion.need && ['Looking for', suggestion.need],
    suggestion.moveIn && ['Move-in', suggestion.moveIn],
  ].filter((row): row is [string, string] => !!row)
  return (
    <div className="ai-suggestions" role="group" aria-label="AI suggestions">
      <span className="ai-chip"><Icon name="spark" size={12} /> Suggested from the chat</span>
      {rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      <footer>
        <button className="btn btn-secondary" onClick={() => store.dismissSuggestions(lead.id)}>Dismiss</button>
        <button className="btn btn-primary" onClick={() => store.acceptSuggestions(lead.id)}><Icon name="check" size={16} /> Accept</button>
      </footer>
    </div>
  )
}

/** Offer tracker, documents and commission split for a lead in negotiation or closed (spec §8.10). */
function DealPanel({ lead, store, onDeal }: { lead: Lead; store: DemoStore; onDeal: (mode: 'edit' | 'win' | 'lost') => void }) {
  const deal = store.dealFor(lead.id)
  const staleDays = staleOfferDays(deal)
  const crore = (value?: number) => (value ? `₹${value} Cr` : '—')
  return (
    <div className="deal-panel">
      <header>
        <strong>Deal</strong>
        {lead.closed && <span className={`deal-status ${lead.closed.result}`}>{lead.closed.result === 'won' ? 'Won' : `Lost · ${lead.closed.reason}`}</span>}
        {!lead.closed && <button className="brief-edit" onClick={() => onDeal('edit')}><Icon name="edit" size={14} /> {deal ? 'Edit' : 'Add offer'}</button>}
      </header>
      {deal ? <>
        <div><span>Asking</span><strong>{crore(deal.askedCr)}</strong></div>
        {deal.offers.length > 0 && (
          <ol className="deal-offers" aria-label="Offer history">
            {[...deal.offers].reverse().map((offer) => (
              <li key={offer.id}><span className={`offer-dot ${offer.by}`} />{OFFER_BY_LABELS[offer.by]} <strong>₹{offer.amountCr} Cr</strong><small>{dayLabel(offer.day)}</small></li>
            ))}
          </ol>
        )}
        {!lead.closed && staleDays !== null && <p className="deal-stale"><Icon name="clock" size={14} /> No new offer in {staleDays} days</p>}
        <div><span>Agreed</span><strong>{crore(deal.agreedCr)}</strong></div>
        <div><span>Token</span><strong>{deal.tokenL ? `₹${deal.tokenL} L${deal.tokenDay !== undefined ? ` · paid ${onDayLabel(deal.tokenDay)}` : ''}` : '—'}</strong></div>
        {deal.agreementDay !== undefined && <div><span>Agreement by</span><strong>{dayLabel(deal.agreementDay)}</strong></div>}
        <div><span>Commission split</span><strong>{deal.split.map((share) => `${shortName(store.findMember(share.memberId)?.name ?? '')} ${share.pct}%`).join(' · ')}</strong></div>
        <ul className="deal-docs" aria-label="Documents">
          {(Object.keys(DOC_LABELS) as (keyof DealDocs)[]).map((doc) => (
            <li key={doc}>
              <button className={deal.docs[doc] ? 'done' : ''} aria-pressed={deal.docs[doc]} onClick={() => store.toggleDealDoc(lead.id, doc)} disabled={!!lead.closed}>
                <span className="deal-doc-box">{deal.docs[doc] && <Icon name="check" size={12} />}</span>{DOC_LABELS[doc]}
              </button>
            </li>
          ))}
        </ul>
      </> : <p className="deal-empty">No offer recorded yet.</p>}
      <footer>
        {lead.closed
          ? <button className="btn btn-secondary" onClick={() => store.reopenLead(lead.id)}>Reopen deal</button>
          : lead.stage >= 3 && <>
              <button className="btn btn-secondary" onClick={() => onDeal('lost')}>Mark lost</button>
              <button className="btn btn-primary" onClick={() => onDeal('win')}><Icon name="check" size={16} /> Mark won</button>
            </>}
      </footer>
    </div>
  )
}

/** Listings that fit this lead, with reasons and whether they were already sent (spec §8.11). */
function LeadMatches({ lead, store }: { lead: Lead; store: DemoStore }) {
  const matches = store.matchesFor(lead)
  const shares = store.sharesFor(lead.id)
  const [best, ...others] = matches
  const shareLabel = (propertyId: number) => {
    const share = shares.find((entry) => entry.propertyId === propertyId)
    return share ? <i className="sent">{share.seen ? 'Seen' : 'Sent'}</i> : null
  }
  return <>
    <span className="eyebrow lead-detail-label">Matches · {matches.length}</span>
    {best ? <>
      <PropertyCard property={best.property} layout="stacked" />
      <span className="match-reasons">{best.reasons.map((reason) => <i key={reason} className={reason === 'On hold' || reason.includes('over budget') ? 'weak' : ''}>{reason}</i>)}{shareLabel(best.property.id)}</span>
      {others.length > 0 && (
        <ul className="match-list">
          {others.slice(0, 3).map((match) => (
            <li key={match.property.id}>
              <span><strong>{match.property.name}</strong><small>{bedroomsLabel(match.property)} · {priceLabel(match.property)}</small></span>
              <span className="match-reasons">{match.reasons.filter((reason) => reason !== match.property.locality).map((reason) => <i key={reason} className={reason === 'On hold' || reason.includes('over budget') ? 'weak' : ''}>{reason}</i>)}{shareLabel(match.property.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </> : <p className="match-empty">No listing fits this brief yet. Add one in Properties.</p>}
  </>
}
