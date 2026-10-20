// The brokerage's people, teams and roles (spec §8.1). Seed data only; changes
// (invites, deactivations) are stored by `state/useDemoStore.ts`.
import type { AvatarColor } from './demo'

export type Role = 'owner' | 'manager' | 'sales' | 'presales'
export type MemberStatus = 'active' | 'on-leave' | 'deactivated'
export type TeamId = 'indiranagar' | 'whitefield' | 'hsr'

export type Member = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  /** One person can hold several roles (e.g. Sales + Pre-sales in a small company). */
  roles: Role[]
  /** Area team. Owner and central pre-sales have none. */
  teamId?: TeamId
  phone: string
  status: MemberStatus
}

export type Team = { id: TeamId; name: string; locality: string; managerId: string }

export const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', manager: 'Manager', sales: 'Sales', presales: 'Pre-sales' }

export const TEAMS: Team[] = [
  { id: 'indiranagar', name: 'Indiranagar', locality: 'Indiranagar', managerId: 'm-neha' },
  { id: 'whitefield', name: 'Whitefield', locality: 'Whitefield', managerId: 'm-rahul' },
  { id: 'hsr', name: 'HSR Layout', locality: 'HSR Layout', managerId: 'm-farah' },
]

const member = (id: string, name: string, initials: string, color: AvatarColor, roles: Role[], teamId: TeamId | undefined, phone: string, status: MemberStatus = 'active'): Member =>
  ({ id, name, initials, color, roles, teamId, phone, status })

export const SEED_MEMBERS: Member[] = [
  member('m-arjun', 'Arjun Khanna', 'AK', 'blue', ['owner'], undefined, '+91 98450 11020'),
  // Indiranagar
  member('m-neha', 'Neha Kapoor', 'NK', 'violet', ['manager'], 'indiranagar', '+91 98450 22031'),
  member('m-priya', 'Priya Nair', 'PN', 'coral', ['sales'], 'indiranagar', '+91 98450 33042'),
  member('m-aditya', 'Aditya Rao', 'AR', 'gold', ['sales'], 'indiranagar', '+91 98450 44053'),
  member('m-kavya', 'Kavya Reddy', 'KR', 'blue', ['sales'], 'indiranagar', '+91 98450 55064', 'on-leave'),
  member('m-sameer', 'Sameer Joshi', 'SJ', 'violet', ['sales'], 'indiranagar', '+91 98450 66075'),
  member('m-divya', 'Divya Iyer', 'DI', 'gold', ['sales'], 'indiranagar', '+91 98450 77086'),
  // Whitefield
  member('m-rahul', 'Rahul Menon', 'RM', 'gold', ['manager'], 'whitefield', '+91 99000 12345'),
  member('m-vivek', 'Vivek Sharma', 'VS', 'blue', ['sales'], 'whitefield', '+91 99000 23456'),
  member('m-ritu', 'Ritu Bansal', 'RB', 'coral', ['sales'], 'whitefield', '+91 99000 34567'),
  member('m-manoj', 'Manoj Kumar', 'MK', 'violet', ['sales'], 'whitefield', '+91 99000 45678'),
  member('m-ayesha', 'Ayesha Khan', 'AK', 'gold', ['sales'], 'whitefield', '+91 99000 56789'),
  member('m-karthik', 'Karthik Srinivas', 'KS', 'blue', ['sales'], 'whitefield', '+91 99000 67890'),
  // HSR Layout
  member('m-farah', 'Farah Sheikh', 'FS', 'coral', ['manager'], 'hsr', '+91 97400 11223'),
  member('m-sneha', 'Sneha Pillai', 'SP', 'violet', ['sales'], 'hsr', '+91 97400 22334'),
  member('m-rohit', 'Rohit Verma', 'RV', 'gold', ['sales'], 'hsr', '+91 97400 33445'),
  member('m-ananth', 'Ananth Krishnan', 'AK', 'blue', ['sales'], 'hsr', '+91 97400 44556'),
  member('m-meghna', 'Meghna Das', 'MD', 'coral', ['sales'], 'hsr', '+91 97400 55667'),
  member('m-tarun', 'Tarun Gowda', 'TG', 'violet', ['sales'], 'hsr', '+91 97400 66778'),
  // Central pre-sales (telecallers)
  member('m-kiran', 'Kiran Patel', 'KP', 'gold', ['presales'], undefined, '+91 96320 11234'),
  member('m-lakshmi', 'Lakshmi Narayan', 'LN', 'coral', ['presales'], undefined, '+91 96320 22345'),
  member('m-imran', 'Imran Ali', 'IA', 'blue', ['presales'], undefined, '+91 96320 33456'),
]

/** The four people the demo "View as" switcher can become, one per role. */
export const VIEW_AS_PERSONAS = ['m-arjun', 'm-neha', 'm-priya', 'm-kiran'] as const

export const DEFAULT_VIEWER_ID = 'm-arjun'

/** "Priya Nair" → "Priya N." */
export function shortName(name: string): string {
  const [first, last] = name.trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

/** "Manager · Indiranagar", "Sales · HSR Layout", "Owner", "Pre-sales" */
export function roleSummary(person: Member): string {
  const roles = person.roles.map((role) => ROLE_LABELS[role]).join(' + ')
  const team = TEAMS.find((team) => team.id === person.teamId)
  return team ? `${roles} · ${team.name}` : roles
}
