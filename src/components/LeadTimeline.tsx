import { shortName, type Member } from '../data/team'
import type { ActivityKind, TimelineEvent } from '../state/useDemoStore'
import { Icon, type IconName } from './Icon'
import './LeadTimeline.css'

const KIND_ICON: Record<ActivityKind, IconName> = {
  enquiry: 'inbox', message: 'whatsapp', assign: 'swap', stage: 'pipeline', visit: 'calendar',
  call: 'phone', note: 'info', profile: 'spark', tag: 'bookmark', merge: 'users',
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
            <small>{event.at}{event.byId ? ` · ${shortName(findMember(event.byId)?.name ?? '')}` : ''}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}
