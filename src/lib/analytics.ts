// Owner analytics (spec §3.14, from §8.19): the Speed to lead table and the Leads at risk list, computed from the
// store so the Performance screen and the team-home digest agree.
import { STAGES, type Lead } from '../data/demo'
import { DAYS_IN_STAGE, PORTAL_SOURCES, QUIET_AFTER_DAYS, SPEED_SOURCES, SPEED_TARGET_MIN, STUCK_AFTER_DAYS, firstReplySamples, median, type Period } from '../data/performance'
import { shortName, type Member } from '../data/team'
import type { DemoStore } from '../state/useDemoStore'

export type SpeedRow = { person: Member; cells: (number | null)[]; all: number | null }
export type SpeedTable = {
  rows: SpeedRow[]
  /** Share (0–100) of portal leads answered within SPEED_TARGET_MIN, or null without portal leads. */
  portalWithinTarget: number | null
  /** The source with the slowest median across everyone in scope. */
  slowestSource: { source: string; minutes: number } | null
  /** The slowest person × source cell. */
  slowestCell: { person: Member; source: string; minutes: number } | null
  /** Median first reply to portal leads across everyone in scope. */
  portalMedian: number | null
}

/** Median minutes to the first human reply, per person and source. Live demo replies (this month) join the generated samples. */
export function speedTable(store: DemoStore, people: Member[], period: Period): SpeedTable {
  const live = period === 'this-month' ? store.firstReplies : []
  const samplesFor = (person: Member, source: string) => [
    ...firstReplySamples(person.id, source, period),
    ...live.filter((reply) => reply.memberId === person.id && reply.source === source).map((reply) => reply.minutes),
  ]
  const rows: SpeedRow[] = people.map((person) => {
    const bySource = SPEED_SOURCES.map((source) => samplesFor(person, source))
    return { person, cells: bySource.map(median), all: median(bySource.flat()) }
  })
  const portalSamples = people.flatMap((person) => PORTAL_SOURCES.flatMap((source) => samplesFor(person, source)))
  const perSource: { source: string; minutes: number }[] = []
  SPEED_SOURCES.forEach((source) => {
    const minutes = median(people.flatMap((person) => samplesFor(person, source)))
    if (minutes !== null) perSource.push({ source, minutes })
  })
  let slowestCell: SpeedTable['slowestCell'] = null
  rows.forEach((row) => row.cells.forEach((minutes, index) => {
    if (minutes !== null && (!slowestCell || minutes > slowestCell.minutes)) slowestCell = { person: row.person, source: SPEED_SOURCES[index], minutes }
  }))
  return {
    rows,
    portalWithinTarget: portalSamples.length ? Math.round((portalSamples.filter((minutes) => minutes <= SPEED_TARGET_MIN).length / portalSamples.length) * 100) : null,
    slowestSource: perSource.sort((a, b) => b.minutes - a.minutes)[0] ?? null,
    slowestCell,
    portalMedian: median(portalSamples),
  }
}

export type RiskRow = { lead: Lead; reasons: { text: string; tone: 'warning' | 'danger' }[]; quietDays: number; stuckDays: number }
export type RiskByAgent = { person: Member; open: number; atRisk: number; atRiskCr: number }
export type RiskReport = { rows: RiskRow[]; atRiskCr: number; byAgent: RiskByAgent[] }

/**
 * Open leads nobody has touched for QUIET_AFTER_DAYS, or stuck in a stage past STUCK_AFTER_DAYS, biggest budget first,
 * each with the reasons an owner should worry; and the same money by agent. Any demo action on a lead takes it off the list.
 */
export function leadsAtRisk(store: DemoStore, people: Member[]): RiskReport {
  const allTasks = [...store.tasks, ...store.upcomingTasks]
  const rows = store.leads.filter((lead) => !lead.closed).map((lead): RiskRow | null => {
    const touched = store.touchedInDemo(lead.id)
    const quietDays = store.lastTouchDays(lead.id)
    const stuckDays = touched ? 0 : DAYS_IN_STAGE[lead.id] ?? 0
    if (quietDays < QUIET_AFTER_DAYS && stuckDays <= STUCK_AFTER_DAYS) return null
    const owner = store.findMember(lead.ownerId)
    const reasons: RiskRow['reasons'] = []
    if (quietDays >= QUIET_AFTER_DAYS) reasons.push({ text: `Quiet ${quietDays} days`, tone: 'warning' })
    if (stuckDays > STUCK_AFTER_DAYS) reasons.push({ text: `Stuck in ${STAGES[lead.stage]} ${stuckDays} days`, tone: 'warning' })
    if (!allTasks.some((task) => task.leadId === lead.id)) reasons.push({ text: 'No follow-up set', tone: 'warning' })
    if (!lead.ownerId) reasons.push({ text: 'Unassigned', tone: 'danger' })
    else if (owner?.status === 'on-leave') reasons.push({ text: 'Owner on leave', tone: 'danger' })
    if (store.coverUntouched(lead)) reasons.push({ text: 'Cover hasn’t touched it', tone: 'danger' })
    return { lead, reasons, quietDays, stuckDays }
  }).filter((row): row is RiskRow => row !== null).sort((a, b) => b.lead.budgetCr - a.lead.budgetCr)
  const byAgent = people.map((person) => {
    const open = store.leads.filter((lead) => !lead.closed && lead.ownerId === person.id)
    const mine = rows.filter((row) => row.lead.ownerId === person.id)
    return { person, open: open.length, atRisk: mine.length, atRiskCr: mine.reduce((sum, row) => sum + row.lead.budgetCr, 0) }
  }).filter((row) => row.atRisk > 0).sort((a, b) => b.atRiskCr - a.atRiskCr)
  return { rows, atRiskCr: rows.reduce((sum, row) => sum + row.lead.budgetCr, 0), byAgent }
}

/** "Vivek S. is slowest on MagicBricks (31 min)" for the digest, or undefined. */
export function slowestLine(table: SpeedTable): string | undefined {
  return table.slowestCell ? `${shortName(table.slowestCell.person.name)} is slowest on ${table.slowestCell.source} (${table.slowestCell.minutes} min)` : undefined
}
