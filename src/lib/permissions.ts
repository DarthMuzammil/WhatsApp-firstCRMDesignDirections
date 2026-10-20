import type { Member, Role } from '../data/team'

/** What a role is allowed to do (spec §8.1). A person's permissions are the union of their roles. */
export type Permission =
  | 'seeAllLeads'
  | 'seeTeamLeads'
  | 'reassignLeads'
  | 'seeFullNumbers'
  | 'manageTeam'
  | 'manageSettings'
  | 'viewReports'
  | 'exportData'
  | 'handToSales'
  | 'manageInventory'
  | 'seeOwnerContact'
  | 'viewAuditLog'
  | 'handleVisits'

export const PERMISSION_LABELS: Record<Permission, string> = {
  seeAllLeads: 'See every lead in the company',
  seeTeamLeads: 'See their team’s leads',
  reassignLeads: 'Assign and reassign leads',
  seeFullNumbers: 'See full phone numbers',
  manageTeam: 'Invite and deactivate people',
  manageSettings: 'Change company settings',
  viewReports: 'View team reports',
  exportData: 'Export data',
  handToSales: 'Hand qualified leads to Sales',
  manageInventory: 'Add and edit properties',
  seeOwnerContact: 'See property owners’ numbers',
  viewAuditLog: 'See the audit log',
  handleVisits: 'Run and track property visits',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['seeAllLeads', 'seeTeamLeads', 'reassignLeads', 'seeFullNumbers', 'manageTeam', 'manageSettings', 'viewReports', 'exportData', 'manageInventory', 'seeOwnerContact', 'viewAuditLog', 'handleVisits'],
  manager: ['seeTeamLeads', 'reassignLeads', 'seeFullNumbers', 'manageTeam', 'viewReports', 'manageInventory', 'seeOwnerContact', 'handleVisits'],
  sales: ['manageInventory', 'handleVisits'],
  presales: ['handToSales'],
}

export function can(person: Member, permission: Permission): boolean {
  return person.roles.some((role) => ROLE_PERMISSIONS[role].includes(permission))
}

/** Leads a person may see: everything (owner), their team's plus unassigned (manager), or their own. */
export function canSeeLead(viewer: Member, ownerId: string | null, members: Member[]): boolean {
  if (can(viewer, 'seeAllLeads')) return true
  if (ownerId === viewer.id) return true
  if (can(viewer, 'seeTeamLeads')) {
    if (ownerId === null) return true
    const owner = members.find((person) => person.id === ownerId)
    return !!owner && !!viewer.teamId && owner.teamId === viewer.teamId
  }
  return false
}
