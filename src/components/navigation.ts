import type { Permission } from '../lib/permissions'
import type { IconName } from './Icon'

/** Every screen in the app. `chat` is reached from a lead, not from the nav; while it is open the nav highlights the screen it was opened from. */
export type View = 'today' | 'chat' | 'visits' | 'attendance' | 'reports' | 'pipeline' | 'properties' | 'tasks' | 'calls' | 'escalations' | 'sources' | 'team' | 'settings' | 'audit'

export type NavItem = {
  view: Exclude<View, 'chat'>
  icon: IconName
  /** The same name on every screen size (sidebar, phone tab bar, More sheet). */
  label: string
  group: 'work' | 'manage'
  /** Only shown to people with this permission. */
  requires?: Permission
}

/** Nav items shared by the desktop sidebar, the phone tab bar and the phone "More" sheet. */
export const NAV_ITEMS: NavItem[] = [
  { view: 'today', icon: 'inbox', label: 'Today', group: 'work' },
  { view: 'visits', icon: 'pin', label: 'Visits', group: 'work', requires: 'handleVisits' },
  { view: 'pipeline', icon: 'pipeline', label: 'Pipeline', group: 'work' },
  { view: 'properties', icon: 'home', label: 'Properties', group: 'work' },
  { view: 'tasks', icon: 'calendar', label: 'Follow-ups', group: 'work' },
  { view: 'calls', icon: 'phone', label: 'Calls', group: 'work' },
  { view: 'attendance', icon: 'clock', label: 'Attendance', group: 'work' },
  { view: 'reports', icon: 'chart', label: 'Performance', group: 'work' },
  { view: 'escalations', icon: 'alert', label: 'Escalations', group: 'manage', requires: 'reassignLeads' },
  { view: 'sources', icon: 'plug', label: 'Lead sources', group: 'manage', requires: 'viewReports' },
  { view: 'team', icon: 'users', label: 'Team', group: 'manage', requires: 'manageTeam' },
  { view: 'settings', icon: 'settings', label: 'Settings', group: 'manage', requires: 'manageSettings' },
  { view: 'audit', icon: 'shield', label: 'Audit log', group: 'manage', requires: 'viewAuditLog' },
]

/**
 * Phone tab bar: the first four of these the viewer may use (what they do all day), then "More" for the rest.
 * Field agents get Today, Visits, Pipeline, Follow-ups; Pre-sales (no visits) get Calls instead of Visits.
 */
const PHONE_TAB_PREFERENCE: View[] = ['today', 'visits', 'pipeline', 'tasks', 'calls']
export function phoneTabViews(items: NavItem[]): View[] {
  return PHONE_TAB_PREFERENCE.filter((view) => items.some((item) => item.view === view)).slice(0, 4)
}

export function navItemsFor(canDo: (permission: Permission) => boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.requires || canDo(item.requires))
}
