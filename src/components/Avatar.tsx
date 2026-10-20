import type { AvatarColor, Lead } from '../data/demo'
import './Avatar.css'

type AvatarSize = 'sm' | 'md' | 'lg'

export function Avatar({ initials, color, size = 'md' }: { initials: string; color: AvatarColor; size?: AvatarSize }) {
  return <span className={`avatar avatar-${size} avatar-${color}`}>{initials}</span>
}

/** Avatar for a lead. No presence dot: WhatsApp's Business API doesn't report whether a buyer is online. */
export function LeadAvatar({ lead, size }: { lead: Lead; size?: AvatarSize }) {
  return <Avatar initials={lead.initials} color={lead.color} size={size} />
}
