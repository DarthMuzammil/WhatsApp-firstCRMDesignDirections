import { useMemo } from 'react'
import {
  COMMISSION_RATE, EXTRA_REMINDER, RESPONSE_SLA_MINUTES, SEED_LEADS, SEED_RECORDINGS, SEED_TASKS, STAGES, STAGE_CLOSE_PROBABILITY,
  firstName, phoneKey, relativeMinutes, type Lead, type LeadSeed, type Recording, type Task,
} from '../data/demo'
import { SEED_CORRECTIONS, SEED_TODAY, seedAttendance, type AttendanceCode, type CorrectionRequest, type TodayAttendance } from '../data/attendance'
import { LEAVE_ALLOWANCE, SEED_LEAVE, coversDay, leaveDays, seedLeaveUsed, type LeaveRequest, type LeaveType } from '../data/leave'
import { INCOMING_LEAD_TEMPLATES, LEAD_SOURCES, findSource } from '../data/sources'
import { DEFAULT_VIEWER_ID, ROLE_LABELS, SEED_MEMBERS, TEAMS, shortName, type Member, type MemberStatus, type TeamId } from '../data/team'
import { SEED_AUDIT, SEED_NOTIFICATIONS, type AppNotification, type AuditEntry, type AuditKind, type NotificationKind, type NotificationView } from '../data/notifications'
import { MAX_ACCURACY_M, OFFICES, SEED_VISITS, formatDistance, slotMinutes, type Office, type Visit, type VisitOutcome } from '../data/visits'
import { DOC_LABELS, SEED_DEALS, type Closure, type Deal } from '../data/deals'
import { SEED_PROPERTIES, matchesForLead, priceLabel, type Property } from '../data/inventory'
import { DEFAULT_AUTO_REPLY, SERVICE_WINDOW_MINUTES } from '../data/templates'
import { callSummary } from '../lib/ai'
import { clockLabel, dayLabel, formatDuration, maskPhone } from '../lib/format'
import { distanceM, type PretendLocation, type Reading } from '../lib/location'
import { can, canSeeLead, type Permission } from '../lib/permissions'
import { clearDemoStorage, useLocalState } from '../lib/storage'

export type RoutingMode = 'round-robin' | 'locality' | 'source'
export type CompanySettings = {
  /** On: new leads go to Pre-sales first, who hand qualified leads to Sales. Off: Sales handles leads end to end. */
  separatePresales: boolean
  routing: RoutingMode
  /** Check-ins further than this from the address are refused (spec §8.0). */
  checkInRadiusM: number
  /** Office check-in after workStart + graceMin is marked late (spec §8.7). */
  workStart: string
  graceMin: number
  /** WhatsApp auto-reply to new enquiries (spec §8.4). `{name}` is replaced with the buyer's first name. */
  autoReply: { enabled: boolean; message: string; qualify: boolean }
}
/** One change of lead owner, shown on the lead's history (spec §8.2). */
export type Assignment = { leadId: number; fromId: string | null; toId: string; byId: string; reason: string; at: string }
export type Note = { id: number; text: string; byId: string; at: string }
/** A WhatsApp message added during the demo: by the team, by the auto-reply, or by the buyer (scripted). */
export type ChatEntry = { from: 'agent' | 'auto' | 'buyer'; text: string; at: string; template?: string; /** Listings sent with the message (spec §8.11). */ propertyIds?: number[] }
/** A listing sent to a lead on WhatsApp. `seen` flips a few seconds after sending (🎭). */
export type PropertyShare = { propertyId: number; at: string; seen: boolean }
export type ActivityKind = 'enquiry' | 'message' | 'assign' | 'stage' | 'visit' | 'call' | 'note' | 'profile' | 'tag' | 'merge'
/** Something that happened on a lead during the demo; newest first in the store. */
export type Activity = { id: number; leadId: number; kind: ActivityKind; text: string; byId: string; at: string }
/** One row of a lead's timeline (demo activity plus events implied by the seed data). */
export type TimelineEvent = { key: string; kind: ActivityKind; text: string; at: string; byId?: string }
/** Fields a person can edit on the lead profile (spec §8.5). */
export type LeadProfileEdit = Pick<LeadSeed, 'need' | 'budget' | 'budgetCr' | 'locality' | 'localities' | 'moveIn' | 'mustHave' | 'purpose'>

/** Author id for things the product did by itself (routing, auto-reply). */
export const SYSTEM_ID = 'system'

let activitySeq = 0
/** Unique id for notes and activity, even for several created in the same millisecond. */
function nextId(): number {
  activitySeq = (activitySeq + 1) % 100
  return Date.now() * 100 + activitySeq
}

/** A visit still to happen or in progress. */
function isOpenVisit(visit: Pick<Visit, 'status'>): boolean {
  return visit.status === 'planned' || visit.status === 'on-the-way' || visit.status === 'checked-in'
}

/** Timeline entries implied by a seeded visit. */
function seedVisitEvents(visit: Visit): TimelineEvent[] {
  const property = SEED_PROPERTIES.find((item) => item.id === visit.propertyId)?.name ?? 'the property'
  const events: TimelineEvent[] = []
  if (visit.outcome) events.push({ key: `sv-out-${visit.id}`, kind: 'visit', text: `Visit outcome: ${visit.outcome.result} · ${visit.outcome.feedback}`, at: `${dayLabel(visit.day)} · ${visit.steps.at(-1)?.at ?? visit.time}` })
  const checkIn = visit.steps.find((step) => step.kind === 'check-in')
  if (checkIn) events.push({ key: `sv-in-${visit.id}`, kind: 'visit', text: `Checked in at ${property} (verified, ${formatDistance(checkIn.distanceM)} away)`, at: `${dayLabel(visit.day)} · ${checkIn.at}` })
  if (visit.status === 'no-show') events.push({ key: `sv-ns-${visit.id}`, kind: 'visit', text: `No-show: nobody checked in at ${property}`, at: `${dayLabel(visit.day)} · ${visit.time}` })
  events.push({ key: `sv-${visit.id}`, kind: 'visit', text: `Visit planned at ${property}`, at: `${dayLabel(visit.day)} · ${visit.time}` })
  return events
}

const DEFAULT_SETTINGS: CompanySettings = { separatePresales: true, routing: 'round-robin', checkInRadiusM: 200, workStart: '9:30 AM', graceMin: 15, autoReply: { enabled: true, message: DEFAULT_AUTO_REPLY, qualify: true } }
/** A visit with its lead and property resolved, for screens. */
export type VisitView = Visit & { lead: Lead; propertyName: string; when: string }
export type VisitStepResult = { ok: boolean; message: string }
/** Per-source settings the owner can change on the Lead sources screen (spec §8.3). */
export type SourceSetting = { connected: boolean; costPerLead: number; teamId: TeamId }
const DEFAULT_SOURCE_SETTINGS: Record<string, SourceSetting> = Object.fromEntries(
  LEAD_SOURCES.map((source) => [source.name, { connected: true, costPerLead: source.defaultCostPerLead, teamId: source.defaultTeamId }]),
)

/** Plain-language description of a settings change, for the audit log (spec §8.12). */
function describeSettings(patch: Partial<CompanySettings>, before: CompanySettings): { text: string; key: string }[] {
  const changes: { text: string; key: string }[] = []
  const onOff = (value: boolean) => (value ? 'on' : 'off')
  if (patch.separatePresales !== undefined) changes.push({ key: 'presales', text: `Separate pre-sales team turned ${onOff(patch.separatePresales)}` })
  if (patch.routing) changes.push({ key: 'routing', text: `Lead routing set to ${patch.routing.replace('-', ' ')}` })
  if (patch.checkInRadiusM) changes.push({ key: 'radius', text: `Check-in radius set to ${patch.checkInRadiusM} m` })
  if (patch.workStart) changes.push({ key: 'work-start', text: `Work start set to ${patch.workStart}` })
  if (patch.graceMin !== undefined) changes.push({ key: 'grace', text: `Late-mark grace set to ${patch.graceMin} min` })
  if (patch.autoReply) {
    if (patch.autoReply.enabled !== before.autoReply.enabled) changes.push({ key: 'auto-reply', text: `Auto-reply turned ${onOff(patch.autoReply.enabled)}` })
    if (patch.autoReply.qualify !== before.autoReply.qualify) changes.push({ key: 'qualify', text: `Qualifying questions turned ${onOff(patch.autoReply.qualify)}` })
    if (patch.autoReply.message !== before.autoReply.message) changes.push({ key: 'auto-reply-message', text: 'Auto-reply message edited' })
  }
  return changes
}

/**
 * Single source of truth for everything the demo remembers: team and settings,
 * who is viewing ("View as"), leads and their owners, stages, read state,
 * messages, tasks, recordings and saved homes.
 * `leads`, `tasks`, `recordings` and every number derived from them are already
 * filtered to what the current viewer is allowed to see.
 */
export function useDemoStore() {
  const [viewerId, setViewerId] = useLocalState<string>('viewer', DEFAULT_VIEWER_ID)
  const [storedSettings, setSettings] = useLocalState<CompanySettings>('settings', DEFAULT_SETTINGS)
  const settings: CompanySettings = { ...DEFAULT_SETTINGS, ...storedSettings }
  const [visits, setVisits] = useLocalState<Visit[]>('visits', SEED_VISITS)
  const [pretendLocation, setPretendLocation] = useLocalState<PretendLocation>('pretend-location', 'client')
  const [todayAttendance, setTodayAttendance] = useLocalState<Record<string, TodayAttendance>>('attendance-today', SEED_TODAY)
  const [corrections, setCorrections] = useLocalState<CorrectionRequest[]>('corrections', SEED_CORRECTIONS)
  const [leaveRequests, setLeaveRequests] = useLocalState<LeaveRequest[]>('leave', SEED_LEAVE)
  const [sourceSettings, setSourceSettings] = useLocalState<Record<string, SourceSetting>>('source-settings', DEFAULT_SOURCE_SETTINGS)
  const [arrivals, setArrivals] = useLocalState<number>('arrivals', 0)
  const [addedMembers, setAddedMembers] = useLocalState<Member[]>('added-members', [])
  const [notifications, setNotifications] = useLocalState<AppNotification[]>('notifications', SEED_NOTIFICATIONS)
  const [auditLog, setAuditLog] = useLocalState<AuditEntry[]>('audit', SEED_AUDIT)
  const [memberStatus, setMemberStatus] = useLocalState<Record<string, MemberStatus>>('member-status', {})
  const [addedLeads, setAddedLeads] = useLocalState<LeadSeed[]>('added-leads', [])
  const [ownerOverrides, setOwnerOverrides] = useLocalState<Record<number, string | null>>('owners', {})
  const [assignments, setAssignments] = useLocalState<Assignment[]>('assignments', [])
  const [deals, setDeals] = useLocalState<Record<number, Deal>>('deals', SEED_DEALS)
  const [closures, setClosures] = useLocalState<Record<number, Closure>>('closures', {})
  const [leadEdits, setLeadEdits] = useLocalState<Record<number, LeadProfileEdit>>('lead-edits', {})
  const [notes, setNotes] = useLocalState<Record<number, Note[]>>('notes', {})
  const [tags, setTags] = useLocalState<Record<number, string[]>>('tags', {})
  const [activity, setActivity] = useLocalState<Activity[]>('activity', [])
  const [stageOverrides, setStageOverrides] = useLocalState<Record<number, number>>('stages', {})
  const [readLeadIds, setReadLeadIds] = useLocalState<number[]>('read-leads', [])
  const [chats, setChats] = useLocalState<Record<number, ChatEntry[]>>('chats', {})
  const [aiSuggestions, setAiSuggestions] = useLocalState<Record<number, Partial<LeadProfileEdit>>>('ai-suggestions', {})
  const [qualifySteps, setQualifySteps] = useLocalState<Record<number, number>>('qualify-steps', {})
  const [tasks, setTasks] = useLocalState<Task[]>('tasks', SEED_TASKS)
  const [completedTaskIds, setCompletedTaskIds] = useLocalState<number[]>('completed-tasks', [])
  const [recordings, setRecordings] = useLocalState<Recording[]>('recordings', SEED_RECORDINGS)
  const [savedPropertyIds, setSavedPropertyIds] = useLocalState<number[]>('saved-properties', [])
  const [properties, setProperties] = useLocalState<Property[]>('properties', SEED_PROPERTIES)
  const [shares, setShares] = useLocalState<Record<number, PropertyShare[]>>('property-shares', {})
  const findProperty = (id: number) => properties.find((item) => item.id === id)

  // ---------- People ----------
  const onLeave = (memberId: string, day: number) => leaveRequests.some((request) => request.memberId === memberId && coversDay(request, day))
  // "On leave" comes from approved leave covering today; a manual deactivation always wins.
  const members: Member[] = useMemo(
    () => [...SEED_MEMBERS, ...addedMembers].map((person) => ({
      ...person,
      status: memberStatus[person.id] ?? (onLeave(person.id, 0) ? 'on-leave' : person.status === 'on-leave' ? 'active' : person.status),
    })),
    [addedMembers, memberStatus, leaveRequests], // onLeave reads leaveRequests
  )
  const findMember = (id: string | null | undefined) => (id ? members.find((person) => person.id === id) : undefined)
  const viewer = findMember(viewerId) ?? members[0]
  const viewerCan = (permission: Permission) => can(viewer, permission)

  // ---------- Leads ----------
  const allLeads: Lead[] = useMemo(
    () => [...addedLeads, ...SEED_LEADS].map((lead) => {
      const unread = readLeadIds.includes(lead.id) ? 0 : lead.unread
      return {
        ...lead,
        ...leadEdits[lead.id],
        unread,
        ownerId: lead.id in ownerOverrides ? ownerOverrides[lead.id] : lead.ownerId,
        stage: stageOverrides[lead.id] ?? lead.initialStage,
        visitScheduled: visits.some((visit) => visit.leadId === lead.id && isOpenVisit(visit)),
        overdue: unread > 0 && lead.minutesAgo > RESPONSE_SLA_MINUTES,
        closed: closures[lead.id],
      }
    }),
    [addedLeads, closures, leadEdits, ownerOverrides, readLeadIds, stageOverrides, visits],
  )
  const leads = allLeads.filter((lead) => canSeeLead(viewer, lead.ownerId, members))
  const visibleIds = new Set(leads.map((lead) => lead.id))
  const findLead = (id: number) => leads.find((lead) => lead.id === id)
  const openLeadCount = (memberId: string) => allLeads.filter((lead) => lead.ownerId === memberId).length

  /** People the viewer may hand a lead to: active Sales/Pre-sales, limited to their own team for managers. */
  const assignableMembers = members.filter((person) =>
    person.status !== 'deactivated' &&
    (person.roles.includes('sales') || (settings.separatePresales && person.roles.includes('presales'))) &&
    (viewerCan('seeAllLeads') || !viewer.teamId || person.teamId === viewer.teamId || !person.teamId),
  )
  const salesMembers = members.filter((person) => person.status === 'active' && person.roles.includes('sales'))

  /**
   * Routing (spec §8.2): Pre-sales first if enabled; otherwise Sales, narrowed to the locality's team
   * ("By locality") or the source's team ("By source"), then whoever has the fewest open leads.
   */
  function routeLead(lead: Pick<LeadSeed, 'locality' | 'source'>): string | null {
    const presales = members.filter((person) => person.status === 'active' && person.roles.includes('presales'))
    let pool = settings.separatePresales && presales.length > 0 ? presales : salesMembers
    if (pool === salesMembers && settings.routing !== 'round-robin') {
      const teamId = settings.routing === 'locality'
        ? TEAMS.find((item) => item.locality.toLowerCase() === lead.locality.toLowerCase())?.id
        : sourceSettings[lead.source]?.teamId
      const teamPool = salesMembers.filter((person) => person.teamId === teamId)
      if (teamPool.length > 0) pool = teamPool
    }
    return [...pool].sort((a, b) => openLeadCount(a.id) - openLeadCount(b.id))[0]?.id ?? null
  }

  /** Sources the demo can simulate an arrival from right now (connected and not manual-entry). */
  const simulatableSources = LEAD_SOURCES.filter((source) => source.canSimulate && sourceSettings[source.name]?.connected)

  /** Records a demo action on the lead's timeline. `byId` is SYSTEM_ID for things the product did on its own. */
  function log(leadId: number, kind: ActivityKind, text: string, byId: string = viewer.id) {
    const id = nextId() // computed now, not inside the updater, so several logs in one action get different ids
    setActivity((current) => [{ id, leadId, kind, text, byId, at: 'Just now' }, ...current])
  }

  // ---------- Notifications and audit (spec §8.12) ----------
  const nameOf = (memberId: string | null | undefined) => shortName(findMember(memberId)?.name ?? 'Someone')
  /** Sends a notification to each person (never to the viewer, who did the thing). */
  function pushNotification(forIds: (string | null | undefined)[], kind: NotificationKind, text: string, target: { leadId?: number; view?: NotificationView } = {}) {
    const at = clockLabel()
    const items = [...new Set(forIds)]
      .filter((id): id is string => !!id && id !== viewer.id)
      .map((forId) => ({ id: nextId(), forId, kind, text, at, ...target, read: false }))
    if (items.length) setNotifications((current) => [...items, ...current])
  }
  /** The person's team manager plus the Owner(s): who approves their leave and hears about their deals. */
  function approversFor(memberId: string | null | undefined): string[] {
    const managerId = TEAMS.find((team) => team.id === findMember(memberId)?.teamId)?.managerId
    return [managerId, ...members.filter((person) => person.roles.includes('owner') && person.status !== 'deactivated').map((person) => person.id)].filter((id): id is string => !!id && id !== memberId)
  }
  /** Adds an audit entry by the viewer. With a `key`, a repeat by the same person updates the latest entry instead. */
  function recordAudit(kind: AuditKind, text: string, key?: string) {
    const id = nextId()
    const at = clockLabel()
    setAuditLog((current) => (key && current[0]?.key === key && current[0].byId === viewer.id
      ? [{ ...current[0], text, at }, ...current.slice(1)]
      : [{ id, byId: viewer.id, kind, text, at, key }, ...current]))
  }

  function assign(leadId: number, toId: string, reason: string) {
    const fromId = allLeads.find((lead) => lead.id === leadId)?.ownerId ?? null
    setOwnerOverrides((current) => ({ ...current, [leadId]: toId }))
    setAssignments((current) => [{ leadId, fromId, toId, byId: viewer.id, reason, at: 'Just now' }, ...current])
    log(leadId, 'assign', `Assigned to ${findMember(toId)?.name ?? 'someone'} · ${reason}`)
    const name = allLeads.find((lead) => lead.id === leadId)?.name ?? 'A lead'
    pushNotification([toId], 'assigned', `${name} was assigned to you by ${nameOf(viewer.id)} · ${reason}`, { leadId })
    if (fromId && fromId !== toId) pushNotification([fromId], 'moved', `${name} moved to ${nameOf(toId)} · ${reason}`, { leadId })
    recordAudit('reassign', fromId ? `Reassigned ${name} from ${nameOf(fromId)} to ${nameOf(toId)} · ${reason}` : `Assigned ${name} to ${nameOf(toId)} · ${reason}`)
  }

  /** Timeline for one lead: demo activity (newest first), then what the seed data implies, oldest last. */
  function timelineFor(leadId: number): TimelineEvent[] {
    const lead = allLeads.find((item) => item.id === leadId)
    if (!lead) return []
    const seedOwner = SEED_LEADS.find((item) => item.id === leadId)?.ownerId
    const seeded: TimelineEvent[] = [
      ...(lead.addedInDemo ? [] : [{ key: 'latest', kind: 'message' as const, text: `Buyer messaged: “${lead.message}”`, at: `${relativeMinutes(lead.minutesAgo)} ago` }]),
      ...SEED_RECORDINGS.filter((recording) => recording.leadId === leadId)
        .map((recording) => ({ key: `rec-${recording.id}`, kind: 'call' as const, text: `Call recorded (${formatDuration(recording.duration)}) · ${recording.note}`, at: recording.when })),
      ...SEED_VISITS.filter((visit) => visit.leadId === leadId).flatMap((visit) => seedVisitEvents(visit)),
      ...(seedOwner ? [{ key: 'seed-owner', kind: 'assign' as const, text: `Assigned to ${findMember(seedOwner)?.name} by routing`, at: 'On arrival' }] : []),
      { key: 'enquiry', kind: 'enquiry', text: lead.addedInDemo ? 'Lead captured with Quick capture' : `First enquiry via ${lead.source}`, at: lead.addedInDemo ? 'Today' : 'Earlier' },
    ]
    const demo: TimelineEvent[] = activity.filter((entry) => entry.leadId === leadId)
      .map((entry) => ({ key: `a-${entry.id}`, kind: entry.kind, text: entry.text, at: entry.at, byId: entry.byId }))
    return [...demo, ...seeded]
  }

  // ---------- Work items (scoped to visible leads) ----------
  const visibleTasks = tasks.filter((task) => visibleIds.has(task.leadId))
  const remainingTasks = visibleTasks.filter((task) => !completedTaskIds.includes(task.id))
  const visibleRecordings = recordings.filter((recording) => visibleIds.has(recording.leadId))
  const unreadTotal = leads.reduce((sum, lead) => sum + lead.unread, 0)
  const leadsAwaitingReply = leads.filter((lead) => lead.unread > 0).length
  const escalations = leads.filter((lead) => lead.overdue || lead.ownerId === null)
  const openLeads = leads.filter((lead) => !lead.closed)
  const activeValueCr = openLeads.reduce((sum, lead) => sum + lead.budgetCr, 0)
  const weightedCommissionCr = openLeads.reduce((sum, lead) => sum + lead.budgetCr * COMMISSION_RATE * STAGE_CLOSE_PROBABILITY[lead.stage], 0)
  // ---------- Visits (spec §8.6) ----------
  /** Visits the viewer may see (on visible leads, or their own), soonest first. */
  const visibleVisits: VisitView[] = visits
    .map((visit) => {
      const lead = allLeads.find((item) => item.id === visit.leadId)
      return lead ? { ...visit, lead, propertyName: findProperty(visit.propertyId)?.name ?? 'Property', when: `${dayLabel(visit.day)} · ${visit.time}` } : null
    })
    .filter((visit): visit is VisitView => !!visit && (visibleIds.has(visit.leadId) || visit.agentId === viewer.id))
    .sort((a, b) => a.day - b.day || slotMinutes(a.time) - slotMinutes(b.time))
  /** Open visits from today on, soonest first ("Up next" on Today). */
  const upcomingVisits = visibleVisits.filter((visit) => visit.day >= 0 && isOpenVisit(visit))
  /** The office a person checks in at: their team's, or HQ. */
  const officeFor = (person: Member | undefined): Office => OFFICES.find((office) => office.teamId === person?.teamId) ?? OFFICES[0]

  // ---------- Attendance (spec §8.7) ----------
  const todayFor = (memberId: string): TodayAttendance => {
    if (onLeave(memberId, 0)) return { status: 'leave' }
    const record = todayAttendance[memberId]
    return !record || record.status === 'leave' ? { status: 'not-in' } : record
  }
  /** Register code for one person on one day (0 = today, from the live record). */
  function attendanceCode(memberId: string, day: number): AttendanceCode {
    if (onLeave(memberId, day)) return 'leave'
    if (day === 0) {
      const today = todayFor(memberId)
      if (today.status === 'leave') return 'leave'
      if (today.status === 'not-in') return 'pending'
      if (today.mode === 'field') return 'field'
      return today.late ? 'late' : 'present'
    }
    if (corrections.some((request) => request.memberId === memberId && request.day === day && request.status === 'approved')) return 'present'
    const seeded = seedAttendance(memberId, day)
    return seeded === 'leave' ? 'present' : seeded
  }
  const setToday = (patch: Partial<TodayAttendance>) =>
    setTodayAttendance((current) => ({ ...current, [viewer.id]: { ...(current[viewer.id] ?? { status: 'not-in' }), ...patch } }))

  /** Moves every lead the absent person owns to the cover; returns their ids so they can come back. */
  function moveLeadsToCover(request: LeaveRequest, coverId: string): number[] {
    const range = request.from === request.to ? dayLabel(request.from) : `${dayLabel(request.from)} – ${dayLabel(request.to)}`
    const ids = allLeads.filter((lead) => lead.ownerId === request.memberId).map((lead) => lead.id)
    ids.forEach((leadId) => assign(leadId, coverId, `Leave cover (${range})`))
    return ids
  }

  function updateVisit(visitId: number, change: (visit: Visit) => Visit) {
    setVisits((current) => current.map((visit) => (visit.id === visitId ? change(visit) : visit)))
  }

  return {
    // People & access
    viewer,
    viewerCan,
    /** Full number for managers/owner, masked for everyone else (spec §8.0). */
    displayPhone: (phone: string) => (can(viewer, 'seeFullNumbers') ? phone : maskPhone(phone)),
    // ---------- Inventory (spec §8.11) ----------
    properties,
    findProperty,
    /** Listings that fit the lead, best first, with reasons. */
    matchesFor: (lead: Lead) => matchesForLead(lead, properties),
    /** The single best listing for a lead (falls back to the first available one). */
    bestMatch: (lead: Lead): Property => matchesForLead(lead, properties)[0]?.property ?? properties.find((item) => item.status === 'available') ?? properties[0],
    /** Owner's number: full for Managers, the Owner and the listing agent; masked for everyone else. */
    ownerPhone: (property: Property) => (can(viewer, 'seeOwnerContact') || property.listingAgentId === viewer.id ? property.ownerPhone : maskPhone(property.ownerPhone)),
    sharesFor: (leadId: number) => shares[leadId] ?? [],
    /** Times a listing was shared in the demo, across all leads. */
    shareCount: (propertyId: number) => Object.values(shares).flat().filter((share) => share.propertyId === propertyId).length,
    /** The listing already sent in a seeded chat (fixed by the seed inventory, so later listings don't rewrite history). */
    introProperty: (lead: Lead): Property => findProperty(matchesForLead(lead, SEED_PROPERTIES)[0]?.property.id ?? 1) ?? properties[0],
    members,
    findMember,
    settings,
    sourceSettings,
    simulatableSources,
    assignableMembers,
    openLeadCount,
    // Leads & work
    leads,
    allLeads,
    findLead,
    assignments,
    openLeads,
    dealFor: (leadId: number) => deals[leadId],
    /** Won deals with an agreed price: live commission per person from their split (spec §8.10). */
    wonCommissionL: (memberId: string) => Object.entries(closures)
      .filter(([, closure]) => closure.result === 'won')
      .reduce((sum, [id]) => {
        const deal = deals[Number(id)]
        const share = deal?.split.find((item) => item.memberId === memberId)?.pct ?? 0
        return sum + (deal?.agreedCr ?? 0) * 100 * COMMISSION_RATE * (share / 100)
      }, 0),
    wonDeals: (memberId: string) => Object.entries(closures)
      .filter(([id, closure]) => closure.result === 'won' && deals[Number(id)]?.split.some((item) => item.memberId === memberId && item.pct >= 50)).length,
    notesFor: (leadId: number) => notes[leadId] ?? [],
    tagsFor: (leadId: number) => tags[leadId] ?? [],
    timelineFor,
    /** Any lead in the company with this phone number, visible to the viewer or not (spec §8.5 duplicate alert). */
    findDuplicate: (phone: string) => allLeads.find((lead) => phoneKey(lead.phone) === phoneKey(phone)),
    tasks: visibleTasks,
    remainingTasks,
    completedTaskIds,
    recordings: visibleRecordings,
    savedPropertyIds,
    chatFor: (leadId: number) => chats[leadId] ?? [],
    /** WhatsApp only allows free text within 24 hours of the buyer's last message; after that, templates only (spec §8.4). */
    serviceWindowClosed: (lead: Lead) => lead.minutesAgo > SERVICE_WINDOW_MINUTES && !(chats[lead.id] ?? []).some((entry) => entry.from === 'buyer'),
    aiSuggestionsFor: (leadId: number) => aiSuggestions[leadId],
    qualifyStepFor: (leadId: number) => qualifySteps[leadId] ?? 0,
    unreadTotal,
    leadsAwaitingReply,
    escalations,
    activeValueCr,
    weightedCommissionCr,
    upcomingVisits,
    visits: visibleVisits,
    todayFor,
    attendanceCode,
    corrections,
    leaveRequests,
    /** Days left of a leave type: allowance − used before the demo − approved; `pending` is shown separately. */
    leaveBalance: (memberId: string, type: LeaveType) => {
      const mine = leaveRequests.filter((request) => request.memberId === memberId && request.type === type)
      const taken = mine.filter((request) => request.status === 'approved' || request.status === 'ended').reduce((sum, request) => sum + leaveDays(request), 0)
      const pending = mine.filter((request) => request.status === 'pending').reduce((sum, request) => sum + leaveDays(request), 0)
      return { allowance: LEAVE_ALLOWANCE[type], remaining: LEAVE_ALLOWANCE[type] - seedLeaveUsed(memberId, type) - taken, pending }
    },
    pretendLocation,
    officeFor,
    extraReminderAdded: tasks.some((task) => task.id === EXTRA_REMINDER.id),

    // ---------- Actions ----------
    setViewer: (memberId: string) => setViewerId(memberId),
    updateSettings: (patch: Partial<CompanySettings>) => {
      describeSettings(patch, settings).forEach((change) => recordAudit('settings', change.text, `settings:${change.key}`))
      setSettings((current) => ({ ...current, ...patch }))
    },
    updateSource: (name: string, patch: Partial<SourceSetting>) => {
      if (patch.costPerLead !== undefined) recordAudit('settings', `${name}: cost per lead set to ₹${patch.costPerLead}`, `source:${name}:cost`)
      if (patch.teamId) recordAudit('settings', `${name}: leads go to the ${TEAMS.find((team) => team.id === patch.teamId)?.name} team`, `source:${name}:team`)
      if (patch.connected !== undefined) recordAudit('settings', `${name} ${patch.connected ? 'connected' : 'disconnected'}`)
      setSourceSettings((current) => ({ ...current, [name]: { ...current[name], ...patch } }))
    },
    /**
     * Simulates a new enquiry arriving from a source (spec §8.3): next buyer from the template pool,
     * routed by the company rule. Without a source name, rotates through the connected sources.
     */
    receiveLead: (sourceName?: string) => {
      const source = sourceName ? findSource(sourceName) : simulatableSources[arrivals % Math.max(1, simulatableSources.length)]
      if (!source || !sourceSettings[source.name]?.connected) return undefined
      const template = INCOMING_LEAD_TEMPLATES[arrivals % INCOMING_LEAD_TEMPLATES.length]
      const id = Date.now()
      // The portal tells us what and where; budget and timing are what qualification finds out.
      const lead: LeadSeed = {
        ...template, id, source: source.name, enquiry: template.message, minutesAgo: 0, unread: 1, online: true,
        budget: 'Budget to qualify', budgetCr: 0, moveIn: 'To confirm', mustHave: 'To confirm',
        initialStage: 0, ownerId: null, sharedWith: source.sharedWith, freshEnquiry: true,
        answers: { budget: template.budget, budgetCr: template.budgetCr, moveIn: template.moveIn === 'To confirm' ? 'Within 3 months' : template.moveIn },
      }
      const ownerId = routeLead(lead)
      setAddedLeads((current) => [{ ...lead, ownerId }, ...current])
      setArrivals((current) => current + 1)
      if (ownerId) {
        const reason = settings.separatePresales ? 'Routing: Pre-sales first' : `Routing: ${settings.routing.replace('-', ' ')}`
        setAssignments((current) => [{ leadId: id, fromId: null, toId: ownerId, byId: SYSTEM_ID, reason, at: 'Just now' }, ...current])
      }
      log(id, 'enquiry', `New enquiry via ${source.name}${ownerId ? ` · routed to ${findMember(ownerId)?.name}` : ''}`, SYSTEM_ID)
      pushNotification([ownerId], 'assigned', `New lead from ${source.name}: ${template.name} was routed to you.`, { leadId: id })
      if (settings.autoReply.enabled) {
        const text = settings.autoReply.message.replace(/\{name\}/g, firstName(template.name))
        setChats((current) => ({ ...current, [id]: [{ from: 'auto', text, at: clockLabel() }] }))
        log(id, 'message', `Auto-reply sent within seconds`, SYSTEM_ID)
      }
      const arrived: Lead = { ...lead, ownerId, stage: 0, visitScheduled: false, overdue: false }
      return { lead: arrived, owner: findMember(ownerId), visible: canSeeLead(viewer, ownerId, members) }
    },
    /** Adds a lead. Sales/Pre-sales own what they add; otherwise `ownerChoice` ('auto' = routing) decides. */
    addLead: (lead: LeadSeed, ownerChoice: string | 'auto') => {
      const ownedByViewer = viewer.roles.includes('sales') || viewer.roles.includes('presales')
      const ownerId = ownedByViewer ? viewer.id : ownerChoice === 'auto' ? routeLead(lead) : ownerChoice
      setAddedLeads((current) => [{ ...lead, ownerId }, ...current])
      if (ownerId) {
        const reason = ownedByViewer ? 'Added by them' : ownerChoice === 'auto' ? `Routing: ${settings.routing.replace('-', ' ')}` : 'Assigned on capture'
        setAssignments((current) => [{ leadId: lead.id, fromId: null, toId: ownerId, byId: !ownedByViewer && ownerChoice === 'auto' ? SYSTEM_ID : viewer.id, reason, at: 'Just now' }, ...current])
        pushNotification([ownerId], 'assigned', `${lead.name} was assigned to you by ${nameOf(viewer.id)}.`, { leadId: lead.id })
      }
      return findMember(ownerId)
    },
    reassignLead: (leadId: number, toId: string, reason: string) => assign(leadId, toId, reason),
    updateDeal: (leadId: number, deal: Deal) => {
      setDeals((current) => ({ ...current, [leadId]: deal }))
      log(leadId, 'stage', `Deal updated${deal.agreedCr ? `: agreed ₹${deal.agreedCr} Cr` : deal.offeredCr ? `: offer ₹${deal.offeredCr} Cr` : ''}`)
    },
    toggleDealDoc: (leadId: number, doc: keyof Deal['docs']) => {
      const deal = deals[leadId]
      if (!deal) return
      const done = !deal.docs[doc]
      setDeals((current) => ({ ...current, [leadId]: { ...deal, docs: { ...deal.docs, [doc]: done } } }))
      log(leadId, 'stage', `${DOC_LABELS[doc]} ${done ? 'received' : 'marked missing'}`)
    },
    /** Won or lost (lost needs a reason). Won deals count towards commission and the leaderboard; the manager and Owner are notified. */
    closeLead: (leadId: number, closure: Closure, agreedCr?: number) => {
      const lead = findLead(leadId)
      setClosures((current) => ({ ...current, [leadId]: closure }))
      log(leadId, 'stage', closure.result === 'won' ? 'Deal won' : `Deal lost: ${closure.reason}`)
      // The win dialog saves the deal in the same click, so it passes the agreed price (state isn't updated yet).
      const agreed = agreedCr ?? deals[leadId]?.agreedCr
      if (closure.result === 'won') pushNotification(approversFor(lead?.ownerId), 'deal-won', `${nameOf(lead?.ownerId)} won ${lead?.name}${agreed ? ` at ₹${agreed} Cr` : ''}.`, { leadId })
      recordAudit('deal', closure.result === 'won' ? `Marked ${lead?.name} won${agreed ? ` at ₹${agreed} Cr` : ''}` : `Marked ${lead?.name} lost · ${closure.reason}`)
    },
    reopenLead: (leadId: number) => {
      setClosures((current) => { const next = { ...current }; delete next[leadId]; return next })
      log(leadId, 'stage', 'Deal reopened')
      recordAudit('deal', `Reopened ${findLead(leadId)?.name}`)
    },
    moveToPreviousStage: (leadId: number) => {
      const lead = findLead(leadId)
      if (!lead || lead.stage === 0) return
      setStageOverrides((current) => ({ ...current, [leadId]: lead.stage - 1 }))
      log(leadId, 'stage', `Moved back to ${STAGES[lead.stage - 1]}`)
    },
    /** Drag and drop on the desktop board. */
    setStage: (leadId: number, stage: number) => {
      const lead = findLead(leadId)
      if (!lead || lead.stage === stage) return
      setStageOverrides((current) => ({ ...current, [leadId]: stage }))
      log(leadId, 'stage', `Moved to ${STAGES[stage]}`)
    },
    updateLeadProfile: (leadId: number, edit: LeadProfileEdit) => {
      setLeadEdits((current) => ({ ...current, [leadId]: edit }))
      log(leadId, 'profile', `Buyer brief updated: ${edit.need} · ${edit.budget}`)
    },
    addNote: (leadId: number, text: string) => {
      const id = nextId()
      setNotes((current) => ({ ...current, [leadId]: [{ id, text, byId: viewer.id, at: 'Just now' }, ...(current[leadId] ?? [])] }))
      log(leadId, 'note', `Note: ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`)
    },
    toggleTag: (leadId: number, tag: string) => {
      const has = (tags[leadId] ?? []).includes(tag)
      setTags((current) => ({ ...current, [leadId]: has ? (current[leadId] ?? []).filter((item) => item !== tag) : [...(current[leadId] ?? []), tag] }))
      log(leadId, 'tag', has ? `Tag removed: ${tag}` : `Tagged ${tag}`)
    },
    /** Duplicate found on capture: keep the existing lead and record the new enquiry on it. */
    mergeEnquiry: (leadId: number, summary: string) => {
      const id = nextId()
      setNotes((current) => ({ ...current, [leadId]: [{ id, text: `New enquiry merged: ${summary}`, byId: viewer.id, at: 'Just now' }, ...(current[leadId] ?? [])] }))
      log(leadId, 'merge', `Duplicate enquiry merged: ${summary}`)
    },
    inviteMember: (person: Member) => {
      setAddedMembers((current) => [...current, person])
      recordAudit('team', `Invited ${person.name} as ${person.roles.map((role) => ROLE_LABELS[role]).join(' + ')}`)
    },
    /** Deactivates someone after moving all their leads to `reassignToId`. */
    deactivateMember: (memberId: string, reassignToId: string) => {
      const owned = allLeads.filter((lead) => lead.ownerId === memberId)
      owned.forEach((lead) => assign(lead.id, reassignToId, 'Previous owner deactivated'))
      setMemberStatus((current) => ({ ...current, [memberId]: 'deactivated' }))
      recordAudit('team', `Deactivated ${findMember(memberId)?.name}; ${owned.length} lead${owned.length === 1 ? '' : 's'} moved to ${nameOf(reassignToId)}`)
    },
    reactivateMember: (memberId: string) => {
      setMemberStatus((current) => ({ ...current, [memberId]: 'active' }))
      recordAudit('team', `Reactivated ${findMember(memberId)?.name}`)
    },
    markRead: (leadId: number) => setReadLeadIds((current) => (current.includes(leadId) ? current : [...current, leadId])),
    moveToNextStage: (leadId: number) => {
      const lead = findLead(leadId)
      if (!lead) return
      const next = Math.min(STAGES.length - 1, lead.stage + 1)
      setStageOverrides((current) => ({ ...current, [leadId]: next }))
      log(leadId, 'stage', `Moved to ${STAGES[next]}`)
    },
    /** Books a visit and moves the lead to "Visit planned" unless it is already further along. Returns the confirmation text. */
    scheduleVisit: (leadId: number, plan: { day: number; time: string; propertyId: number; agentId: string }) => {
      const lead = findLead(leadId)
      if (!lead) return ''
      const property = findProperty(plan.propertyId)
      setVisits((current) => [...current, { id: Date.now(), leadId, ...plan, status: 'planned', steps: [] }])
      setStageOverrides((current) => ({ ...current, [leadId]: Math.max(lead.stage, 2) }))
      const agent = findMember(plan.agentId)
      log(leadId, 'visit', `Visit booked: ${property?.name} · ${dayLabel(plan.day)} ${plan.time}${agent ? ` with ${agent.name}` : ''}`)
      return `Visit confirmed: ${property?.name}, ${property?.locality}, ${dayLabel(plan.day)} at ${plan.time}. I’ll share the location pin before we meet.`
    },
    setPretendLocation,
    /** Office check-in: refused beyond the radius of the viewer's office; late after start + grace. */
    officeCheckIn: (reading: Reading): VisitStepResult => {
      const office = officeFor(viewer)
      const away = Math.round(distanceM(reading, office))
      if (away > settings.checkInRadiusM || reading.accuracyM > MAX_ACCURACY_M) {
        setToday({ refused: (todayFor(viewer.id).refused ?? 0) + 1 })
        return { ok: false, message: reading.accuracyM > MAX_ACCURACY_M
          ? `Your location is only accurate to ${formatDistance(reading.accuracyM)}. Try again near a window.`
          : `You’re ${formatDistance(away)} from ${office.name}. Check in when you reach the office, or start a field day.` }
      }
      const now = new Date()
      const late = now.getHours() * 60 + now.getMinutes() > slotMinutes(settings.workStart) + settings.graceMin
      setToday({ status: 'office', mode: 'office', inAt: clockLabel(now), late })
      return { ok: true, message: `Checked in at ${office.name}${late ? ' (late)' : ''}.` }
    },
    /** Field day: present once the first client check-in of the day is verified. */
    startFieldDay: () => setToday({ status: 'field', mode: 'field', inAt: clockLabel() }),
    /** End of day. Office days must check out at the office; field days can check out anywhere. */
    checkOutForDay: (reading: Reading): VisitStepResult => {
      const today = todayFor(viewer.id)
      if (today.mode === 'office') {
        const office = officeFor(viewer)
        const away = Math.round(distanceM(reading, office))
        if (away > settings.checkInRadiusM) return { ok: false, message: `You’re ${formatDistance(away)} from ${office.name}. Check out at the office.` }
      }
      setToday({ status: 'out', outAt: clockLabel() })
      return { ok: true, message: 'Checked out for the day.' }
    },
    applyLeave: (request: Pick<LeaveRequest, 'type' | 'from' | 'to' | 'reason'>) => {
      setLeaveRequests((current) => [...current, { ...request, id: Date.now(), memberId: viewer.id, status: 'pending' }])
      const days = leaveDays(request)
      pushNotification(approversFor(viewer.id), 'leave-request', `${nameOf(viewer.id)} asked for ${days} day${days === 1 ? '' : 's'} of ${request.type} leave (${request.reason}).`, { view: 'attendance' })
    },
    /**
     * Approve (with a cover) or reject (spec §8.8). Visits on the leave days move to the cover now.
     * Leads move when the leave starts: immediately if it covers today, otherwise via startCover.
     */
    decideLeave: (id: number, approve: boolean, coverId?: string) => {
      const request = leaveRequests.find((item) => item.id === id)
      if (!request) return
      if (!approve || !coverId) {
        setLeaveRequests((current) => current.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item)))
        pushNotification([request.memberId], 'leave-decision', `Your ${request.type} leave request was declined by ${nameOf(viewer.id)}.`, { view: 'attendance' })
        return
      }
      pushNotification([request.memberId], 'leave-decision', `Your ${request.type} leave was approved. ${nameOf(coverId)} will cover your leads and visits.`, { view: 'attendance' })
      pushNotification([coverId], 'leave-decision', `You’re covering for ${nameOf(request.memberId)} during their leave (${dayLabel(request.from)} – ${dayLabel(request.to)}).`, { view: 'attendance' })
      const movedVisitIds = visits
        .filter((visit) => visit.agentId === request.memberId && isOpenVisit(visit) && visit.day >= request.from && visit.day <= request.to)
        .map((visit) => visit.id)
      setVisits((current) => current.map((visit) => (movedVisitIds.includes(visit.id) ? { ...visit, agentId: coverId } : visit)))
      const movedLeadIds = request.from <= 0 ? moveLeadsToCover(request, coverId) : undefined
      setLeaveRequests((current) => current.map((item) => (item.id === id ? { ...item, status: 'approved', coverId, movedLeadIds, movedVisitIds } : item)))
    },
    /** Hand the person's leads to their cover (when leave starts; a demo button for future leave). */
    startCover: (id: number) => {
      const request = leaveRequests.find((item) => item.id === id)
      if (!request?.coverId || request.movedLeadIds) return
      const movedLeadIds = moveLeadsToCover(request, request.coverId)
      setLeaveRequests((current) => current.map((item) => (item.id === id ? { ...item, movedLeadIds } : item)))
    },
    /** Leave over (or cut short): leads still with the cover go back to the person. */
    returnFromLeave: (id: number) => {
      const request = leaveRequests.find((item) => item.id === id)
      if (!request || !request.coverId) return
      // Only what was moved for this leave, and only if the cover still has it.
      for (const leadId of request.movedLeadIds ?? []) {
        if (allLeads.find((lead) => lead.id === leadId)?.ownerId === request.coverId) assign(leadId, request.memberId, 'Back from leave')
      }
      const visitIds = request.movedVisitIds ?? []
      setVisits((current) => current.map((visit) =>
        visitIds.includes(visit.id) && visit.agentId === request.coverId && isOpenVisit(visit) ? { ...visit, agentId: request.memberId } : visit))
      setLeaveRequests((current) => current.map((item) => (item.id === id ? { ...item, status: 'ended', endedOn: Math.max(request.from, 0) } : item)))
    },
    requestCorrection: (day: number, reason: string) => {
      setCorrections((current) => [...current, { id: Date.now(), memberId: viewer.id, day, reason, status: 'pending' }])
      pushNotification(approversFor(viewer.id), 'correction', `${nameOf(viewer.id)} asked to correct attendance for ${dayLabel(day)}: ${reason}`, { view: 'attendance' })
    },
    decideCorrection: (id: number, approve: boolean) => {
      const request = corrections.find((item) => item.id === id)
      setCorrections((current) => current.map((item) => (item.id === id ? { ...item, status: approve ? 'approved' : 'rejected' } : item)))
      if (request) pushNotification([request.memberId], 'correction', `Your attendance correction for ${dayLabel(request.day)} was ${approve ? 'approved' : 'declined'}.`, { view: 'attendance' })
    },
    /**
     * One step of the agent's visit flow, from a single location reading (spec §8.6):
     * "Left office" is recorded wherever it happens; "Check in" is refused beyond the radius or
     * if the reading is too imprecise; "Check out" needs a verified check-in first.
     */
    recordVisitStep: (visitId: number, step: 'left-office' | 'check-in' | 'check-out', reading: Reading): VisitStepResult => {
      const visit = visits.find((item) => item.id === visitId)
      const property = visit ? findProperty(visit.propertyId) : undefined
      if (!visit || !property) return { ok: false, message: 'Visit not found.' }
      const at = clockLabel()
      const radius = settings.checkInRadiusM
      if (step === 'left-office') {
        const office = officeFor(findMember(visit.agentId))
        const fromOffice = Math.round(distanceM(reading, office))
        const note = fromOffice <= radius ? undefined : `${formatDistance(fromOffice)} from ${office.name}`
        updateVisit(visitId, (current) => ({ ...current, status: 'on-the-way', steps: [...current.steps, { kind: 'left-office', at, distanceM: fromOffice, accuracyM: reading.accuracyM, note }] }))
        log(visit.leadId, 'visit', `Left for the visit at ${at}${note ? ` (${note})` : ' from the office'}`)
        return { ok: true, message: note ? `Recorded. You were ${note}.` : 'Recorded: left the office.' }
      }
      const away = Math.round(distanceM(reading, property))
      if (step === 'check-in') {
        const tooVague = reading.accuracyM > MAX_ACCURACY_M
        if (away > radius || tooVague) {
          const message = tooVague
            ? `Your location is only accurate to ${formatDistance(reading.accuracyM)}. Move to an open spot and try again.`
            : `You’re ${formatDistance(away)} from ${property.name}. Move closer to check in.`
          updateVisit(visitId, (current) => ({ ...current, steps: [...current.steps, { kind: 'check-in-refused', at, distanceM: away, accuracyM: reading.accuracyM, note: tooVague ? 'Location too imprecise' : 'Too far from the property' }] }))
          log(visit.leadId, 'visit', `Check-in refused at ${at}: ${tooVague ? 'location too imprecise' : `${formatDistance(away)} from ${property.name}`}`)
          pushNotification(approversFor(visit.agentId), 'checkin-refused', `${nameOf(visit.agentId)}’s check-in at ${property.name} was refused (${tooVague ? 'location too imprecise' : `${formatDistance(away)} away`}).`, { view: 'visits' })
          return { ok: false, message }
        }
        updateVisit(visitId, (current) => ({ ...current, status: 'checked-in', steps: [...current.steps, { kind: 'check-in', at, distanceM: away, accuracyM: reading.accuracyM }] }))
        log(visit.leadId, 'visit', `Checked in at ${property.name} (verified, ${formatDistance(away)} away)`)
        return { ok: true, message: `Checked in at ${property.name}.` }
      }
      if (visit.status !== 'checked-in') return { ok: false, message: 'Check in before checking out.' }
      updateVisit(visitId, (current) => ({ ...current, steps: [...current.steps, { kind: 'check-out', at, distanceM: away, accuracyM: reading.accuracyM }] }))
      return { ok: true, message: 'Checked out. Add the visit outcome.' }
    },
    /** Required after check-out: what the buyer thought and what happens next. */
    completeVisit: (visitId: number, outcome: VisitOutcome) => {
      const visit = visits.find((item) => item.id === visitId)
      if (!visit) return
      updateVisit(visitId, (current) => ({ ...current, status: 'completed', outcome }))
      log(visit.leadId, 'visit', `Visit outcome: ${outcome.result}${outcome.feedback ? ` · ${outcome.feedback}` : ''}${outcome.nextStep ? ` · Next: ${outcome.nextStep}` : ''}`)
    },
    /** Adds a WhatsApp message to the lead's chat. Team and auto-reply messages are logged on the timeline. */
    sendMessage: (leadId: number, text: string, options: { from?: ChatEntry['from']; template?: string } = {}) => {
      const from = options.from ?? 'agent'
      setChats((current) => ({ ...current, [leadId]: [...(current[leadId] ?? []), { from, text, at: clockLabel(), template: options.template }] }))
      if (from === 'buyer') return
      const short = text.length > 80 ? `${text.slice(0, 80)}…` : text
      if (from === 'auto') log(leadId, 'message', `Auto-reply sent: “${short}”`, SYSTEM_ID)
      else log(leadId, 'message', options.template ? `Template “${options.template}” sent` : `WhatsApp sent: “${short}”`)
    },
    setQualifyStep: (leadId: number, step: number) => setQualifySteps((current) => ({ ...current, [leadId]: step })),
    /** AI read the chat and suggests brief fields; they stay suggestions until a person accepts them (spec §8.13). */
    suggestProfile: (leadId: number, patch: Partial<LeadProfileEdit>) =>
      setAiSuggestions((current) => ({ ...current, [leadId]: { ...current[leadId], ...patch } })),
    acceptSuggestions: (leadId: number) => {
      const lead = allLeads.find((item) => item.id === leadId)
      const patch = aiSuggestions[leadId]
      if (!lead || !patch) return
      const { need, budget, budgetCr, locality, localities, moveIn, mustHave, purpose } = { ...lead, ...patch }
      setLeadEdits((current) => ({ ...current, [leadId]: { need, budget, budgetCr, locality, localities, moveIn, mustHave, purpose } }))
      setAiSuggestions((current) => { const next = { ...current }; delete next[leadId]; return next })
      log(leadId, 'profile', `AI suggestions accepted: ${[patch.budget, patch.need, patch.moveIn].filter(Boolean).join(' · ')}`)
    },
    dismissSuggestions: (leadId: number) =>
      setAiSuggestions((current) => { const next = { ...current }; delete next[leadId]; return next }),
    toggleTask: (taskId: number) =>
      setCompletedTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId])),
    addExtraReminder: () => {
      const leadId = leads[0]?.id
      if (leadId === undefined) return
      setTasks((current) => (current.some((task) => task.id === EXTRA_REMINDER.id) ? current : [...current, { ...EXTRA_REMINDER, leadId }]))
    },
    /** Saves a recorded call with an AI summary (demo text) as its note. */
    addRecording: (leadId: number, duration: number) => {
      const lead = allLeads.find((item) => item.id === leadId)
      const note = lead ? callSummary(lead, duration) : 'New recorded call'
      setRecordings((current) => [{ id: Date.now(), leadId, when: 'Just now', duration, note, aiSummary: true }, ...current])
      log(leadId, 'call', `Call recorded (${formatDuration(duration)}) · AI summary: ${note}`)
    },
    /** Adds a listing (id 0) or replaces an existing one. Returns the saved listing. */
    saveProperty: (property: Property): Property => {
      const saved = property.id ? property : { ...property, id: Math.max(0, ...properties.map((item) => item.id)) + 1, addedInDemo: true }
      setProperties((current) => (property.id ? current.map((item) => (item.id === property.id ? saved : item)) : [...current, saved]))
      const before = findProperty(property.id)
      const changed = before ? [
        before.priceCr !== saved.priceCr && `price ${priceLabel(before)} → ${priceLabel(saved)}`,
        before.status !== saved.status && `availability → ${saved.status === 'hold' ? 'on hold' : saved.status}`,
        before.listingAgentId !== saved.listingAgentId && `listing agent → ${nameOf(saved.listingAgentId)}`,
        (before.ownerName !== saved.ownerName || before.ownerPhone !== saved.ownerPhone) && 'owner contact',
      ].filter(Boolean) : []
      recordAudit('property', before ? `Edited ${saved.name}${changed.length ? `: ${changed.join(', ')}` : ''}` : `Added ${saved.name} (${saved.locality}, ${priceLabel(saved)})`)
      return saved
    },
    /** Sends listings to a lead on WhatsApp (as a template outside the 24-hour window); "Seen" follows a few seconds later 🎭. */
    shareProperties: (leadId: number, propertyIds: number[], text: string, template?: string) => {
      const at = clockLabel()
      setChats((current) => ({ ...current, [leadId]: [...(current[leadId] ?? []), { from: 'agent', text, at, template, propertyIds }] }))
      setShares((current) => ({ ...current, [leadId]: [...(current[leadId] ?? []).filter((share) => !propertyIds.includes(share.propertyId)), ...propertyIds.map((propertyId) => ({ propertyId, at, seen: false }))] }))
      const names = propertyIds.map((id) => findProperty(id)?.name).filter(Boolean).join(', ')
      log(leadId, 'message', `${template ? `Template “${template}” sent with` : 'Shared on WhatsApp:'} ${names}`)
      window.setTimeout(() => setShares((current) => ({ ...current, [leadId]: (current[leadId] ?? []).map((share) => (propertyIds.includes(share.propertyId) ? { ...share, seen: true } : share)) })), 4000)
    },
    toggleSavedProperty: (propertyId: number) =>
      setSavedPropertyIds((current) => (current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [...current, propertyId])),
    // ---------- Notifications and audit (spec §8.12) ----------
    /** The viewer's notifications, newest first. */
    notifications: notifications.filter((item) => item.forId === viewer.id),
    unreadNotifications: notifications.filter((item) => item.forId === viewer.id && !item.read).length,
    markNotificationRead: (id: number) => setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item))),
    markAllNotificationsRead: () => setNotifications((current) => current.map((item) => (item.forId === viewer.id ? { ...item, read: true } : item))),
    auditLog,
    /** Records a CSV export in the audit log (the file itself is built by the screen). */
    recordExport: (text: string) => recordAudit('export', text),
    resetDemo: () => {
      clearDemoStorage()
      window.location.reload()
    },
  }
}

export type DemoStore = ReturnType<typeof useDemoStore>
