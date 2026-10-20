import { FormEvent, useEffect, useMemo, useState } from 'react'

function useLocalState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

type IconName =
  | 'inbox' | 'pipeline' | 'home' | 'calendar' | 'search' | 'plus' | 'more'
  | 'phone' | 'send' | 'check' | 'arrow' | 'spark' | 'close' | 'chevron'
  | 'whatsapp' | 'filter' | 'clock' | 'pin' | 'bed' | 'area' | 'menu'
  | 'mic' | 'pause' | 'play' | 'volume'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    inbox: <><path d="M3 4.5h18v15H3z" /><path d="m3 14 5-5 4 4 3-3 6 6" /></>,
    pipeline: <><path d="M4 6h4v4H4zM10 14h4v4h-4zM16 4h4v4h-4z" /><path d="M8 8h3v8h-1M14 16h3V8" /></>,
    home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    calendar: <><path d="M4 5h16v15H4zM8 3v4M16 3v4M4 9h16" /><path d="M8 13h2M14 13h2M8 17h2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    phone: <path d="M7 3 4 5c0 8 7 15 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2z" />,
    send: <><path d="m3 4 18 8-18 8 3-8z" /><path d="M6 12h15" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
    spark: <path d="m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4zM18 16l.7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8c.5 3 2 4.5 5 5l1-1" /></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    bed: <><path d="M3 18v-7h18v7M3 15h18M6 11V7h5v4" /></>,
    area: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
    pause: <path d="M9 6v12M15 6v12"/>,
    play: <path d="m8 5 11 7-11 7z"/>,
    volume: <><path d="M5 10v4h4l5 4V6L9 10zM18 9a4 4 0 0 1 0 6"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

const photos = [
  'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1641356916420-a4b06a824bb7?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1686569860484-b0b79f5d7959?auto=format&fit=crop&w=1200&q=85',
]

const leads = [
  { id: 1, name: 'Ananya Rao', initials: 'AR', need: '3 BHK in Indiranagar', budget: '₹2.4–2.8 Cr', message: 'Can we see the corner unit this Saturday?', time: '2m', unread: 2, temp: 'Hot', source: '99acres', stage: 'Visit planned', color: 'coral' },
  { id: 2, name: 'Rohan & Meera', initials: 'RM', need: 'Villa near Whitefield', budget: '₹3.5 Cr', message: 'The garden is lovely. Is the price negotiable?', time: '18m', unread: 1, temp: 'Warm', source: 'Referral', stage: 'Negotiation', color: 'violet' },
  { id: 3, name: 'Vikram Shah', initials: 'VS', need: 'Investment in North BLR', budget: '₹1.2–1.5 Cr', message: 'Please share the rental yield calculation.', time: '1h', unread: 0, temp: 'Warm', source: 'Magicbricks', stage: 'Qualified', color: 'blue' },
  { id: 4, name: 'Sana Fathima', initials: 'SF', need: '2 BHK in HSR Layout', budget: '₹1.4 Cr', message: 'I will confirm after speaking to my family.', time: '3h', unread: 0, temp: 'New', source: 'WhatsApp', stage: 'New lead', color: 'gold' },
]

const properties = [
  { name: 'The Courtyard House', area: 'Indiranagar, Bengaluru', price: '₹2.65 Cr', meta: '3 BHK · 1,865 sq ft', image: photos[0] },
  { name: 'Windermere Residences', area: 'Whitefield, Bengaluru', price: '₹3.40 Cr', meta: '4 BHK · 2,840 sq ft', image: photos[1] },
  { name: 'Lakeview Terraces', area: 'HSR Layout, Bengaluru', price: '₹1.48 Cr', meta: '2 BHK · 1,260 sq ft', image: photos[2] },
]

function propertyForLead(lead: typeof leads[0]) {
  return properties[Math.abs(lead.id - 1) % properties.length]
}

const directions = [
  { id: 'atelier', number: '01', label: 'The Atelier', note: 'Editorial & considered' },
  { id: 'pulse', number: '02', label: 'Deal Pulse', note: 'Dense & decisive' },
  { id: 'field', number: '03', label: 'Field Companion', note: 'Guided & mobile', recommended: true },
]

function Avatar({ lead, small = false }: { lead: typeof leads[0]; small?: boolean }) {
  return <div className={`avatar avatar-${lead.color} ${small ? 'avatar-sm' : ''}`}>{lead.initials}<span className="online" /></div>
}

function DirectionPicker({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  return (
    <header className="direction-bar">
      <div className="brand-lockup">
        <div className="brand-mark">D</div>
        <div><strong>Daira</strong><span>Broker CRM concepts</span></div>
      </div>
      <div className="direction-tabs" role="tablist" aria-label="Visual directions">
        {directions.map((d) => (
          <button key={d.id} className={active === d.id ? 'active' : ''} onClick={() => setActive(d.id)} role="tab" aria-selected={active === d.id}>
            <span className="direction-number">{d.number}</span>
            <span><strong>{d.label}</strong><small>{d.note}</small></span>
            {d.recommended && <em>Recommended</em>}
          </button>
        ))}
      </div>
      <div className="picker-note">3 directions<br/><span>One product</span></div>
    </header>
  )
}

function PropertyMini({ property = properties[0], dark = false }: { property?: typeof properties[0]; dark?: boolean }) {
  return (
    <div className={`property-mini ${dark ? 'dark' : ''}`}>
      <img src={property.image} alt={`${property.name} interior`} />
      <div><strong>{property.name}</strong><span>{property.area}</span><b>{property.price}</b></div>
    </div>
  )
}

function ChatPanel({ lead, onBack, onCall, mobileActions, theme = '' }: { lead: typeof leads[0]; onBack?: () => void; onCall?: () => void; mobileActions?: React.ReactNode; theme?: string }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const [showAttachments, setShowAttachments] = useState(false)
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSent((s) => [...s, text.trim()])
    setText('')
  }
  return (
    <section className={`chat-panel ${theme}`}>
      <div className="chat-head">
        {onBack && <button className="back-button" onClick={onBack} aria-label="Back"><Icon name="chevron" /></button>}
        <Avatar lead={lead} small />
        <div className="chat-person"><strong>{lead.name}</strong><span><i /> online on WhatsApp</span></div>
        <button className="icon-button" aria-label={`Call ${lead.name}`} onClick={onCall}><Icon name="phone" /></button>
      </div>
      <div className="chat-context">
        <span><Icon name="spark" size={14} /> Context</span>
        <p>Looking for {lead.need.toLowerCase()} · {lead.budget} · wants possession in 3 months</p>
      </div>
      {mobileActions && <div className="mobile-lead-actions">{mobileActions}</div>}
      <div className="messages">
        <span className="day-label">Today</span>
        <div className="message theirs">Hi, I’m looking for {lead.need.toLowerCase()}. Is this still available?<time>10:16</time></div>
        <div className="message mine">Hi {lead.name.split(' ')[0]}! Yes, I have a strong match within {lead.budget}. Sharing it here.<time>10:18 <Icon name="check" size={12} /></time></div>
        <PropertyMini property={propertyForLead(lead)} />
        <div className="message theirs">{lead.message}<time>10:24</time></div>
        {sent.map((message, i) => <div className="message mine new-message" key={i}>{message}<time>Now <Icon name="check" size={12} /></time></div>)}
      </div>
      <div className="quick-replies">
        <button onClick={() => setText('Saturday works. Would 11:30 AM suit you?')}>Suggest a time</button>
        <button onClick={() => setText('I’ll share the location pin right away.')}>Share location</button>
      </div>
      <form className="composer" onSubmit={submit}>
        {showAttachments && <div className="attachment-menu">
          <button type="button" onClick={() => { setText('Sharing a curated property shortlist with you.'); setShowAttachments(false) }}><Icon name="home"/> Property</button>
          <button type="button" onClick={() => { setText('Sharing the location pin for our visit.'); setShowAttachments(false) }}><Icon name="pin"/> Location</button>
        </div>}
        <button type="button" className="attach" aria-label="Attach" onClick={() => setShowAttachments(!showAttachments)}><Icon name={showAttachments ? 'close' : 'plus'} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a WhatsApp message…" aria-label="Message" />
        <button className="send-button" aria-label="Send" disabled={!text.trim()}><Icon name="send" /></button>
      </form>
    </section>
  )
}

function LeadRow({ lead, selected, onClick, compact = false }: { lead: typeof leads[0]; selected?: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button className={`lead-row ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`} onClick={onClick}>
      <Avatar lead={lead} />
      <div className="lead-copy">
        <div><strong>{lead.name}</strong><time>{lead.time}</time></div>
        <span className="lead-need">{lead.need} · {lead.budget}</span>
        <p>{lead.message}</p>
        <footer><span className={`heat heat-${lead.temp.toLowerCase()}`}>{lead.temp}</span><span>{lead.source}</span></footer>
      </div>
      {lead.unread > 0 && <b className="unread">{lead.unread}</b>}
    </button>
  )
}

function AppNav({ active = 'Inbox', dark = false }: { active?: string; dark?: boolean }) {
  return (
    <nav className={`app-nav ${dark ? 'dark' : ''}`}>
      <div className="app-logo"><span>D</span><strong>Daira</strong></div>
      <div className="nav-group">
        {[['inbox','Inbox','3'], ['pipeline','Pipeline',''], ['home','Properties',''], ['calendar','Follow-ups','4']].map(([icon, label, count]) => (
          <button className={active === label ? 'active' : ''} key={label}><Icon name={icon as IconName}/><span>{label}</span>{count && <b>{count}</b>}</button>
        ))}
      </div>
      <div className="nav-foot">
        <div className="avatar avatar-blue">AK</div><span><strong>Arjun Khanna</strong><small>Independent broker</small></span><Icon name="more"/>
      </div>
    </nav>
  )
}

function AddLeadModal({ close, onSave }: { close: () => void; onSave: (lead: typeof leads[0]) => void }) {
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [kind, setKind] = useState('2 BHK')
  const [area, setArea] = useState('')
  const saveLead = () => {
    onSave({
      id: Date.now(),
      name,
      initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      need: `${kind}${area ? ` in ${area}` : ' in Bengaluru'}`,
      budget: 'Budget to qualify',
      message: 'New lead captured. Send a welcome message.',
      time: 'Now',
      unread: 1,
      temp: 'New',
      source: 'Quick capture',
      stage: 'New lead',
      color: 'blue',
    })
    setSaved(true)
  }
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <button className="modal-close" onClick={close} aria-label="Close"><Icon name="close"/></button>
        {saved ? (
          <div className="success-state"><div><Icon name="check" size={28}/></div><h2>Lead captured</h2><p>{name} is now available in the inbox, pipeline, and call picker.</p><button onClick={close}>Done <Icon name="check"/></button></div>
        ) : (
          <><span className="eyebrow">Quick capture</span><h2>New lead</h2><p>Add the essentials now. Enrich the details after your visit.</p>
          <form onSubmit={(e) => {e.preventDefault(); saveLead()}}>
            <label>Full name<input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Priya Menon" /></label>
            <label>WhatsApp number<div className="phone-input"><span>+91</span><input required inputMode="numeric" minLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" /></div></label>
            <div className="form-row"><label>Looking for<select value={kind} onChange={(event) => setKind(event.target.value)}><option>2 BHK</option><option>3 BHK</option><option>Villa</option><option>Plot</option></select></label><label>Preferred area<input value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Koramangala" /></label></div>
            <button className="primary-action">Add to inbox <Icon name="arrow"/></button>
          </form></>
        )}
      </div>
    </div>
  )
}

function Atelier({ openModal }: { openModal: () => void }) {
  const [selected, setSelected] = useState(leads[0])
  const [mobileChat, setMobileChat] = useState(false)
  return (
    <div className="concept atelier">
      <AppNav />
      <main className="atelier-main">
        <div className="atelier-title">
          <div><span className="eyebrow">Tuesday · 4 February</span><h1>Good morning, Arjun.</h1><p>Three conversations need your attention.</p></div>
          <button className="capture-button" onClick={openModal}><Icon name="plus"/> Capture lead</button>
        </div>
        <div className={`atelier-workspace ${mobileChat ? 'show-chat' : ''}`}>
          <section className="inbox-column">
            <div className="inbox-tools"><div><h2>Lead inbox</h2><span>12 active</span></div><button aria-label="Search"><Icon name="search"/></button><button aria-label="Filter"><Icon name="filter"/></button></div>
            <div className="inbox-list">
              {leads.map((lead) => <LeadRow key={lead.id} lead={lead} selected={lead.id === selected.id} onClick={() => { setSelected(lead); setMobileChat(true) }} />)}
            </div>
          </section>
          <ChatPanel lead={selected} onBack={() => setMobileChat(false)} theme="atelier-chat" />
          <aside className="lead-details">
            <div className="detail-head"><span className="eyebrow">Lead profile</span><button><Icon name="more"/></button></div>
            <h3>{selected.name}</h3><span className="phone-number">+91 98861 24018</span>
            <div className="detail-stats"><div><span>Budget</span><strong>{selected.budget}</strong></div><div><span>Intent</span><strong>{selected.temp}</strong></div></div>
            <div className="next-step"><span><Icon name="clock" size={16}/> Next step</span><strong>Property visit</strong><p>Saturday, 8 Feb · 11:30 AM</p><button><Icon name="check"/> Mark complete</button></div>
            <span className="eyebrow matches-label">Best match</span>
            <PropertyMini property={properties[selected.id % properties.length]} />
            <button className="view-profile">View full profile <Icon name="arrow"/></button>
          </aside>
        </div>
      </main>
      <MobileNav onAdd={openModal}/>
    </div>
  )
}

function Pulse({ openModal }: { openModal: () => void }) {
  const [selected, setSelected] = useState(leads[1])
  const stages = ['NEW LEADS', 'QUALIFIED', 'VISIT PLANNED', 'NEGOTIATION']
  const [moved, setMoved] = useState(false)
  return (
    <div className="concept pulse">
      <AppNav dark active="Pipeline"/>
      <main className="pulse-main">
        <header className="pulse-header">
          <div><span className="signal"><i/> LIVE PIPELINE</span><h1>₹8.7 Cr <small>active value</small></h1></div>
          <div className="pulse-metrics"><span><b>14</b>Open deals</span><span><b>04</b>Visits this week</span><span><b>72%</b>Follow-up rate</span></div>
          <button onClick={openModal}><Icon name="plus"/> NEW LEAD</button>
        </header>
        <section className="priority-strip">
          <span><Icon name="spark"/> PRIORITY QUEUE</span>
          <button onClick={() => setSelected(leads[0])}><b>01</b><span>ANANYA RAO<small>Reply overdue by 18 min</small></span><Icon name="arrow"/></button>
          <button onClick={() => setSelected(leads[1])}><b>02</b><span>ROHAN & MEERA<small>Send revised offer today</small></span><Icon name="arrow"/></button>
        </section>
        <div className="pulse-body">
          <section className="kanban">
            {stages.map((stage, si) => (
              <div className="kanban-column" key={stage}>
                <header><span>{stage}</span><b>{si === 2 && moved ? 2 : 1}</b></header>
                {leads.filter((_, li) => li === si || (moved && si === 2 && li === 0)).map((lead) => (
                  <article key={lead.id} className={`deal-card ${selected.id === lead.id ? 'active' : ''}`} onClick={() => setSelected(lead)}>
                    <div><Avatar lead={lead} small/><span className={`heat heat-${lead.temp.toLowerCase()}`}>{lead.temp}</span></div>
                    <h3>{lead.name}</h3><p>{lead.need}</p>
                    <strong>{lead.budget}</strong>
                    <footer><span>{lead.source}</span><time><Icon name="clock" size={12}/>{lead.time}</time></footer>
                    {si === 0 && !moved && <button onClick={(e) => { e.stopPropagation(); setMoved(true) }}>QUALIFY <Icon name="arrow" size={14}/></button>}
                  </article>
                ))}
                <button className="add-deal"><Icon name="plus" size={14}/> ADD DEAL</button>
              </div>
            ))}
          </section>
          <aside className="pulse-panel">
            <div className="pulse-profile"><Avatar lead={selected}/><div><h2>{selected.name}</h2><span>{selected.need}</span></div><button><Icon name="close"/></button></div>
            <div className="pulse-action"><span>NEXT BEST ACTION</span><strong>Confirm Saturday visit</strong><p>High intent · last replied {selected.time} ago</p><button><Icon name="whatsapp"/> MESSAGE NOW</button></div>
            <PropertyMini property={properties[selected.id % 3]} dark/>
            <div className="activity-log"><span>ACTIVITY</span><p><i/>Replied on WhatsApp <time>10:24</time></p><p><i/>Viewed property card <time>10:21</time></p><p><i/>Lead captured from {selected.source} <time>Yesterday</time></p></div>
          </aside>
        </div>
      </main>
      <MobileNav onAdd={openModal} dark/>
    </div>
  )
}

function MobileNav({ onAdd, dark = false, view, onNavigate }: { onAdd: () => void; dark?: boolean; view?: string; onNavigate?: (view: 'home' | 'pipeline' | 'properties' | 'tasks' | 'calls') => void }) {
  return <nav className={`mobile-nav ${dark ? 'dark' : ''}`}>
    <button className={!view || view === 'home' || view === 'chat' ? 'active' : ''} onClick={() => onNavigate?.('home')}><Icon name="inbox"/><span>Inbox</span></button>
    <button className={view === 'pipeline' ? 'active' : ''} onClick={() => onNavigate?.('pipeline')}><Icon name="pipeline"/><span>Pipeline</span></button>
    <button className={view === 'properties' ? 'active' : ''} onClick={() => onNavigate?.('properties')}><Icon name="home"/><span>Homes</span></button>
    <button className={view === 'calls' ? 'active' : ''} onClick={() => onNavigate?.('calls')}><Icon name="phone"/><span>Calls</span></button>
    <button className={view === 'tasks' ? 'active' : ''} onClick={() => onNavigate?.('tasks')}><Icon name="calendar"/><span>Tasks</span></button>
  </nav>
}

function Field({ openModal, additionalLeads }: { openModal: () => void; additionalLeads: typeof leads }) {
  const allLeads = useMemo(() => [...leads, ...additionalLeads], [additionalLeads])
  const [selected, setSelected] = useState(leads[0])
  const [view, setView] = useState<'home' | 'chat' | 'pipeline' | 'properties' | 'tasks' | 'calls'>('home')
  const [filter, setFilter] = useState('All')
  const [scheduledVisits, setScheduledVisits] = useLocalState<Record<number, boolean>>('daira-visits', {})
  const [notice, setNotice] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [leadStages, setLeadStages] = useLocalState<Record<number, number>>('daira-stages', { 1: 2, 2: 3, 3: 1, 4: 0 })
  const [calling, setCalling] = useState<typeof leads[0] | null>(null)
  const [recordings, setRecordings] = useLocalState('daira-recordings', [
    { id: 101, leadId: 2, date: 'Today · 9:42 AM', duration: 248, note: 'Discussed revised offer and garden maintenance.' },
    { id: 102, leadId: 3, date: 'Yesterday · 4:18 PM', duration: 375, note: 'Explained rental yield assumptions for North Bengaluru.' },
    { id: 103, leadId: 1, date: '3 Feb · 11:06 AM', duration: 132, note: 'Confirmed preferences: corner unit and morning light.' },
  ])
  const visibleLeads = useMemo(() => allLeads.filter((lead) => (filter === 'All' || lead.temp === filter) && `${lead.name} ${lead.need}`.toLowerCase().includes(searchQuery.toLowerCase())), [allLeads, filter, searchQuery])
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }
  return (
    <div className="concept field">
      <header className="mobile-product-bar">
        <button className="mobile-brand" onClick={() => setView('home')}><span>D</span><strong>Daira</strong></button>
        <div><span className="sync-dot"/> WhatsApp connected</div>
        <button className="product-add" aria-label="Add a new lead" onClick={openModal}><Icon name="plus"/></button>
      </header>
      <aside className="field-sidebar">
        <div className="field-brand"><div>D</div><strong>Daira</strong></div>
        <nav>
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Icon name="inbox"/><span>Today</span><b>{allLeads.reduce((count, lead) => count + lead.unread, 0)}</b></button>
          <button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}><Icon name="pipeline"/><span>Pipeline</span></button>
          <button className={view === 'properties' ? 'active' : ''} onClick={() => setView('properties')}><Icon name="home"/><span>Properties</span></button>
          <button className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}><Icon name="calendar"/><span>Follow-ups</span></button>
          <button className={view === 'calls' ? 'active' : ''} onClick={() => setView('calls')}><Icon name="phone"/><span>Calls</span><b>{recordings.length}</b></button>
        </nav>
        <div className="field-tip"><Icon name="spark"/><strong>You’re all caught up</strong><span>82% of leads followed up this week</span><div><i style={{width: '82%'}}/></div></div>
        <div className="field-user"><div className="avatar avatar-blue">AK</div><span><strong>Arjun Khanna</strong><small>Indiranagar</small></span><Icon name="more"/></div>
      </aside>
      <main className="field-main">
        {view === 'home' && <>
          <header className="field-head">
            <div><span>Tuesday, 4 February</span><h1>Your day, at a glance</h1></div>
            <div className="field-head-actions"><button aria-label="Search leads" className={searchOpen ? 'active' : ''} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery('') }}><Icon name={searchOpen ? 'close' : 'search'}/></button><button className="field-capture" onClick={openModal}><Icon name="plus"/> Add lead</button></div>
          </header>
          {searchOpen && <label className="inbox-search"><Icon name="search"/><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search buyers or requirements…"/></label>}
          <section className="day-cards">
            <article className="day-focus"><span>UP NEXT · 11:30 AM</span><div><div className="avatar avatar-coral">AR</div><div><h2>Visit with Ananya</h2><p>The Courtyard House · Indiranagar</p></div></div><footer><button onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Indiranagar+Bengaluru', '_blank', 'noopener,noreferrer')}><Icon name="pin"/> Directions</button><button onClick={() => { setSelected(leads[0]); setView('chat') }}><Icon name="whatsapp"/> Message</button></footer></article>
            <article className="day-stat warm"><span>FOLLOW-UP RATE</span><strong>82%</strong><p>Up 12% this week</p><div className="stacked">{leads.slice(0,3).map(l=><Avatar key={l.id} lead={l} small/>)}</div></article>
            <article className="day-stat cool"><span>ACTIVE VALUE</span><strong>₹8.7 Cr</strong><p>Across {allLeads.length} open leads</p><div className="mini-bars"><i/><i/><i/><i/></div></article>
          </section>
          <section className="field-inbox">
            <header><div><h2>Lead inbox</h2><span>Stay close to every conversation</span></div><div className="filter-pills">{['All','Hot','Warm'].map(f => <button className={filter === f ? 'active' : ''} onClick={() => setFilter(f)} key={f}>{f}</button>)}</div></header>
            <div className="field-list">
              {visibleLeads.map((lead) => <LeadRow key={lead.id} lead={lead} selected={lead.id === selected.id} onClick={() => {setSelected(lead); setView('chat')}} compact />)}
              {visibleLeads.length === 0 && <div className="empty-state"><div><Icon name="check"/></div><h3>Nothing waiting here</h3><p>Your follow-ups are done. New conversations will appear as they arrive.</p></div>}
            </div>
          </section>
        </>}
        {view === 'chat' && <div className="field-chat-wrap">
          <ChatPanel key={selected.id} lead={selected} onBack={() => setView('home')} onCall={() => setCalling(selected)} theme="field-chat" mobileActions={<>
            <button onClick={() => notify('Property shortlist shared on WhatsApp')}><Icon name="whatsapp"/><span>Share homes</span></button>
            <button onClick={() => { setScheduledVisits((current) => ({...current, [selected.id]: true})); setLeadStages((current) => ({...current, [selected.id]: 2})); notify('Visit scheduled for Saturday at 11:30 AM') }}><Icon name={scheduledVisits[selected.id] ? 'check' : 'calendar'}/><span>{scheduledVisits[selected.id] ? 'Visit set' : 'Plan visit'}</span></button>
            <button onClick={() => setView('properties')}><Icon name="home"/><span>Matches</span></button>
          </>}/>
          <aside className="field-chat-detail">
            <div className="opportunity-heading"><div><span className="eyebrow">Qualified opportunity</span><h2>{selected.budget}</h2><p>{selected.need}</p></div><span className={`heat heat-${selected.temp.toLowerCase()}`}>{selected.temp}</span></div>
            <div className="stage-track"><span className="done">New</span><span className="done">Qualified</span><span className="active">Visit</span><span>Offer</span></div>
            <div className="requirement-card">
              <header><strong>Buyer brief</strong><span>QUALIFIED</span></header>
              <div><span>Locality</span><strong>{selected.need.split(' in ')[1] ?? 'Bengaluru'}</strong></div>
              <div><span>Move-in</span><strong>Within 3 months</strong></div>
              <div><span>Must-have</span><strong>Natural light · Balcony</strong></div>
            </div>
            <span className="eyebrow match-heading">Top property match</span>
            <PropertyMini property={propertyForLead(selected)}/>
            <div className="workflow-actions">
              <button onClick={() => notify('Property shortlist shared on WhatsApp')}><Icon name="whatsapp"/><span><strong>Share shortlist</strong><small>Send 3 matching homes</small></span></button>
              <button className={scheduledVisits[selected.id] ? 'complete' : ''} onClick={() => { setScheduledVisits((current) => ({...current, [selected.id]: true})); setLeadStages((current) => ({...current, [selected.id]: 2})); notify('Visit scheduled for Saturday at 11:30 AM') }}><Icon name={scheduledVisits[selected.id] ? 'check' : 'calendar'}/><span><strong>{scheduledVisits[selected.id] ? 'Visit scheduled' : 'Schedule visit'}</strong><small>{scheduledVisits[selected.id] ? 'Sat, 8 Feb · 11:30 AM' : 'Pick a date and time'}</small></span></button>
            </div>
            <button className="all-matches" onClick={() => setView('properties')}>See all property matches <Icon name="arrow"/></button>
          </aside>
        </div>}
        {view === 'pipeline' && <FieldPipeline leadList={allLeads} leadStages={leadStages} setLeadStages={setLeadStages} onOpenLead={(lead) => { setSelected(lead); setView('chat') }} />}
        {view === 'properties' && <PropertyGallery onBack={() => setView('home')} onNotify={notify}/>}
        {view === 'tasks' && <FollowUps onCall={setCalling} onOpenLead={(lead) => { setSelected(lead); setView('chat') }} />}
        {view === 'calls' && <CallsAndRecordings leadList={allLeads} recordings={recordings} onCall={setCalling} onOpenLead={(lead) => { setSelected(lead); setView('chat') }}/>}
      </main>
      <MobileNav onAdd={openModal} view={view} onNavigate={setView}/>
      {notice && <div className="product-notice"><Icon name="check"/><span>{notice}</span></div>}
      {calling && <CallModal lead={calling} onClose={() => setCalling(null)} onSave={(duration) => {
        setRecordings((current) => [{ id: Date.now(), leadId: calling.id, date: 'Just now', duration, note: 'New recorded call · Add a note' }, ...current])
        setCalling(null)
        notify('Call recording saved to the lead timeline')
      }}/>}
    </div>
  )
}

type Recording = { id: number; leadId: number; date: string; duration: number; note: string }

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  return `${mins}:${String(seconds % 60).padStart(2, '0')}`
}

function CallModal({ lead, onClose, onSave }: { lead: typeof leads[0]; onClose: () => void; onSave: (duration: number) => void }) {
  const [status, setStatus] = useState<'dialling' | 'connected' | 'ended'>('dialling')
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(true)
  const [recording, setRecording] = useState(true)
  useEffect(() => {
    const connect = window.setTimeout(() => setStatus('connected'), 1200)
    return () => window.clearTimeout(connect)
  }, [])
  useEffect(() => {
    if (status !== 'connected') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])
  const endCall = () => {
    if (status === 'connected') setStatus('ended')
    else onClose()
  }
  return <div className="call-backdrop">
    <section className="call-modal" aria-label={`Call with ${lead.name}`}>
      <div className="call-security"><span/><Icon name="phone" size={13}/> Secure internet call</div>
      <Avatar lead={lead}/>
      <h2>{lead.name}</h2>
      <p>{lead.need}</p>
      <div className={`call-status ${status}`}>
        {status === 'dialling' && 'Calling…'}
        {status === 'connected' && <><i/>{formatDuration(seconds)} {recording && <span>REC</span>}</>}
        {status === 'ended' && 'Call ended'}
      </div>
      {status !== 'ended' ? <>
        <div className="call-wave">{[10,18,25,14,31,22,11,27,18,9,23,15].map((height, i) => <i key={i} style={{height}}/>)}</div>
        <div className="call-controls">
          <button className={muted ? 'active' : ''} onClick={() => setMuted(!muted)}><span><Icon name="mic"/></span><small>{muted ? 'Unmute' : 'Mute'}</small></button>
          <button className={speaker ? 'active' : ''} onClick={() => setSpeaker(!speaker)}><span><Icon name="volume"/></span><small>Speaker</small></button>
          <button className={recording ? 'recording' : ''} onClick={() => setRecording(!recording)}><span><i/></span><small>{recording ? 'Recording' : 'Record'}</small></button>
        </div>
        <button className="end-call" onClick={endCall}><Icon name="phone"/><span>End call</span></button>
      </> : <div className="call-ended-actions">
        <div><span>Duration</span><strong>{formatDuration(seconds)}</strong></div>
        <div><span>Recording</span><strong>{recording ? 'Ready to save' : 'Not recorded'}</strong></div>
        {recording ? <button onClick={() => onSave(Math.max(seconds, 1))}>Save recording <Icon name="arrow"/></button> : <button onClick={onClose}>Done</button>}
      </div>}
    </section>
  </div>
}

function CallsAndRecordings({ recordings, leadList, onCall, onOpenLead }: { recordings: Recording[]; leadList: typeof leads; onCall: (lead: typeof leads[0]) => void; onOpenLead: (lead: typeof leads[0]) => void }) {
  const [playing, setPlaying] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [showCallPicker, setShowCallPicker] = useState(false)
  const visible = recordings.filter((recording) => {
    const lead = leadList.find((item) => item.id === recording.leadId)
    return lead?.name.toLowerCase().includes(query.toLowerCase())
  })
  return <section className="calls-view">
    <header className="section-page-head">
      <div><span className="eyebrow">Voice workspace</span><h1>Calls & recordings</h1><p>Every important conversation, connected to the right buyer.</p></div>
      <button onClick={() => setShowCallPicker(true)}><Icon name="phone"/> New call</button>
    </header>
    <div className="call-insights">
      <article><span>CALLS THIS WEEK</span><strong>18</strong><small>2h 14m total</small></article>
      <article><span>ANSWER RATE</span><strong>72%</strong><small className="positive">+8% vs last week</small></article>
      <article><span>RECORDED</span><strong>{recordings.length}</strong><small>Private to your workspace</small></article>
    </div>
    <div className="recordings-panel">
      <header><div><h2>Recent recordings</h2><span>{recordings.length} saved calls</span></div><label><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buyer"/></label></header>
      <div className="recording-list">
        {visible.map((recording) => {
          const lead = leadList.find((item) => item.id === recording.leadId) ?? leads[0]
          const isPlaying = playing === recording.id
          return <article key={recording.id} className={isPlaying ? 'playing' : ''}>
            <button className="recording-play" onClick={() => setPlaying(isPlaying ? null : recording.id)} aria-label={isPlaying ? 'Pause recording' : 'Play recording'}><Icon name={isPlaying ? 'pause' : 'play'}/></button>
            <button className="recording-person" onClick={() => onOpenLead(lead)}><Avatar lead={lead} small/><span><strong>{lead.name}</strong><small>{recording.date}</small></span></button>
            <div className="waveform" aria-hidden="true">{Array.from({length: 42}, (_, i) => <i key={i} style={{height: `${6 + ((i * 7) % 14)}px`}}/>)}<span className={isPlaying ? 'moving' : ''}/></div>
            <time>{formatDuration(recording.duration)}</time>
            <p>{recording.note}</p>
          </article>
        })}
        {visible.length === 0 && <div className="recordings-empty"><Icon name="mic"/><h3>No recordings found</h3><p>Try another buyer name or start a new call.</p></div>}
      </div>
    </div>
    <p className="recording-consent"><Icon name="mic" size={13}/> Always ask for consent before recording a call. Recording rules can vary by context and location.</p>
    {showCallPicker && <CallPicker leadList={leadList} onClose={() => setShowCallPicker(false)} onChoose={(lead) => { setShowCallPicker(false); onCall(lead) }}/>}
  </section>
}

function CallPicker({ leadList, onClose, onChoose }: { leadList: typeof leads; onClose: () => void; onChoose: (lead: typeof leads[0]) => void }) {
  const [search, setSearch] = useState('')
  const matches = leadList.filter((lead) => `${lead.name} ${lead.need} ${lead.budget}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="picker-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="call-picker" aria-label="Choose someone to call">
      <div className="picker-handle"/>
      <header><div><span className="eyebrow">New internet call</span><h2>Who would you like to call?</h2><p>Choose a lead to keep the call and recording connected to their timeline.</p></div><button onClick={onClose} aria-label="Close"><Icon name="close"/></button></header>
      <label className="contact-search"><Icon name="search"/><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, area or budget"/></label>
      {!search && <span className="contact-section-label">Recent conversations</span>}
      <div className="contact-list">
        {matches.map((lead) => <button key={lead.id} onClick={() => onChoose(lead)}>
          <Avatar lead={lead}/>
          <span><strong>{lead.name}</strong><small>{lead.need} · {lead.budget}</small><em><i/>{lead.time} ago on WhatsApp</em></span>
          <span className="contact-call"><Icon name="phone"/></span>
        </button>)}
        {matches.length === 0 && <div className="contact-empty"><Icon name="search"/><h3>No matching lead</h3><p>Try a name, Bengaluru locality, or budget.</p></div>}
      </div>
      <footer><Icon name="whatsapp"/><span>Calls use the number saved on the lead profile. Your personal number stays private.</span></footer>
    </section>
  </div>
}

function FieldPipeline({ leadList, leadStages, setLeadStages, onOpenLead }: { leadList: typeof leads; leadStages: Record<number, number>; setLeadStages: React.Dispatch<React.SetStateAction<Record<number, number>>>; onOpenLead: (lead: typeof leads[0]) => void }) {
  const stageNames = ['New lead', 'Qualified', 'Visit planned', 'Negotiation']
  const [intentFilter, setIntentFilter] = useState<'All' | 'Hot'>('All')
  const moveForward = (id: number) => setLeadStages((current) => ({ ...current, [id]: Math.min(3, (current[id] ?? 0) + 1) }))
  return (
    <section className="field-pipeline-view">
      <header className="section-page-head">
        <div><span className="eyebrow">₹8.7 Cr active value</span><h1>Your deal pipeline</h1><p>Move every buyer towards the right home, one clear step at a time.</p></div>
        <button className={intentFilter === 'Hot' ? 'active' : ''} onClick={() => setIntentFilter((current) => current === 'All' ? 'Hot' : 'All')}><Icon name="filter"/> {intentFilter === 'All' ? 'Hot leads' : 'Show all'}</button>
      </header>
      <div className="pipeline-summary">
        <div><span>OPEN DEALS</span><strong>{leadList.length}</strong><small>Active buyers</small></div>
        <div><span>VISITS PLANNED</span><strong>{leadList.filter((lead) => (leadStages[lead.id] ?? 0) === 2).length}</strong><small>Next 7 days</small></div>
        <div><span>LIKELY COMMISSION</span><strong>₹11.2 L</strong><small>Weighted estimate</small></div>
      </div>
      <div className="field-kanban">
        {stageNames.map((stage, index) => {
          const stageLeads = leadList.filter((lead) => (leadStages[lead.id] ?? 0) === index && (intentFilter === 'All' || lead.temp === intentFilter))
          return <div className="field-stage" key={stage}>
            <header><div><i className={`stage-dot stage-${index}`}/><strong>{stage}</strong></div><span>{stageLeads.length}</span></header>
            <div className="stage-cards">
              {stageLeads.map((lead) => <article key={lead.id}>
                <button className="stage-person" onClick={() => onOpenLead(lead)}><Avatar lead={lead} small/><span><strong>{lead.name}</strong><small>{lead.need}</small></span><Icon name="chevron" size={15}/></button>
                <div className="stage-budget"><span>Budget</span><strong>{lead.budget}</strong></div>
                <p><Icon name="whatsapp" size={13}/>{lead.message}</p>
                <footer><span className={`heat heat-${lead.temp.toLowerCase()}`}>{lead.temp}</span>{index < 3 && <button onClick={() => moveForward(lead.id)}>Move forward <Icon name="arrow" size={13}/></button>}</footer>
              </article>)}
              {stageLeads.length === 0 && <div className="stage-empty"><Icon name="check"/><span>Nothing here yet</span></div>}
            </div>
          </div>
        })}
      </div>
    </section>
  )
}

function FollowUps({ onOpenLead, onCall }: { onOpenLead: (lead: typeof leads[0]) => void; onCall: (lead: typeof leads[0]) => void }) {
  const initialTasks = [
    { id: 1, lead: leads[0], time: '10:30 AM', title: 'Confirm Saturday property visit', note: 'The Courtyard House · Indiranagar', type: 'WhatsApp' },
    { id: 2, lead: leads[1], time: '12:00 PM', title: 'Send revised price and payment plan', note: 'Windermere Residences · Whitefield', type: 'Send details' },
    { id: 3, lead: leads[2], time: '3:30 PM', title: 'Discuss rental yield estimates', note: 'North Bengaluru investment shortlist', type: 'Call' },
    { id: 4, lead: leads[3], time: '5:00 PM', title: 'Check family decision', note: '2 BHK shortlist · HSR Layout', type: 'WhatsApp' },
  ]
  const [tasks, setTasks] = useLocalState('daira-tasks', initialTasks)
  const [completed, setCompleted] = useLocalState<number[]>('daira-completed-tasks', [])
  const remaining = tasks.filter((task) => !completed.includes(task.id))
  const reminderAdded = tasks.some((task) => task.id === 5)
  return (
    <section className="followups-view">
      <header className="section-page-head">
        <div><span className="eyebrow">Tuesday, 4 February</span><h1>Follow-ups</h1><p>A focused list of promises to keep today.</p></div>
        <div className={`completion-ring progress-${Math.round((completed.length / tasks.length) * 4)}`}><strong>{completed.length}/{tasks.length}</strong><span>completed</span></div>
      </header>
      <div className="followup-layout">
        <div className="task-list">
          <div className="task-list-head"><div><h2>Today</h2><span>{remaining.length} remaining</span></div><button disabled={reminderAdded} onClick={() => setTasks((current) => [...current, { id: 5, lead: leads[0], time: '6:30 PM', title: 'Send post-visit follow-up', note: 'Ask for feedback and next steps', type: 'WhatsApp' }])}><Icon name={reminderAdded ? 'check' : 'plus'}/> {reminderAdded ? 'Reminder added' : 'Add reminder'}</button></div>
          {tasks.map((task) => {
            const done = completed.includes(task.id)
            return <article className={done ? 'task-done' : ''} key={task.id}>
              <button className="task-check" onClick={() => setCompleted((current) => done ? current.filter((id) => id !== task.id) : [...current, task.id])} aria-label={done ? 'Mark incomplete' : 'Mark complete'}>{done && <Icon name="check" size={15}/>}</button>
              <time>{task.time}</time>
              <Avatar lead={task.lead} small/>
              <button className="task-copy" onClick={() => onOpenLead(task.lead)}><strong>{task.title}</strong><span>{task.lead.name} · {task.note}</span></button>
              <button className="task-action" onClick={() => task.type === 'Call' ? onCall(task.lead) : onOpenLead(task.lead)}>{task.type === 'Call' ? <Icon name="phone"/> : <Icon name="whatsapp"/>}<span>{task.type}</span></button>
            </article>
          })}
          {remaining.length === 0 && <div className="tasks-complete"><div><Icon name="check" size={24}/></div><h3>That’s everything for today</h3><p>Every buyer has heard from you. Enjoy the breathing room.</p></div>}
        </div>
        <aside className="followup-aside">
          <span className="eyebrow">This week</span><h2>Consistency wins deals</h2>
          <div className="week-chart">{['M','T','W','T','F','S','S'].map((day, index) => <div key={index}><i style={{height: `${[60,85,48,72,35,18,8][index]}%`}} className={index === 1 ? 'today' : ''}/><span>{day}</span></div>)}</div>
          <strong>82%</strong><p>of leads followed up within 24 hours</p>
          <div className="followup-note"><Icon name="spark"/><span><strong>Strong momentum</strong><small>You’re 12% ahead of last week.</small></span></div>
        </aside>
      </div>
    </section>
  )
}

function PropertyGallery({ onBack, onNotify }: { onBack: () => void; onNotify: (message: string) => void }) {
  const [saved, setSaved] = useLocalState<number[]>('daira-saved-properties', [])
  const [areaFilter, setAreaFilter] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const visibleProperties = properties.filter((property) => areaFilter === 'All' || property.area.startsWith(areaFilter))
  return <section className="property-gallery"><header><div><button onClick={onBack} className="back-button"><Icon name="chevron"/></button><span className="eyebrow">Curated inventory</span><h1>Homes worth sharing</h1><p>{properties.length} active Bengaluru listings · Updated today</p></div><button className={`gallery-filter ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}><Icon name="filter"/> Filters</button></header>{filtersOpen && <div className="property-filters">{['All','Indiranagar','Whitefield','HSR Layout'].map((area) => <button className={areaFilter === area ? 'active' : ''} key={area} onClick={() => setAreaFilter(area)}>{area}</button>)}</div>}<div className="property-grid">{visibleProperties.map((p) => { const i = properties.indexOf(p); return <article key={p.name}><div className="property-image"><img src={p.image} alt={`${p.name} interior`}/><span>FOR SALE</span><button aria-label={saved.includes(i) ? `Remove ${p.name} from saved homes` : `Save ${p.name}`} className={saved.includes(i) ? 'saved' : ''} onClick={() => setSaved(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])}><Icon name="check"/></button></div><div className="property-card-copy"><span>{p.area}</span><h2>{p.name}</h2><p><Icon name="bed"/>{p.meta.split(' · ')[0]} <Icon name="area"/>{p.meta.split(' · ')[1]}</p><footer><strong>{p.price}</strong><button onClick={() => onNotify(`${p.name} shared on WhatsApp`)}>Share <Icon name="whatsapp"/></button></footer></div></article>})}</div></section>
}

export default function App() {
  const [modal, setModal] = useState(false)
  const [additionalLeads, setAdditionalLeads] = useLocalState<typeof leads>('daira-added-leads', [])
  return (
    <div className="app-shell">
      <Field openModal={() => setModal(true)} additionalLeads={additionalLeads}/>
      {modal && <AddLeadModal close={() => setModal(false)} onSave={(lead) => setAdditionalLeads((current) => [lead, ...current])}/>}
    </div>
  )
}
