import { useMemo } from 'react'
import {
  COMMISSION_RATE, EXTRA_REMINDER, RESPONSE_SLA_MINUTES, SEED_LEADS, SEED_RECORDINGS, SEED_TASKS, SEED_VISIT, STAGES, STAGE_CLOSE_PROBABILITY,
  type Lead, type LeadSeed, type Recording, type Task,
} from '../data/demo'
import { DEFAULT_VIEWER_ID, SEED_MEMBERS, TEAMS, type Member, type MemberStatus } from '../data/team'
import { maskPhone, nextSaturdayLabel } from '../lib/format'
import { can, canSeeLead, type Permission } from '../lib/permissions'
import { clearDemoStorage, useLocalState } from '../lib/storage'

export type RoutingMode = 'round-robin' | 'locality' | 'source'
export type CompanySettings = {
  /** On: new leads go to Pre-sales first, who hand qualified leads to Sales. Off: Sales handles leads end to end. */
  separatePresales: boolean
  routing: RoutingMode
}
/** One change of lead owner, shown on the lead's history (spec §8.2). */
export type Assignment = { leadId: number; fromId: string | null; toId: string; byId: string; reason: string; at: string }

const DEFAULT_SETTINGS: CompanySettings = { separatePresales: true, routing: 'round-robin' }

/**
 * Single source of truth for everything the demo remembers: team and settings,
 * who is viewing ("View as"), leads and their owners, stages, read state,
 * messages, tasks, recordings and saved homes.
 * `leads`, `tasks`, `recordings` and every number derived from them are already
 * filtered to what the current viewer is allowed to see.
 */
export function useDemoStore() {
  const [viewerId, setViewerId] = useLocalState<string>('viewer', DEFAULT_VIEWER_ID)
  const [settings, setSettings] = useLocalState<CompanySettings>('settings', DEFAULT_SETTINGS)
  const [addedMembers, setAddedMembers] = useLocalState<Member[]>('added-members', [])
  const [memberStatus, setMemberStatus] = useLocalState<Record<string, MemberStatus>>('member-status', {})
  const [addedLeads, setAddedLeads] = useLocalState<LeadSeed[]>('added-leads', [])
  const [ownerOverrides, setOwnerOverrides] = useLocalState<Record<number, string | null>>('owners', {})
  const [assignments, setAssignments] = useLocalState<Assignment[]>('assignments', [])
  const [stageOverrides, setStageOverrides] = useLocalState<Record<number, number>>('stages', {})
  const [visitLeadIds, setVisitLeadIds] = useLocalState<number[]>('visits', [])
  const [readLeadIds, setReadLeadIds] = useLocalState<number[]>('read-leads', [])
  const [sentMessages, setSentMessages] = useLocalState<Record<number, string[]>>('sent-messages', {})
  const [tasks, setTasks] = useLocalState<Task[]>('tasks', SEED_TASKS)
  const [completedTaskIds, setCompletedTaskIds] = useLocalState<number[]>('completed-tasks', [])
  const [recordings, setRecordings] = useLocalState<Recording[]>('recordings', SEED_RECORDINGS)
  const [savedPropertyIds, setSavedPropertyIds] = useLocalState<number[]>('saved-properties', [])

  // ---------- People ----------
  const members: Member[] = useMemo(
    () => [...SEED_MEMBERS, ...addedMembers].map((person) => ({ ...person, status: memberStatus[person.id] ?? person.status })),
    [addedMembers, memberStatus],
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
        unread,
        ownerId: lead.id in ownerOverrides ? ownerOverrides[lead.id] : lead.ownerId,
        stage: stageOverrides[lead.id] ?? lead.initialStage,
        visitScheduled: visitLeadIds.includes(lead.id),
        overdue: unread > 0 && lead.minutesAgo > RESPONSE_SLA_MINUTES,
      }
    }),
    [addedLeads, ownerOverrides, readLeadIds, stageOverrides, visitLeadIds],
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

  /** Routing (spec §8.2): Pre-sales first if enabled, else Sales by locality or fewest open leads. */
  function routeLead(lead: Pick<LeadSeed, 'locality'>): string | null {
    const presales = members.filter((person) => person.status === 'active' && person.roles.includes('presales'))
    let pool = settings.separatePresales && presales.length > 0 ? presales : salesMembers
    if (pool === salesMembers && settings.routing === 'locality') {
      const team = TEAMS.find((item) => item.locality.toLowerCase() === lead.locality.toLowerCase())
      const local = salesMembers.filter((person) => person.teamId === team?.id)
      if (local.length > 0) pool = local
    }
    return [...pool].sort((a, b) => openLeadCount(a.id) - openLeadCount(b.id))[0]?.id ?? null
  }

  function assign(leadId: number, toId: string, reason: string) {
    const fromId = allLeads.find((lead) => lead.id === leadId)?.ownerId ?? null
    setOwnerOverrides((current) => ({ ...current, [leadId]: toId }))
    setAssignments((current) => [{ leadId, fromId, toId, byId: viewer.id, reason, at: 'Just now' }, ...current])
  }

  // ---------- Work items (scoped to visible leads) ----------
  const visibleTasks = tasks.filter((task) => visibleIds.has(task.leadId))
  const remainingTasks = visibleTasks.filter((task) => !completedTaskIds.includes(task.id))
  const visibleRecordings = recordings.filter((recording) => visibleIds.has(recording.leadId))
  const unreadTotal = leads.reduce((sum, lead) => sum + lead.unread, 0)
  const leadsAwaitingReply = leads.filter((lead) => lead.unread > 0).length
  const escalations = leads.filter((lead) => lead.overdue || lead.ownerId === null)
  const activeValueCr = leads.reduce((sum, lead) => sum + lead.budgetCr, 0)
  const weightedCommissionCr = leads.reduce((sum, lead) => sum + lead.budgetCr * COMMISSION_RATE * STAGE_CLOSE_PROBABILITY[lead.stage], 0)
  /** Visits in date order: the seeded visit today, then every visit booked in the demo (coming Saturday). */
  const upcomingVisits: { lead: Lead; when: string }[] = [
    ...leads.filter((lead) => lead.id === SEED_VISIT.leadId).map((lead) => ({ lead, when: SEED_VISIT.time })),
    ...visitLeadIds
      .filter((id) => id !== SEED_VISIT.leadId)
      .map((id) => findLead(id))
      .filter((lead): lead is Lead => !!lead)
      .map((lead) => ({ lead, when: `${nextSaturdayLabel()} · 11:30 AM` })),
  ]

  return {
    // People & access
    viewer,
    viewerCan,
    /** Full number for managers/owner, masked for everyone else (spec §8.0). */
    displayPhone: (phone: string) => (can(viewer, 'seeFullNumbers') ? phone : maskPhone(phone)),
    members,
    findMember,
    settings,
    assignableMembers,
    openLeadCount,
    // Leads & work
    leads,
    allLeads,
    findLead,
    assignments,
    tasks: visibleTasks,
    remainingTasks,
    completedTaskIds,
    recordings: visibleRecordings,
    savedPropertyIds,
    sentMessages,
    unreadTotal,
    leadsAwaitingReply,
    escalations,
    activeValueCr,
    weightedCommissionCr,
    upcomingVisits,
    extraReminderAdded: tasks.some((task) => task.id === EXTRA_REMINDER.id),

    // ---------- Actions ----------
    setViewer: (memberId: string) => setViewerId(memberId),
    updateSettings: (patch: Partial<CompanySettings>) => setSettings((current) => ({ ...current, ...patch })),
    /** Adds a lead. Sales/Pre-sales own what they add; otherwise `ownerChoice` ('auto' = routing) decides. */
    addLead: (lead: LeadSeed, ownerChoice: string | 'auto') => {
      const ownedByViewer = viewer.roles.includes('sales') || viewer.roles.includes('presales')
      const ownerId = ownedByViewer ? viewer.id : ownerChoice === 'auto' ? routeLead(lead) : ownerChoice
      setAddedLeads((current) => [{ ...lead, ownerId }, ...current])
      if (ownerId) {
        const reason = ownedByViewer ? 'Added by them' : ownerChoice === 'auto' ? `Routing: ${settings.routing.replace('-', ' ')}` : 'Assigned on capture'
        setAssignments((current) => [{ leadId: lead.id, fromId: null, toId: ownerId, byId: viewer.id, reason, at: 'Just now' }, ...current])
      }
      return findMember(ownerId)
    },
    reassignLead: (leadId: number, toId: string, reason: string) => assign(leadId, toId, reason),
    inviteMember: (person: Member) => setAddedMembers((current) => [...current, person]),
    /** Deactivates someone after moving all their leads to `reassignToId`. */
    deactivateMember: (memberId: string, reassignToId: string) => {
      allLeads.filter((lead) => lead.ownerId === memberId).forEach((lead) => assign(lead.id, reassignToId, 'Previous owner deactivated'))
      setMemberStatus((current) => ({ ...current, [memberId]: 'deactivated' }))
    },
    reactivateMember: (memberId: string) => setMemberStatus((current) => ({ ...current, [memberId]: 'active' })),
    markRead: (leadId: number) => setReadLeadIds((current) => (current.includes(leadId) ? current : [...current, leadId])),
    moveToNextStage: (leadId: number) => {
      const lead = findLead(leadId)
      if (!lead) return
      setStageOverrides((current) => ({ ...current, [leadId]: Math.min(STAGES.length - 1, lead.stage + 1) }))
    },
    /** Books the Saturday visit and moves the lead to "Visit planned" unless it is already further along. */
    scheduleVisit: (leadId: number) => {
      const lead = findLead(leadId)
      if (!lead) return
      setVisitLeadIds((current) => (current.includes(leadId) ? current : [...current, leadId]))
      setStageOverrides((current) => ({ ...current, [leadId]: Math.max(lead.stage, 2) }))
    },
    sendMessage: (leadId: number, text: string) =>
      setSentMessages((current) => ({ ...current, [leadId]: [...(current[leadId] ?? []), text] })),
    toggleTask: (taskId: number) =>
      setCompletedTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId])),
    addExtraReminder: () => {
      const leadId = leads[0]?.id
      if (leadId === undefined) return
      setTasks((current) => (current.some((task) => task.id === EXTRA_REMINDER.id) ? current : [...current, { ...EXTRA_REMINDER, leadId }]))
    },
    addRecording: (leadId: number, duration: number) =>
      setRecordings((current) => [{ id: Date.now(), leadId, when: 'Just now', duration, note: 'New recorded call · Add a note' }, ...current]),
    toggleSavedProperty: (propertyId: number) =>
      setSavedPropertyIds((current) => (current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [...current, propertyId])),
    resetDemo: () => {
      clearDemoStorage()
      window.location.reload()
    },
  }
}

export type DemoStore = ReturnType<typeof useDemoStore>
