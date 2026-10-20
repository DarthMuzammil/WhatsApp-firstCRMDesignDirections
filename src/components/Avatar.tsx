import type { AvatarColor, Lead } from '../data/demo'
import './Avatar.css'

type AvatarSize = 'sm' | 'md' | 'lg'

export function Avatar({ initials, color, size = 'md', online = false }: { initials: string; color: AvatarColor; size?: AvatarSize; online?: boolean }) {
  return (
    <span className={`avatar avatar-${size} avatar-${color}`}>
      {initials}
      {online && <span className="avatar-online" aria-label="Online" />}
    </span>
  )
}

/** Avatar for a lead. The online dot appears only where `showStatus` is set (inbox rows, chat header). */
export function LeadAvatar({ lead, size, showStatus = false }: { lead: Lead; size?: AvatarSize; showStatus?: boolean }) {
  return <Avatar initials={lead.initials} color={lead.color} size={size} online={showStatus && lead.online} />
}
