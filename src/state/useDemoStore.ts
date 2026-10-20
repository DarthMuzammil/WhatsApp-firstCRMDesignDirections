import { useMemo } from 'react'
import {
  COMMISSION_RATE, EXTRA_REMINDER, SEED_LEADS, SEED_RECORDINGS, SEED_TASKS, SEED_VISIT, STAGES, STAGE_CLOSE_PROBABILITY,
  type Lead, type LeadSeed, type Recording, type Task,
} from '../data/demo'
import { nextSaturdayLabel } from '../lib/format'
import { clearDemoStorage, useLocalState } from '../lib/storage'

/**
 * Single source of truth for everything the demo remembers: added leads,
 * pipeline stages, read state, sent messages, tasks, recordings and saved homes.
 * Components read derived values from here and call the actions; none of them
 * touch localStorage directly.
 */
export function useDemoStore() {
  const [addedLeads, setAddedLeads] = useLocalState<LeadSeed[]>('added-leads', [])
  const [stageOverrides, setStageOverrides] = useLocalState<Record<number, number>>('stages', {})
  const [visitLeadIds, setVisitLeadIds] = useLocalState<number[]>('visits', [])
  const [readLeadIds, setReadLeadIds] = useLocalState<number[]>('read-leads', [])
  const [sentMessages, setSentMessages] = useLocalState<Record<number, string[]>>('sent-messages', {})
  const [tasks, setTasks] = useLocalState<Task[]>('tasks', SEED_TASKS)
  const [completedTaskIds, setCompletedTaskIds] = useLocalState<number[]>('completed-tasks', [])
  const [recordings, setRecordings] = useLocalState<Recording[]>('recordings', SEED_RECORDINGS)
  const [savedPropertyIds, setSavedPropertyIds] = useLocalState<number[]>('saved-properties', [])

  const leads: Lead[] = useMemo(
    () => [...addedLeads, ...SEED_LEADS].map((lead) => ({
      ...lead,
      unread: readLeadIds.includes(lead.id) ? 0 : lead.unread,
      stage: stageOverrides[lead.id] ?? lead.initialStage,
      visitScheduled: visitLeadIds.includes(lead.id),
    })),
    [addedLeads, readLeadIds, stageOverrides, visitLeadIds],
  )

  const findLead = (id: number) => leads.find((lead) => lead.id === id)
  const unreadTotal = leads.reduce((sum, lead) => sum + lead.unread, 0)
  const leadsAwaitingReply = leads.filter((lead) => lead.unread > 0).length
  const remainingTasks = tasks.filter((task) => !completedTaskIds.includes(task.id))
  const activeValueCr = leads.reduce((sum, lead) => sum + lead.budgetCr, 0)
  const weightedCommissionCr = leads.reduce((sum, lead) => sum + lead.budgetCr * COMMISSION_RATE * STAGE_CLOSE_PROBABILITY[lead.stage], 0)
  /** Visits in date order: the seeded visit today, then every visit booked in the demo (coming Saturday). */
  const upcomingVisits: { lead: Lead; when: string }[] = [
    ...leads.filter((lead) => lead.id === SEED_VISIT.leadId).map((lead) => ({ lead, when: SEED_VISIT.time })),
    ...visitLeadIds
      .filter((id) => id !== SEED_VISIT.leadId)
      .map((id) => leads.find((lead) => lead.id === id))
      .filter((lead): lead is Lead => !!lead)
      .map((lead) => ({ lead, when: `${nextSaturdayLabel()} · 11:30 AM` })),
  ]

  return {
    leads,
    findLead,
    tasks,
    remainingTasks,
    completedTaskIds,
    recordings,
    savedPropertyIds,
    sentMessages,
    unreadTotal,
    leadsAwaitingReply,
    activeValueCr,
    weightedCommissionCr,
    upcomingVisits,
    extraReminderAdded: tasks.some((task) => task.id === EXTRA_REMINDER.id),

    addLead: (lead: LeadSeed) => setAddedLeads((current) => [lead, ...current]),
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
    addExtraReminder: () =>
      setTasks((current) => (current.some((task) => task.id === EXTRA_REMINDER.id) ? current : [...current, EXTRA_REMINDER])),
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
