import { useState } from 'react'
import { PROPERTIES, STAGES, STAGE_CLOSE_PROBABILITY, COMMISSION_RATE, type Lead } from '../data/demo'
import { pastWorkingDays, tracksAttendance, type AttendanceCode } from '../data/attendance'
import { DAYS_IN_STAGE, LOST_REASONS, PROPERTY_SHARES, RESPONSE_BANDS, SOURCE_FUNNEL, STUCK_AFTER_DAYS, monthStats, targetFor, type MonthStats, type Period } from '../data/performance'
import { LEAD_SOURCES } from '../data/sources'
import { TEAMS, roleSummary, shortName, type Member, type TeamId } from '../data/team'
import { Avatar } from '../components/Avatar'
import { BarList } from '../components/BarList'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { View } from '../components/navigation'
import { formatCrore, formatLakhFromCrore } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './ReportsView.css'

type MetricKey = 'commission' | 'deals' | 'visits' | 'response' | 'followups'
const METRICS: Record<MetricKey, { label: string; pick: (stats: MonthStats) => number; show: (value: number) => string; higherIsBetter: boolean }> = {
  commission: { label: 'Commission', pick: (s) => s.commissionL, show: (v) => `₹${v.toFixed(1)} L`, higherIsBetter: true },
  deals: { label: 'Deals closed', pick: (s) => s.dealsClosed, show: (v) => String(v), higherIsBetter: true },
  visits: { label: 'Verified visits', pick: (s) => s.visitsVerified, show: (v) => String(v), higherIsBetter: true },
  response: { label: 'First reply', pick: (s) => s.medianResponseMin, show: (v) => `${v} min`, higherIsBetter: false },
  followups: { label: 'Follow-ups on time', pick: (s) => s.followUpsOnTime, show: (v) => `${v}%`, higherIsBetter: true },
}
const PERIOD_LABEL: Record<Period, string> = { 'this-month': 'This month', 'last-month': 'Last month' }
const inr = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`

type ReportsProps = { store: DemoStore; onOpenLead: (lead: Lead) => void; onNavigate: (view: View) => void }

/**
 * Performance (spec §8.9). Sales/Pre-sales: their own scorecard and rank. Managers: their team's
 * daily summary, leaderboard and table. Owner: everything plus business insights.
 * Monthly figures are generated demo data; today's verified check-ins, pipeline and attendance are live.
 */
export function ReportsView({ store, onOpenLead, onNavigate }: ReportsProps) {
  const [period, setPeriod] = useState<Period>('this-month')
  const [teamFilter, setTeamFilter] = useState<'all' | TeamId>('all')
  const [metric, setMetric] = useState<MetricKey>('commission')
  const [scorecardFor, setScorecardFor] = useState<Member | null>(null)
  const isOwner = store.viewerCan('seeAllLeads')
  const isManager = store.viewerCan('viewReports')

  /** Today's verified client check-ins per agent (live, from Visits). */
  const verifiedToday = (memberId: string) => store.visits.filter((visit) => visit.day === 0 && visit.agentId === memberId && visit.steps.some((step) => step.kind === 'check-in')).length
  const statsFor = (memberId: string, which: Period = period): MonthStats => {
    const stats = monthStats(memberId, which)
    return which === 'this-month' ? { ...stats, visitsVerified: stats.visitsVerified + verifiedToday(memberId) } : stats
  }
  const teamId = isOwner ? teamFilter : store.viewer.teamId ?? 'all'
  const sales = store.members.filter((person) => person.status !== 'deactivated' && person.roles.includes('sales') && (teamId === 'all' || person.teamId === teamId))
  const presales = store.members.filter((person) => person.status !== 'deactivated' && person.roles.includes('presales'))
  const def = METRICS[metric]
  const ranked = [...sales].sort((a, b) => (def.higherIsBetter ? -1 : 1) * (def.pick(statsFor(a.id)) - def.pick(statsFor(b.id))))

  const filters = (
    <div className="report-filters">
      <div className="segmented" role="group" aria-label="Period">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((key) => <button key={key} className={period === key ? 'active' : ''} aria-pressed={period === key} onClick={() => setPeriod(key)}>{PERIOD_LABEL[key]}</button>)}
      </div>
      {isOwner && (
        <select className="report-team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value as 'all' | TeamId)} aria-label="Team">
          <option value="all">All teams</option>
          {TEAMS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
      )}
    </div>
  )

  // Sales and Pre-sales: their own scorecard and where they rank (spec: "Sales sees their own rank only").
  if (!isManager) {
    const everyone = store.members.filter((person) => person.status !== 'deactivated' && person.roles.includes('sales'))
    const byCommission = [...everyone].sort((a, b) => statsFor(b.id).commissionL - statsFor(a.id).commissionL)
    const rank = byCommission.findIndex((person) => person.id === store.viewer.id) + 1
    return (
      <section className="reports-view">
        <header className="page-head"><div><span className="eyebrow">{PERIOD_LABEL[period]}</span><h1>My performance</h1><p>Your numbers against your targets. Only you and your managers see this.</p></div></header>
        {filters}
        {rank > 0 && <p className="my-rank"><Icon name="chart" size={18} /><span>You’re <strong>#{rank}</strong> of {everyone.length} salespeople by commission {period === 'this-month' ? 'this month' : 'last month'}.</span></p>}
        <section className="card"><Scorecard store={store} person={store.viewer} period={period} statsFor={statsFor} /></section>
      </section>
    )
  }

  return (
    <section className="reports-view">
      <header className="page-head">
        <div><span className="eyebrow">Manage · {PERIOD_LABEL[period]}</span><h1>{isOwner ? 'Performance & insights' : `${TEAMS.find((team) => team.id === store.viewer.teamId)?.name ?? ''} team performance`}</h1><p>Who’s converting, who needs help, and where the business comes from.</p></div>
      </header>
      <DailySummary store={store} onNavigate={onNavigate} />
      {filters}

      <div className="reports-grid">
        <section className="card">
          <header className="card-head leaderboard-head">
            <div><h2>Leaderboard</h2><p>{def.label}{def.higherIsBetter ? '' : ' · lower is better'} · tap a person for their scorecard</p></div>
            <select value={metric} onChange={(event) => setMetric(event.target.value as MetricKey)} aria-label="Leaderboard metric">
              {(Object.keys(METRICS) as MetricKey[]).map((key) => <option key={key} value={key}>{METRICS[key].label}</option>)}
            </select>
          </header>
          <BarList
            rank
            label={`Leaderboard by ${def.label}`}
            rows={ranked.map((person) => ({ key: person.id, label: person.name, sublabel: TEAMS.find((team) => team.id === person.teamId)?.name, value: def.pick(statsFor(person.id)), display: def.show(def.pick(statsFor(person.id))) }))}
            onSelect={(id) => setScorecardFor(store.findMember(id) ?? null)}
          />
        </section>

        <section className="card">
          <header className="card-head"><div><h2>All numbers</h2><p>{sales.length} salespeople · {PERIOD_LABEL[period].toLowerCase()}</p></div></header>
          <div className="report-table-scroll">
            <table className="report-table">
              <thead><tr><th scope="col">Person</th><th scope="col">Deals</th><th scope="col">Commission</th><th scope="col">Visits ✓</th><th scope="col">First reply</th><th scope="col">On time</th></tr></thead>
              <tbody>
                {ranked.map((person) => {
                  const s = statsFor(person.id)
                  const t = targetFor(person.id)
                  return (
                    <tr key={person.id} onClick={() => setScorecardFor(person)}>
                      <th scope="row"><button onClick={() => setScorecardFor(person)}>{shortName(person.name)}</button></th>
                      <td className={s.dealsClosed >= t.dealsClosed ? 'met' : ''}>{s.dealsClosed}<small>/{t.dealsClosed}</small></td>
                      <td className={s.commissionL >= t.commissionL ? 'met' : ''}>₹{s.commissionL.toFixed(1)} L</td>
                      <td>{s.visitsVerified}</td>
                      <td>{s.medianResponseMin} min</td>
                      <td>{s.followUpsOnTime}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isOwner && <Insights store={store} period={period} statsFor={statsFor} onOpenLead={onOpenLead} presales={presales} />}

      {scorecardFor && (
        <Dialog label={`${scorecardFor.name} scorecard`} variant="sheet" onClose={() => setScorecardFor(null)} className="scorecard-dialog">
          <header className="assign-head"><div><h2>Scorecard</h2><p>{PERIOD_LABEL[period]}</p></div><button className="icon-button bordered" onClick={() => setScorecardFor(null)} aria-label="Close"><Icon name="close" /></button></header>
          <div className="dialog-scroll"><Scorecard store={store} person={scorecardFor} period={period} statsFor={statsFor} /></div>
        </Dialog>
      )}
    </section>
  )
}

/** Live counts a manager wants first thing (spec §8.9 "Manager daily summary"). */
function DailySummary({ store, onNavigate }: { store: DemoStore; onNavigate: (view: View) => void }) {
  const inScope = (person: Member) => tracksAttendance(person) && (store.viewerCan('seeAllLeads') || person.teamId === store.viewer.teamId)
  const notIn = store.members.filter((person) => inScope(person) && store.attendanceCode(person.id, 0) === 'pending').length
  const waiting = store.leaveRequests.filter((request) => request.status === 'pending' && inScope(store.findMember(request.memberId)!)).length
    + store.corrections.filter((request) => request.status === 'pending' && inScope(store.findMember(request.memberId)!)).length
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

type ScorecardProps = { store: DemoStore; person: Member; period: Period; statsFor: (id: string, which?: Period) => MonthStats }

/** One person's month: targets, trend vs the previous month, funnel, attendance and check-ins. */
function Scorecard({ store, person, period, statsFor }: ScorecardProps) {
  const stats = statsFor(person.id, period)
  const previous = statsFor(person.id, period === 'this-month' ? 'last-month' : 'this-month')
  const target = targetFor(person.id)
  const presales = person.roles.includes('presales')
  const days = pastWorkingDays(10)
  const codes = days.map((day) => store.attendanceCode(person.id, day))
  const count = (code: AttendanceCode) => codes.filter((item) => item === code).length
  const todaySteps = store.visits.filter((visit) => visit.day === 0 && visit.agentId === person.id).flatMap((visit) => visit.steps)
  const targets = presales
    ? [{ label: 'Commission share', actual: stats.commissionL, goal: target.commissionL, show: (v: number) => `₹${v.toFixed(1)} L` }]
    : [
        { label: 'Deals closed', actual: stats.dealsClosed, goal: target.dealsClosed, show: (v: number) => String(v) },
        { label: 'Commission', actual: stats.commissionL, goal: target.commissionL, show: (v: number) => `₹${v.toFixed(1)} L` },
        { label: 'Verified visits', actual: stats.visitsVerified, goal: target.visitsVerified, show: (v: number) => String(v) },
      ]
  const trend = [
    { label: 'Commission', delta: stats.commissionL - previous.commissionL, show: (v: number) => `₹${Math.abs(v).toFixed(1)} L`, goodWhenUp: true },
    { label: 'First reply', delta: stats.medianResponseMin - previous.medianResponseMin, show: (v: number) => `${Math.abs(v)} min`, goodWhenUp: false },
    { label: 'Follow-ups on time', delta: stats.followUpsOnTime - previous.followUpsOnTime, show: (v: number) => `${Math.abs(v)} pts`, goodWhenUp: true },
  ]
  return (
    <div className="scorecard">
      <div className="scorecard-person"><Avatar initials={person.initials} color={person.color} /><span><strong>{person.name}</strong><small>{roleSummary(person)}</small></span></div>

      <h3>Targets</h3>
      <div className="meters">
        {targets.map((item) => {
          const pct = item.goal > 0 ? Math.min(100, Math.round((item.actual / item.goal) * 100)) : 0
          const met = item.actual >= item.goal && item.goal > 0
          return (
            <div key={item.label} className={`meter ${met ? 'met' : ''}`}>
              <span><strong>{item.label}</strong><small>{item.show(item.actual)} of {item.show(item.goal)}{met ? ' · target met' : ''}</small></span>
              <div className="meter-track" role="meter" aria-valuenow={item.actual} aria-valuemin={0} aria-valuemax={item.goal} aria-label={item.label}><i style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
      </div>

      <h3>Compared with {period === 'this-month' ? 'last month' : 'this month'}</h3>
      <ul className="trend">
        {trend.map((item) => {
          const good = item.delta === 0 ? null : (item.delta > 0) === item.goodWhenUp
          return <li key={item.label}><span>{item.label}</span><strong className={good === null ? '' : good ? 'up' : 'down'}>{item.delta === 0 ? 'No change' : `${item.delta > 0 ? '▲' : '▼'} ${item.show(item.delta)}`}</strong></li>
        })}
      </ul>

      {!presales && <>
        <h3>Funnel</h3>
        <BarList label="Funnel" rows={[
          { key: 'leads', label: 'Leads handled', value: stats.leadsHandled, display: String(stats.leadsHandled) },
          { key: 'booked', label: 'Visits booked', value: stats.visitsBooked, display: String(stats.visitsBooked) },
          { key: 'verified', label: 'Visits verified', value: stats.visitsVerified, display: String(stats.visitsVerified) },
          { key: 'deals', label: 'Deals closed', value: stats.dealsClosed, display: String(stats.dealsClosed) },
        ]} />
      </>}

      <h3>Attendance · last 10 working days</h3>
      <ul className="att-counts">
        <li><strong>{count('present')}</strong><span>Present</span></li>
        <li><strong>{count('late')}</strong><span>Late</span></li>
        <li><strong>{count('field')}</strong><span>Field</span></li>
        <li><strong>{count('absent')}</strong><span>Absent</span></li>
        <li><strong>{count('leave')}</strong><span>Leave</span></li>
      </ul>
      {!presales && <p className="scorecard-note"><Icon name="pin" size={14} /> Today: {todaySteps.filter((step) => step.kind === 'check-in').length} verified check-ins, {todaySteps.filter((step) => step.kind === 'check-in-refused').length} refused.</p>}
    </div>
  )
}

type InsightsProps = { store: DemoStore; period: Period; statsFor: (id: string, which?: Period) => MonthStats; onOpenLead: (lead: Lead) => void; presales: Member[] }

/** Owner-only business view (spec §8.9 "Owner insights"). */
function Insights({ store, statsFor, onOpenLead, presales }: InsightsProps) {
  const byStage = STAGES.map((stage, index) => {
    const leads = store.leads.filter((lead) => lead.stage === index)
    const value = leads.reduce((sum, lead) => sum + lead.budgetCr, 0)
    return { stage, index, value, weighted: value * COMMISSION_RATE * STAGE_CLOSE_PROBABILITY[index], count: leads.length }
  })
  const teams = TEAMS.map((team) => ({
    team,
    commission: store.members.filter((person) => person.teamId === team.id && person.roles.includes('sales')).reduce((sum, person) => sum + statsFor(person.id).commissionL, 0),
  }))
  const sources = LEAD_SOURCES.map((source) => {
    const leads = source.leadsThisWeek * 4
    const spend = leads * store.sourceSettings[source.name].costPerLead
    const funnel = SOURCE_FUNNEL[source.name]
    return { source, leads, spend, ...funnel, costPerDeal: funnel.deals > 0 ? spend / funnel.deals : 0 }
  })
  const stuck = store.leads.filter((lead) => (DAYS_IN_STAGE[lead.id] ?? 0) > STUCK_AFTER_DAYS).sort((a, b) => (DAYS_IN_STAGE[b.id] ?? 0) - (DAYS_IN_STAGE[a.id] ?? 0))
  const visitsPerProperty = (id: number) => store.visits.filter((visit) => visit.propertyId === id).length

  return <>
    <h2 className="insights-title">Business insights</h2>
    <div className="insights-grid">
      <section className="card">
        <header className="card-head"><div><h2>Pipeline forecast</h2><p>Weighted commission {formatLakhFromCrore(byStage.reduce((sum, row) => sum + row.weighted, 0))} · live</p></div></header>
        <BarList label="Pipeline value by stage" rows={byStage.map((row) => ({ key: row.stage, label: row.stage, sublabel: `${row.count} leads · weighted ${formatLakhFromCrore(row.weighted)}`, value: row.value, display: formatCrore(row.value) }))} />
      </section>
      <section className="card">
        <header className="card-head"><div><h2>Team comparison</h2><p>Commission this period</p></div></header>
        <BarList label="Commission by team" rows={teams.map((row) => ({ key: row.team.id, label: row.team.name, value: row.commission, display: `₹${row.commission.toFixed(1)} L` }))} />
      </section>
      <section className="card insights-wide">
        <header className="card-head"><div><h2>Lead sources: what a deal costs</h2><p>Spend uses the cost per lead set on Lead sources (live); conversions are this month’s</p></div></header>
        <div className="report-table-scroll">
          <table className="report-table">
            <thead><tr><th scope="col">Source</th><th scope="col">Leads</th><th scope="col">Visits</th><th scope="col">Deals</th><th scope="col">Spend</th><th scope="col">Cost per deal</th></tr></thead>
            <tbody>
              {sources.map((row) => (
                <tr key={row.source.name}>
                  <th scope="row">{row.source.name}</th><td>{row.leads}</td><td>{row.visits}</td><td>{row.deals}</td><td>{inr(row.spend)}</td><td>{row.spend === 0 ? 'Free' : inr(row.costPerDeal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <header className="card-head"><div><h2>First reply times</h2><p>Leads this month, fastest to slowest</p></div></header>
        <BarList label="Response time distribution" rows={RESPONSE_BANDS.map((band) => ({ key: band.label, label: band.label, value: band.leads, display: String(band.leads) }))} />
      </section>
      <section className="card">
        <header className="card-head"><div><h2>Why deals were lost</h2><p>This month</p></div></header>
        <BarList label="Lost reasons" rows={LOST_REASONS.map((reason) => ({ key: reason.label, label: reason.label, value: reason.deals, display: String(reason.deals) }))} />
      </section>
      <section className="card">
        <header className="card-head"><div><h2>Stuck leads</h2><p>More than {STUCK_AFTER_DAYS} days in the same stage</p></div></header>
        <ul className="stuck-list">
          {stuck.map((lead) => (
            <li key={lead.id}><button onClick={() => onOpenLead(lead)}>
              <span><strong>{lead.name}</strong><small>{STAGES[lead.stage]} · {lead.ownerId ? shortName(store.findMember(lead.ownerId)?.name ?? '') : 'Unassigned'}</small></span>
              <em>{DAYS_IN_STAGE[lead.id]} days</em>
            </button></li>
          ))}
          {stuck.length === 0 && <li className="stuck-empty">Nothing stuck. Every lead moved this week.</li>}
        </ul>
      </section>
      <section className="card">
        <header className="card-head"><div><h2>Property interest</h2><p>Visits booked (live) and WhatsApp shares this month</p></div></header>
        <BarList label="Visits by property" rows={PROPERTIES.map((property) => ({ key: String(property.id), label: property.name, sublabel: `${PROPERTY_SHARES[property.id]} shares`, value: visitsPerProperty(property.id), display: `${visitsPerProperty(property.id)} visits` }))} />
      </section>
      <section className="card">
        <header className="card-head"><div><h2>Pre-sales</h2><p>Leads qualified and first reply</p></div></header>
        <BarList label="Pre-sales leads handled" rows={presales.map((person) => { const s = statsFor(person.id); return { key: person.id, label: person.name, sublabel: `first reply ${s.medianResponseMin} min`, value: s.leadsHandled, display: `${s.leadsHandled} leads` } })} />
      </section>
    </div>
  </>
}
