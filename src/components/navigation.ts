import type { Permission } from '../lib/permissions'
import type { IconName } from './Icon'

/** Every screen in the app. `chat` is reached from a lead, not from the nav; while it is open the nav highlights the screen it was opened from. */
export type View = 'today' | 'chat' | 'pipeline' | 'properties' | 'tasks' | 'calls' | 'escalations' | 'sources' | 'team' | 'settings'

export type NavItem = {
  view: Exclude<View, 'chat'>
  icon: IconName
  label: string
  shortLabel: string
  group: 'work' | 'manage'
  /** Only shown to people with this permission. */
  requires?: Permission
}

/** Nav items shared by the desktop sidebar, the phone tab bar and the phone "More" sheet. */
export const NAV_ITEMS: NavItem[] = [
  { view: 'today', icon: 'inbox', label: 'Today', shortLabel: 'Inbox', group: 'work' },
  { view: 'pipeline', icon: 'pipeline', label: 'Pipeline', shortLabel: 'Pipeline', group: 'work' },
  { view: 'properties', icon: 'home', label: 'Properties', shortLabel: 'Homes', group: 'work' },
  { view: 'tasks', icon: 'calendar', label: 'Follow-ups', shortLabel: 'Tasks', group: 'work' },
  { view: 'calls', icon: 'phone', label: 'Calls', shortLabel: 'Calls', group: 'work' },
  { view: 'escalations', icon: 'alert', label: 'Escalations', shortLabel: 'Escalations', group: 'manage', requires: 'reassignLeads' },
  { view: 'sources', icon: 'plug', label: 'Lead sources', shortLabel: 'Lead sources', group: 'manage', requires: 'viewReports' },
  { view: 'team', icon: 'users', label: 'Team', shortLabel: 'Team', group: 'manage', requires: 'manageTeam' },
  { view: 'settings', icon: 'settings', label: 'Settings', shortLabel: 'Settings', group: 'manage', requires: 'manageSettings' },
]

/** Phone tab bar: these four, then "More" for everything else the person can open. */
export const PHONE_TAB_VIEWS: View[] = ['today', 'pipeline', 'properties', 'tasks']

export function navItemsFor(canDo: (permission: Permission) => boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.requires || canDo(item.requires))
}
