import { useState } from 'react'
import { DEMO_METRICS, firstName, type Lead, type Temperature } from '../data/demo'
import { tracksAttendance } from '../data/attendance'
import { shortName } from '../data/team'
import { Avatar, LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { LeadRow } from '../components/LeadRow'
import type { View } from '../components/navigation'
import { formatCrore, todayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './TodayView.css'

const INBOX_FILTERS: ('All' | Temperature)[] = ['All', 'Hot', 'Warm', 'New']

type TodayViewProps = {
  store: DemoStore
  onOpenLead: (lead: Lead) => void
  onAddLead: () => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}

/** Home screen: next visit, headline numbers, lead inbox and today's follow-ups. */
export function TodayView({ store, onOpenLead, onAddLead, onNavigate, notify }: TodayViewProps) {
  const [filter, setFilter] = useState<'All' | Temperature>('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const visibleLeads = store.leads.filter((lead) =>
    (filter === 'All' || lead.temp === filter) &&
    (sourceFilter === 'All' || lead.source === sourceFilter) &&
    `${lead.name} ${lead.need} ${lead.locality}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const [nextVisit, ...laterVisits] = store.upcomingVisits
  // Managers and the owner see other people's leads, so rows show who owns each one.
  const seesOthers = store.viewerCan('seeTeamLeads')
  const ownerLabel = (lead: Lead) => (lead.ownerId ? shortName(store.findMember(lead.ownerId)?.name ?? '') : null)

  return (
    <section className="today-view">
      <header className="page-head">
        <div><span className="eyebrow">{todayLabel()}</span><h1>{seesOthers ? 'Your team today' : 'Your day, at a glance'}</h1></div>
        <div className="page-head-actions">
          <button className={`icon-button bordered today-search-toggle ${searchOpen ? 'active' : ''}`} aria-label={searchOpen ? 'Close search' : 'Search leads'} onClick={() => { setSearchOpen(!searchOpen); setQuery('') }}>
            <Icon name={searchOpen ? 'close' : 'search'} />
          </button>
          <button className="btn btn-primary today-add" onClick={onAddLead}><Icon name="plus" /> Add lead</button>
        </div>
      </header>

      {searchOpen && (
        <label className="search-field today-search">
          <Icon name="search" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buyers, areas or requirements…" aria-label="Search leads" />
        </label>
      )}

      {tracksAttendance(store.viewer) && store.todayFor(store.viewer.id).status === 'not-in' && (
        <div className="checkin-reminder" role="note">
          <Icon name="clock" />
          <span><strong>You haven’t checked in today</strong><small>Work starts {store.settings.workStart}. Check in at the office or start a field day.</small></span>
          <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>Check in</button>
        </div>
      )}

      <div className="day-cards">
        {nextVisit ? (
          <article className="day-focus">
            <div className="day-focus-top">
              <span className="day-card-label">Up next · {nextVisit.when}</span>
              {laterVisits.length > 0 && <span className="day-focus-more">+{laterVisits.length} more {laterVisits.length === 1 ? 'visit' : 'visits'} booked</span>}
            </div>
            <div className="day-focus-person">
              <LeadAvatar lead={nextVisit.lead} />
              <div><h2>Visit with {firstName(nextVisit.lead.name)}</h2><p>{nextVisit.propertyName} · {nextVisit.lead.locality}</p></div>
            </div>
            <footer>
              <button className="btn day-focus-secondary" onClick={() => notify(`Directions to ${nextVisit.propertyName} sent to your phone`)}><Icon name="pin" /> Directions</button>
              <button className="btn day-focus-primary" onClick={() => onOpenLead(nextVisit.lead)}><Icon name="whatsapp" /> Message</button>
            </footer>
          </article>
        ) : (
          <article className="day-focus">
            <span className="day-card-label">Up next</span>
            <div className="day-focus-person"><div><h2>No visits booked</h2><p>Plan one from any buyer’s chat.</p></div></div>
          </article>
        )}
        <article className="day-stat warm">
          <span className="day-card-label">Follow-up rate</span>
          <strong>{DEMO_METRICS.followUpRate}%</strong>
          <p>Up {DEMO_METRICS.followUpRateChange}% this week</p>
          <div className="day-stat-avatars">
            {store.leads.filter((lead) => !lead.addedInDemo).slice(0, 3).map((lead) => <Avatar key={lead.id} initials={lead.initials} color={lead.color} size="sm" />)}
          </div>
        </article>
        <article className="day-stat cool">
          <span className="day-card-label">Active value</span>
          <strong>{formatCrore(store.activeValueCr)}</strong>
          <p>Across {store.leads.length} open leads</p>
          <div className="day-stat-bars" aria-hidden="true"><i /><i /><i /><i /></div>
        </article>
      </div>

      <div className="today-grid">
        <section className="card">
          <header className="card-head inbox-head">
            <div>
              <h2>Lead inbox</h2>
              <p>{store.leadsAwaitingReply > 0 ? `${store.leadsAwaitingReply} ${store.leadsAwaitingReply === 1 ? 'conversation needs' : 'conversations need'} a reply` : 'Every conversation is answered'}</p>
            </div>
            <div className="inbox-filters">
              <div className="segmented" role="group" aria-label="Filter leads">
                {INBOX_FILTERS.map((option) => <button key={option} className={filter === option ? 'active' : ''} aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}
              </div>
              <select className="source-filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Filter by source">
                <option value="All">All sources</option>
                {[...new Set(store.leads.map((lead) => lead.source))].sort().map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
            </div>
          </header>
          <div>
            {visibleLeads.map((lead) => <LeadRow key={lead.id} lead={lead} onOpen={() => onOpenLead(lead)} ownerLabel={seesOthers ? ownerLabel(lead) : undefined} />)}
            {visibleLeads.length === 0 && (
              <div className="empty-state">
                <span className="icon-badge"><Icon name="check" /></span>
                <h3>No matching leads</h3>
                <p>Try another filter or search term. New WhatsApp conversations appear here as they arrive.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="card due-today">
          <header className="card-head"><div><h2>Due today</h2><p>{store.remainingTasks.length} of {store.tasks.length} follow-ups left</p></div></header>
          {store.remainingTasks.slice(0, 4).map((task) => {
            const lead = store.findLead(task.leadId)
            return (
              <button key={task.id} className="due-item" onClick={() => onNavigate('tasks')}>
                <time>{task.time}</time>
                <span><strong>{task.title}</strong><small>{lead?.name}</small></span>
              </button>
            )
          })}
          {store.remainingTasks.length === 0 && <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>All done for today</h3></div>}
          <button className="due-all" onClick={() => onNavigate('tasks')}>Open follow-ups <Icon name="arrow" size={16} /></button>
        </aside>
      </div>
    </section>
  )
}
