import type { IconName } from './Icon'

/** Every screen in the app. `chat` is reached from a lead, not from the nav; while it is open the nav highlights the screen it was opened from. */
export type View = 'today' | 'chat' | 'pipeline' | 'properties' | 'tasks' | 'calls'

/** Nav items shared by the desktop sidebar and the phone tab bar. */
export const NAV_ITEMS: { view: View; icon: IconName; label: string; shortLabel: string }[] = [
  { view: 'today', icon: 'inbox', label: 'Today', shortLabel: 'Inbox' },
  { view: 'pipeline', icon: 'pipeline', label: 'Pipeline', shortLabel: 'Pipeline' },
  { view: 'properties', icon: 'home', label: 'Properties', shortLabel: 'Homes' },
  { view: 'tasks', icon: 'calendar', label: 'Follow-ups', shortLabel: 'Tasks' },
  { view: 'calls', icon: 'phone', label: 'Calls', shortLabel: 'Calls' },
]
