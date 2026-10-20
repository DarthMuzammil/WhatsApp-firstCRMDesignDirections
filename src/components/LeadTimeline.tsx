import { shortName, type Member } from '../data/team'
import { SYSTEM_ID, type ActivityKind, type TimelineEvent } from '../state/useDemoStore'
import { Icon, type IconName } from './Icon'
import './LeadTimeline.css'

const KIND_ICON: Record<ActivityKind, IconName> = {
  enquiry: 'inbox', message: 'whatsapp', assign: 'swap', stage: 'pipeline', visit: 'calendar',
  call: 'phone', note: 'info', profile: 'spark', tag: 'bookmark', merge: 'users',
}

/** " · Priya N.", " · Automatic" for the product itself, or nothing. */
function byLabel(byId: string | undefined, findMember: (id: string) => Member | undefined): string {
  if (!byId) return ''
  if (byId === SYSTEM_ID) return ' · Automatic'
  const person = findMember(byId)
  return person ? ` · ${shortName(person.name)}` : ''
}

/** Everything that happened on a lead, newest first (spec §8.5). */
export function LeadTimeline({ events, findMember }: { events: TimelineEvent[]; findMember: (id: string) => Member | undefined }) {
  return (
    <ol className="lead-timeline" aria-label="Lead timeline">
      {events.map((event) => (
        <li key={event.key} className={`timeline-${event.kind}`}>
          <span className="timeline-icon"><Icon name={KIND_ICON[event.kind]} size={14} /></span>
          <div>
            <p>{event.text}</p>
            <small>{event.at}{byLabel(event.byId, findMember)}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}
