import { useState } from 'react'
import { STAGES, STAGE_CLOSE_PROBABILITY, COMMISSION_RATE, type Lead } from '../data/demo'
import { pastWorkingDays, type AttendanceCode } from '../data/attendance'
import { LOST_REASONS, PROPERTY_FUNNEL, PROPERTY_SHARES, QUIET_AFTER_DAYS, RESPONSE_BANDS, RETIRE_AFTER_VISITS, SOURCE_FUNNEL, SPEED_SOURCES, SPEED_TARGET_MIN, STUCK_AFTER_DAYS, WINDOW_TEMPLATES_THIS_MONTH, monthStats, targetFor, type MonthStats, type Period } from '../data/performance'
import { PROPERTY_STATUS_LABELS } from '../data/inventory'
import { RESPONSE_SLA_MINUTES } from '../data/demo'
import { leadsAtRisk, speedTable } from '../lib/analytics'
import { LEAD_SOURCES } from '../data/sources'
import { TEAMS, roleSummary, shortName, type Member, type TeamId } from '../data/team'
import { Avatar } from '../components/Avatar'
import { BarList } from '../components/BarList'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { formatCrore, formatLakhFromCrore, formatRupees } from '../lib/format'
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

type ReportsProps = { store: DemoStore; onOpenLead: (lead: Lead) => void }

/**
 * Performance (spec §3.14). Sales/Pre-sales: their own scorecard and rank. Managers: their team's
 * leaderboard and table. Owner: everything plus business insights. (The daily summary and AI digest are on Today.)
 * Monthly figures are generated demo data; today's verified check-ins, pipeline and attendance are live.
 */
export function ReportsView({ store, onOpenLead }: ReportsProps) {
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
    // This month also counts what happened in the demo: verified check-ins today and deals won (spec §8.10).
    return which === 'this-month'
      ? { ...stats, visitsVerified: stats.visitsVerified + verifiedToday(memberId), dealsClosed: stats.dealsClosed + store.wonDeals(memberId), commissionL: Math.round((stats.commissionL + store.wonCommissionL(memberId)) * 10) / 10 }
      : stats
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

      <SpeedCard store={store} people={isOwner ? [...sales, ...presales] : sales} period={period} onSelect={setScorecardFor} />
      <RiskCard store={store} people={sales} onOpenLead={onOpenLead} />

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
    const funnel = SOURCE_FUNNEL[source.name] ?? { visits: 0, deals: 0 }
    return { source, leads, spend, ...funnel, costPerDeal: funnel.deals > 0 ? spend / funnel.deals : 0 }
  })

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
      <ListingsTable store={store} />
      <section className="card">
        <header className="card-head"><div><h2>Pre-sales</h2><p>Leads qualified and first reply</p></div></header>
        <BarList label="Pre-sales leads handled" rows={presales.map((person) => { const s = statsFor(person.id); return { key: person.id, label: person.name, sublabel: `first reply ${s.medianResponseMin} min`, value: s.leadsHandled, display: `${s.leadsHandled} leads` } })} />
      </section>
    </div>
  </>
}

/** Colour band for a first-reply time: fast (≤ 5 min), amber (within the 15-minute target), red (over it). */
function band(minutes: number | null): string {
  if (minutes === null) return ''
  return minutes <= SPEED_TARGET_MIN ? 'band-good' : minutes <= RESPONSE_SLA_MINUTES ? 'band-warn' : 'band-bad'
}

/**
 * Speed to lead (spec §3.14, from §8.19.1): median minutes to the first human reply, per person and source.
 * A table because it compares people. Generated monthly samples (🧱) plus live replies to demo arrivals ✅.
 */
function SpeedCard({ store, people, period, onSelect }: { store: DemoStore; people: Member[]; period: Period; onSelect: (person: Member) => void }) {
  const table = speedTable(store, people, period)
  const headline = [
    table.portalWithinTarget !== null ? `Within ${SPEED_TARGET_MIN} minutes: ${table.portalWithinTarget}% of portal leads` : null,
    table.slowestSource ? `slowest source: ${table.slowestSource.source} (median ${table.slowestSource.minutes} min)` : null,
  ].filter(Boolean).join(' · ')
  // Live replies to demo arrivals: the Owner sees them all; a Manager those by their own people.
  const live = period === 'this-month' ? store.firstReplies.filter((reply) => store.viewerCan('seeAllLeads') || people.some((person) => person.id === reply.memberId)) : []
  return (
    <section className="card speed-card">
      <header className="card-head"><div><h2>Speed to lead</h2><p>Median minutes to the first human reply · {headline}</p></div></header>
      <div className="report-table-scroll">
        <table className="report-table speed-table">
          <thead><tr><th scope="col">Person</th>{SPEED_SOURCES.map((source) => <th key={source} scope="col">{source}</th>)}<th scope="col">All</th></tr></thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.person.id} onClick={() => onSelect(row.person)}>
                <th scope="row"><button onClick={() => onSelect(row.person)}>{shortName(row.person.name)}</button></th>
                {row.cells.map((minutes, index) => <td key={SPEED_SOURCES[index]} className={band(minutes)}>{minutes === null ? '—' : minutes}</td>)}
                <td className={`speed-all ${band(row.all)}`}>{row.all === null ? '—' : row.all}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="speed-foot">
        <span><i className="band-good" /> ≤ {SPEED_TARGET_MIN} min</span>
        <span><i className="band-warn" /> ≤ {RESPONSE_SLA_MINUTES} min</span>
        <span><i className="band-bad" /> over {RESPONSE_SLA_MINUTES} min</span>
        <span>— no leads from that source</span>
        {live.map((reply) => <span key={reply.leadId} className="speed-live"><Icon name="spark" size={12} /> This demo: {shortName(store.findMember(reply.memberId)?.name ?? '')} replied to a {reply.source} lead in {reply.minutes} min</span>)}
        <span className="speed-windows">WhatsApp windows: {WINDOW_TEMPLATES_THIS_MONTH.chats} chats slipped past 24 h this month and needed a template (about {formatRupees(WINDOW_TEMPLATES_THIS_MONTH.rupees)})</span>
      </footer>
    </section>
  )
}

/**
 * Leads at risk (spec §3.14, from §8.19.3): open leads nobody touched for QUIET_AFTER_DAYS or stuck in a stage,
 * with the reasons and the money, plus the same by agent. Any demo action on a lead takes it off the list.
 */
function RiskCard({ store, people, onOpenLead }: { store: DemoStore; people: Member[]; onOpenLead: (lead: Lead) => void }) {
  const report = leadsAtRisk(store, people)
  return (
    <section className="card risk-card">
      <header className="card-head"><div><h2>Leads at risk</h2><p>{report.rows.length === 0 ? 'Nothing at risk right now' : `${formatCrore(report.atRiskCr)} across ${report.rows.length} ${report.rows.length === 1 ? 'lead' : 'leads'}`} · quiet for {QUIET_AFTER_DAYS}+ days or stuck in a stage over {STUCK_AFTER_DAYS} days</p></div></header>
      <div className="risk-grid">
        <ul className="stuck-list risk-list">
          {report.rows.map(({ lead, reasons }) => (
            <li key={lead.id}><button onClick={() => onOpenLead(lead)}>
              <span>
                <strong>{lead.name}</strong>
                <small>{STAGES[lead.stage]} · {lead.ownerId ? shortName(store.findMember(lead.ownerId)?.name ?? '') : 'Unassigned'}</small>
                <span className="risk-reasons">{reasons.map((reason) => <em key={reason.text} className={reason.tone}>{reason.text}</em>)}</span>
              </span>
              <b>{lead.budgetCr > 0 ? formatCrore(lead.budgetCr) : 'Budget to qualify'}</b>
            </button></li>
          ))}
          {report.rows.length === 0 && <li className="stuck-empty">Nothing at risk. Every open lead was touched this week.</li>}
        </ul>
        {report.byAgent.length > 0 && (
          <div className="report-table-scroll">
            <table className="report-table risk-agents">
              <thead><tr><th scope="col">Person</th><th scope="col">Open</th><th scope="col">At risk</th><th scope="col">Share</th><th scope="col">₹ at risk</th></tr></thead>
              <tbody>
                {report.byAgent.map((row) => (
                  <tr key={row.person.id}>
                    <th scope="row">{shortName(row.person.name)}</th>
                    <td>{row.open}</td><td>{row.atRisk}</td><td>{row.open ? Math.round((row.atRisk / row.open) * 100) : 0}%</td><td>{formatCrore(row.atRiskCr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Listings that earn their visits (spec §3.14, from §8.19.4): shares, visits, verified check-ins and the deals they led to,
 * per listing. Monthly figures (🧱) plus live visits and deals won in the demo whose lead had a verified visit there ✅.
 */
function ListingsTable({ store }: { store: DemoStore }) {
  const rows = store.properties.map((property) => {
    const seed = PROPERTY_FUNNEL[property.id] ?? { booked: 0, verified: 0, deals: 0 }
    const visits = store.visits.filter((visit) => visit.propertyId === property.id)
    const verifiedLeadIds = new Set(visits.filter((visit) => visit.steps.some((step) => step.kind === 'check-in')).map((visit) => visit.leadId))
    const liveDeals = store.leads.filter((lead) => lead.closed?.result === 'won' && verifiedLeadIds.has(lead.id)).length
    const booked = seed.booked + visits.length
    const verified = seed.verified + verifiedLeadIds.size
    const deals = seed.deals + liveDeals
    return { property, shares: (PROPERTY_SHARES[property.id] ?? 0) + store.shareCount(property.id), booked, verified, deals, rate: verified ? Math.round((deals / verified) * 100) : null }
  }).sort((a, b) => b.verified - a.verified || b.deals - a.deals)
  return (
    <section className="card insights-wide listings-card">
      <header className="card-head"><div><h2>Listings that earn their visits</h2><p>Shares and visits this month, verified check-ins and the deals they led to · live visits and won deals included</p></div></header>
      <div className="report-table-scroll">
        <table className="report-table listing-table">
          <thead><tr><th scope="col">Listing</th><th scope="col">Shares</th><th scope="col">Booked</th><th scope="col">Verified</th><th scope="col">Deals</th><th scope="col">Visit → deal</th><th scope="col">Notes</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.property.id}>
                <th scope="row">{row.property.name}<small> · {row.property.locality}</small></th>
                <td>{row.shares}</td><td>{row.booked}</td><td>{row.verified}</td><td>{row.deals}</td>
                <td className={row.rate !== null && row.rate >= 25 ? 'met' : ''}>{row.rate === null ? '—' : `${row.rate}%`}</td>
                <td className="listing-flags">
                  {row.property.status === 'sold' ? <span className="lead-flag closed">{PROPERTY_STATUS_LABELS.sold}</span>
                    : row.verified >= RETIRE_AFTER_VISITS && row.deals === 0 ? <span className="lead-flag warning" title={`${row.verified} verified visits and no deal`}>Retire?</span> : null}
                  {!row.property.pin && <span className="lead-flag danger">Location not set</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
