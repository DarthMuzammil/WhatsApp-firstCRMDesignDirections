import { tracksAttendance } from '../data/attendance'
import { DAYS_IN_STAGE, STUCK_AFTER_DAYS, monthStats } from '../data/performance'
import { TEAMS, type Member } from '../data/team'
import { weeklyDigest } from '../lib/ai'
import type { DemoStore } from '../state/useDemoStore'
import { Icon } from './Icon'
import type { View } from './navigation'
import './TeamPulse.css'

/** People whose attendance the viewer looks after: everyone for the Owner, their own team for a Manager. */
function inScope(store: DemoStore, person: Member) {
  return tracksAttendance(person) && (store.viewerCan('seeAllLeads') || person.teamId === store.viewer.teamId)
}

/** Live counts a manager wants first thing (spec §3.1 team home): each tile opens the screen that deals with it. */
export function DailySummary({ store, onNavigate }: { store: DemoStore; onNavigate: (view: View) => void }) {
  const notIn = store.members.filter((person) => inScope(store, person) && store.attendanceCode(person.id, 0) === 'pending').length
  const waiting = store.leaveRequests.filter((request) => request.status === 'pending' && inScope(store, store.findMember(request.memberId)!)).length
    + store.corrections.filter((request) => request.status === 'pending' && inScope(store, store.findMember(request.memberId)!)).length
  const items: { label: string; value: number; view: View; tone: 'danger' | 'warning' | 'neutral' }[] = [
    { label: 'Overdue leads', value: store.escalations.filter((lead) => lead.overdue).length, view: 'escalations', tone: 'danger' },
    { label: 'Not checked in', value: notIn, view: 'attendance', tone: 'warning' },
    { label: 'Visits today', value: store.visits.filter((visit) => visit.day === 0).length, view: 'visits', tone: 'neutral' },
    { label: 'Requests waiting', value: waiting, view: 'attendance', tone: 'warning' },
  ]
  return (
    <div className="daily-summary" aria-label="Today at a glance">
      {items.map((item) => (
        <button key={item.label} className={`summary-item ${item.value > 0 ? `tone-${item.tone}` : ''}`} onClick={() => onNavigate(item.view)}>
          <strong>{item.value}</strong><span>{item.label}</span><Icon name="chevron" size={14} />
        </button>
      ))}
    </div>
  )
}

/** AI weekly digest 🎭: plain-language lines built from the numbers the viewer can see. */
export function WeeklyDigest({ store }: { store: DemoStore }) {
  const isOwner = store.viewerCan('seeAllLeads')
  const teamName = TEAMS.find((team) => team.id === store.viewer.teamId)?.name ?? ''
  // Top salesperson in scope by commission this month (generated figures plus deals won in the demo).
  const commission = (id: string) => monthStats(id, 'this-month').commissionL + store.wonCommissionL(id)
  const top = store.members
    .filter((person) => person.status !== 'deactivated' && person.roles.includes('sales') && (isOwner || person.teamId === store.viewer.teamId))
    .sort((a, b) => commission(b.id) - commission(a.id))[0]
  const lines = weeklyDigest({
    team: isOwner ? 'The company' : `The ${teamName} team`,
    pipelineCr: store.activeValueCr,
    overdue: store.escalations.filter((lead) => lead.overdue).length,
    unassigned: store.escalations.filter((lead) => lead.ownerId === null).length,
    stuck: store.leads.filter((lead) => (DAYS_IN_STAGE[lead.id] ?? 0) > STUCK_AFTER_DAYS).length,
    notCheckedIn: store.members.filter((person) => inScope(store, person) && store.attendanceCode(person.id, 0) === 'pending').length,
    topName: top?.name,
    topCommissionL: top ? Math.round(commission(top.id) * 10) / 10 : undefined,
  })
  return (
    <section className="card digest">
      <header className="card-head"><div><span className="ai-chip"><Icon name="spark" size={12} /> AI weekly digest</span><h2>What needs your attention</h2></div></header>
      <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
    </section>
  )
}
