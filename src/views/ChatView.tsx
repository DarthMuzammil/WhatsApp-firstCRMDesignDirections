import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BROKER, STAGES, STAGE_SHORT_LABELS, matchPropertyForLead, type Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { PropertyCard } from '../components/PropertyCard'
import type { View } from '../components/navigation'
import { nextSaturdayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './ChatView.css'

type ChatViewProps = {
  lead: Lead
  store: DemoStore
  onBack: () => void
  onCall: (lead: Lead) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}

/** WhatsApp conversation with a lead, plus the lead's deal details on wider screens. */
export function ChatView({ lead, store, onBack, onCall, onNavigate, notify }: ChatViewProps) {
  const actions: LeadActions = {
    shareShortlist: () => {
      store.sendMessage(lead.id, `Sharing 3 homes that match your brief for a ${lead.need}. Let me know which ones you’d like to see.`)
      notify('Property shortlist shared on WhatsApp')
    },
    scheduleVisit: () => {
      store.scheduleVisit(lead.id)
      notify(`Visit booked for ${nextSaturdayLabel()} at 11:30 AM`)
    },
    showMatches: () => onNavigate('properties'),
  }
  return (
    <div className="chat-layout">
      <ChatPanel lead={lead} store={store} actions={actions} onBack={onBack} onCall={() => onCall(lead)} />
      <LeadDetailPanel lead={lead} actions={actions} />
    </div>
  )
}

type LeadActions = { shareShortlist: () => void; scheduleVisit: () => void; showMatches: () => void }

function ChatPanel({ lead, store, actions, onBack, onCall }: { lead: Lead; store: DemoStore; actions: LeadActions; onBack: () => void; onCall: () => void }) {
  const [draft, setDraft] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const sent = store.sentMessages[lead.id] ?? []
  const firstName = lead.name.split(' ')[0]
  const property = matchPropertyForLead(lead)

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [sent.length])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    store.sendMessage(lead.id, draft.trim())
    setDraft('')
  }

  function fillDraft(text: string) {
    setDraft(text)
    setShowAttachments(false)
  }

  const quickReplies = lead.addedInDemo
    ? [{ label: 'Send a welcome message', text: `Hi ${firstName}, thanks for reaching out! I’m ${BROKER.name.split(' ')[0]} from Daira. When is a good time to talk about your ${lead.need}?` }]
    : [
        { label: 'Suggest a time', text: 'Saturday works. Would 11:30 AM suit you?' },
        { label: 'Share location', text: 'I’ll share the location pin right away.' },
      ]

  return (
    <section className="chat-panel">
      <header className="chat-head">
        <button className="icon-button" onClick={onBack} aria-label="Back to inbox"><Icon name="back" /></button>
        <LeadAvatar lead={lead} size="sm" showStatus />
        <div className="chat-person">
          <strong>{lead.name}</strong>
          <span>{lead.addedInDemo ? `New lead · ${lead.phone}` : lead.online ? 'Online on WhatsApp' : `Last seen ${lead.time} ago`}</span>
        </div>
        <button className="icon-button" aria-label={`Call ${lead.name}`} onClick={onCall}><Icon name="phone" /></button>
      </header>

      <div className="chat-context">
        <Icon name="spark" size={14} />
        <p><strong>Brief</strong> {lead.need} · {lead.budget} · {lead.moveIn}</p>
      </div>

      <div className="chat-mobile-actions">
        <button onClick={actions.shareShortlist}><Icon name="whatsapp" size={16} /><span>Shortlist</span></button>
        <button onClick={actions.scheduleVisit} className={lead.visitScheduled ? 'done' : ''}><Icon name={lead.visitScheduled ? 'check' : 'calendar'} size={16} /><span>{lead.visitScheduled ? 'Visit booked' : 'Plan visit'}</span></button>
        <button onClick={actions.showMatches}><Icon name="home" size={16} /><span>Matches</span></button>
      </div>

      <div className="messages" ref={messagesRef}>
        <span className="day-label">Today</span>
        {lead.addedInDemo ? (
          <p className="chat-note">Lead captured just now. Say hello on WhatsApp to start the conversation.</p>
        ) : <>
          <div className="message theirs">{lead.enquiry}<time>10:16</time></div>
          <div className="message mine">Hi {firstName}! Yes, I have a strong match within your {lead.budget} budget. Sharing it here.<time>10:18 <Icon name="check" size={12} /></time></div>
          <div className="message mine message-property"><PropertyCard property={property} /><time>10:18 <Icon name="check" size={12} /></time></div>
          <div className="message theirs">{lead.message}<time>10:24</time></div>
        </>}
        {sent.map((text, index) => <div className="message mine new-message" key={index}>{text}<time>Now <Icon name="check" size={12} /></time></div>)}
      </div>

      <div className="quick-replies">
        {quickReplies.map((reply) => <button key={reply.label} onClick={() => fillDraft(reply.text)}>{reply.label}</button>)}
      </div>

      <form className="composer" onSubmit={submit}>
        {showAttachments && (
          <div className="attachment-menu">
            <button type="button" onClick={() => fillDraft(`Sharing ${property.name} with you: ${property.bedrooms}, ${property.area}, ${property.price}.`)}><Icon name="home" size={16} /> Property</button>
            <button type="button" onClick={() => fillDraft('Sharing the location pin for our visit.')}><Icon name="pin" size={16} /> Location</button>
          </div>
        )}
        <button type="button" className="icon-button" aria-label={showAttachments ? 'Close attachments' : 'Attach'} aria-expanded={showAttachments} onClick={() => setShowAttachments(!showAttachments)}>
          <Icon name={showAttachments ? 'close' : 'plus'} />
        </button>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a WhatsApp message…" aria-label="Message" />
        <button className="send-button" aria-label="Send" disabled={!draft.trim()}><Icon name="send" /></button>
      </form>
    </section>
  )
}

/** Deal summary next to the chat. Hidden on phones, where the action row in the chat replaces it. */
function LeadDetailPanel({ lead, actions }: { lead: Lead; actions: LeadActions }) {
  const property = matchPropertyForLead(lead)
  return (
    <aside className="lead-detail">
      <div className="lead-detail-heading">
        <div><span className="eyebrow">{STAGES[lead.stage]}</span><h2>{lead.budget}</h2><p>{lead.need}</p></div>
        <span className={`heat heat-${lead.temp.toLowerCase()}`}>{lead.temp}</span>
      </div>

      <ol className="stage-track" aria-label={`Stage: ${STAGES[lead.stage]}`}>
        {STAGE_SHORT_LABELS.map((label, index) => (
          <li key={label} className={index < lead.stage ? 'done' : index === lead.stage ? 'current' : ''}>{label}</li>
        ))}
      </ol>

      <div className="buyer-brief">
        <header><strong>Buyer brief</strong><span>via {lead.source}</span></header>
        <div><span>Locality</span><strong>{lead.locality}</strong></div>
        <div><span>Move-in</span><strong>{lead.moveIn}</strong></div>
        <div><span>Must-have</span><strong>{lead.mustHave}</strong></div>
        <div><span>Phone</span><strong>{lead.phone}</strong></div>
      </div>

      <span className="eyebrow lead-detail-label">Top property match</span>
      <PropertyCard property={property} layout="stacked" />

      <div className="lead-detail-actions">
        <button onClick={actions.shareShortlist}>
          <Icon name="whatsapp" /><span><strong>Share shortlist</strong><small>Send 3 matching homes</small></span>
        </button>
        <button onClick={actions.scheduleVisit} className={lead.visitScheduled ? 'done' : ''}>
          <Icon name={lead.visitScheduled ? 'check' : 'calendar'} />
          <span><strong>{lead.visitScheduled ? 'Visit booked' : 'Schedule visit'}</strong><small>{nextSaturdayLabel()} · 11:30 AM</small></span>
        </button>
      </div>
      <button className="btn btn-primary btn-block" onClick={actions.showMatches}>See all property matches <Icon name="arrow" size={16} /></button>
    </aside>
  )
}
