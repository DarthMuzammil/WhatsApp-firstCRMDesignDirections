import { useEffect, useRef, useState, type FormEvent } from 'react'
import { STAGES, STAGE_SHORT_LABELS, firstName, matchPropertyForLead, relativeMinutes, type Lead } from '../data/demo'
import { roleSummary } from '../data/team'
import { Avatar, LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { HeatBadge } from '../components/HeatBadge'
import { Icon } from '../components/Icon'
import { LeadActions, type LeadActionHandlers } from '../components/LeadActions'
import { LeadNotes } from '../components/LeadNotes'
import { LeadTags } from '../components/LeadTags'
import { LeadTimeline } from '../components/LeadTimeline'
import { PropertyCard } from '../components/PropertyCard'
import type { View } from '../components/navigation'
import { AssignDialog } from '../modals/AssignDialog'
import { EditLeadDialog } from '../modals/EditLeadDialog'
import { ScheduleVisitDialog } from '../modals/ScheduleVisitDialog'
import { TemplateDialog } from '../modals/TemplateDialog'
import { QUALIFICATION_QUESTIONS, SERVICE_WINDOW_MINUTES } from '../data/templates'
import { draftReplies, leadScore } from '../lib/ai'
import { SYSTEM_ID, type DemoStore } from '../state/useDemoStore'
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
  const actions: LeadActionHandlers = {
    shareShortlist: () => {
      store.sendMessage(lead.id, `Sharing 3 homes that match your brief for a ${lead.need}. Let me know which ones you’d like to see.`)
      notify('Property shortlist shared on WhatsApp')
    },
    // Booked already: go to the visit; otherwise pick a day and time.
    scheduleVisit: () => (lead.visitScheduled ? onNavigate('visits') : setScheduling(true)),
    showMatches: () => onNavigate('properties'),
  }
  return (
    <div className="chat-layout">
      <ChatPanel lead={lead} store={store} actions={actions} onBack={onBack} onCall={() => onCall(lead)} onShowDetails={() => setDetailsOpen(true)} />
      <aside className="lead-detail"><LeadDetails lead={lead} store={store} actions={actions} onAssign={setAssignMode} onEdit={() => setEditing(true)} /></aside>
      {detailsOpen && (
        <Dialog label={`${lead.name} details`} variant="sheet" onClose={() => setDetailsOpen(false)}>
          <header className="lead-detail-sheet-head">
            <strong>Lead details</strong>
            <button className="icon-button bordered" onClick={() => setDetailsOpen(false)} aria-label="Close"><Icon name="close" /></button>
          </header>
          <div className="lead-detail-sheet-body dialog-scroll"><LeadDetails lead={lead} store={store} actions={actions} onAssign={(mode) => { setDetailsOpen(false); setAssignMode(mode) }} onEdit={() => { setDetailsOpen(false); setEditing(true) }} /></div>
        </Dialog>
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
  const property = matchPropertyForLead(lead)
  // WhatsApp allows free text only within 24 h of the buyer's last message (spec §8.4).
  const windowClosed = lead.minutesAgo > SERVICE_WINDOW_MINUTES && !chat.some((entry) => entry.from === 'buyer')

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

  const quickReplies = lead.addedInDemo || lead.freshEnquiry
    ? [{ label: 'Send a welcome message', text: `Hi ${firstName(lead.name)}, thanks for reaching out! I’m ${firstName(store.viewer.name)} from Daira. When is a good time to talk about your ${lead.need}?` }]
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

      <div className="chat-mobile-actions"><LeadActions lead={lead} actions={actions} layout="bar" visitLabel={store.upcomingVisits.find((visit) => visit.leadId === lead.id)?.when} /></div>

      <div className="messages" ref={messagesRef}>
        <span className="day-label">Today</span>
        {lead.addedInDemo ? (
          <p className="chat-note">Lead captured just now. Say hello on WhatsApp to start the conversation.</p>
        ) : lead.freshEnquiry ? (
          <div className="message theirs">{lead.enquiry}<time>Just now</time></div>
        ) : <>
          <div className="message theirs">{lead.enquiry}<time>10:16</time></div>
          <div className="message mine message-auto"><span className="message-tag">Automatic</span>Hi {firstName(lead.name)}, thanks for reaching out to Daira! A property expert will reply in a few minutes.<time>10:16 <Icon name="check" size={12} /></time></div>
          <div className="message mine">Hi {firstName(lead.name)}! Yes, I have a strong match within your {lead.budget} budget. Sharing it here.<time>10:18 <Icon name="check" size={12} /></time></div>
          <div className="message mine message-property"><PropertyCard property={property} /><time>10:18 <Icon name="check" size={12} /></time></div>
          <div className="message theirs">{lead.message}<time>10:24</time></div>
        </>}
        {chat.map((entry, index) => (
          <div key={index} className={`message new-message ${entry.from === 'buyer' ? 'theirs' : 'mine'} ${entry.from === 'auto' ? 'message-auto' : ''}`}>
            {entry.from === 'auto' && <span className="message-tag">Automatic</span>}
            {entry.template && <span className="message-tag">Template · {entry.template}</span>}
            {entry.text}
            <time>{entry.at}{entry.from !== 'buyer' && <> <Icon name="check" size={12} /></>}</time>
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
              <button type="button" onClick={() => fillDraft(`Sharing ${property.name} with you: ${property.bedrooms}, ${property.area}, ${property.price}.`)}><Icon name="home" size={16} /> Property</button>
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
}
type DetailsTab = 'overview' | 'timeline' | 'notes'

/** Everything about a lead, in three tabs. Rendered in the desktop side panel and in the phone details sheet. */
function LeadDetails({ lead, store, actions, onAssign, onEdit }: LeadDetailsProps) {
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
    {tab === 'overview' && <LeadOverview lead={lead} store={store} actions={actions} onAssign={onAssign} onEdit={onEdit} />}
    {tab === 'timeline' && <LeadTimeline events={timeline} findMember={store.findMember} />}
    {tab === 'notes' && <LeadNotes notes={notes} onAdd={(text) => store.addNote(lead.id, text)} findMember={store.findMember} />}
  </>
}

function LeadOverview({ lead, store, actions, onAssign, onEdit }: LeadDetailsProps) {
  const property = matchPropertyForLead(lead)
  const owner = store.findMember(lead.ownerId)
  const canReassign = store.viewerCan('reassignLeads')
  const canHandOff = store.settings.separatePresales && store.viewerCan('handToSales') && lead.ownerId === store.viewer.id
  const history = store.assignments.filter((entry) => entry.leadId === lead.id)
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
      <ol className="owner-history" aria-label="Ownership history">
        {history.map((entry, index) => (
          <li key={index}>
            <strong>{store.findMember(entry.toId)?.name}</strong> · {entry.reason}
            <small>{entry.fromId ? `from ${store.findMember(entry.fromId)?.name} · ` : ''}{entry.byId === SYSTEM_ID ? 'automatically' : `by ${store.findMember(entry.byId)?.name}`} · {entry.at}</small>
          </li>
        ))}
      </ol>
    )}

    <div className="lead-detail-heading">
      <div><span className="eyebrow">{STAGES[lead.stage]}</span><h2>{lead.budget}</h2><p>{lead.need}</p></div>
      <HeatBadge temp={lead.temp} />
    </div>

    <AiScore lead={lead} />

    {lead.sharedWith ? (
      <p className="shared-lead" role="note"><Icon name="alert" size={16} /><span><strong>Also sent to ~{lead.sharedWith} brokers</strong> by {lead.source}. Call now to be first.</span></p>
    ) : null}

    <ol className="stage-track" aria-label={`Stage: ${STAGES[lead.stage]}`}>
      {STAGE_SHORT_LABELS.map((label, index) => (
        <li key={label} className={index < lead.stage ? 'done' : index === lead.stage ? 'current' : ''}>{label}</li>
      ))}
    </ol>

    <div className="buyer-brief">
      <header><strong>Buyer brief</strong><button className="brief-edit" onClick={onEdit}><Icon name="spark" size={14} /> Edit</button></header>
      <AiSuggestions lead={lead} store={store} />
      <div><span>Purpose</span><strong>{lead.purpose ?? (lead.moveIn === 'Investment' ? 'Investment' : 'Live-in')}</strong></div>
      <div><span>Localities</span><strong>{(lead.localities ?? [lead.locality]).join(', ')}</strong></div>
      <div><span>Move-in</span><strong>{lead.moveIn}</strong></div>
      <div><span>Must-have</span><strong>{lead.mustHave}</strong></div>
      <div><span>Phone</span><strong>{store.displayPhone(lead.phone)}</strong></div>
      <div><span>Source</span><strong>{lead.source}</strong></div>
    </div>

    <span className="eyebrow lead-detail-label">Tags</span>
    <div className="lead-detail-tags"><LeadTags tags={store.tagsFor(lead.id)} onToggle={(tag) => store.toggleTag(lead.id, tag)} /></div>

    <span className="eyebrow lead-detail-label">Top property match</span>
    <PropertyCard property={property} layout="stacked" />

    <div className="lead-detail-actions"><LeadActions lead={lead} actions={actions} layout="cards" visitLabel={store.upcomingVisits.find((visit) => visit.leadId === lead.id)?.when} /></div>
    <button className="btn btn-primary btn-block" onClick={actions.showMatches}>See all property matches <Icon name="arrow" size={16} /></button>
  </>
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
