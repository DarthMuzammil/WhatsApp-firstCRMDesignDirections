import { BROKERAGE } from './brand'

// WhatsApp templates and the auto-qualification script (spec §8.4). Approved templates are the only
// way to message a buyer outside WhatsApp's 24-hour service window.

export type TemplateField = 'name' | 'property' | 'when' | 'broker'
export type Template = { id: string; label: string; category: 'Utility' | 'Marketing'; body: string; fields: TemplateField[] }

export const TEMPLATES: Template[] = [
  { id: 'welcome', label: 'Welcome', category: 'Utility', fields: ['name', 'broker'], body: `Hi {name}, thanks for your enquiry! I’m {broker} from ${BROKERAGE.name}. Could you share your budget and preferred area so I can send the best matches?` },
  { id: 'shortlist', label: 'Share shortlist', category: 'Utility', fields: ['name', 'property'], body: 'Hi {name}, here are homes that match your brief, starting with {property}. Tell me which ones you’d like to visit.' },
  { id: 'visit-reminder', label: 'Visit reminder', category: 'Utility', fields: ['name', 'property', 'when'], body: 'Hi {name}, a reminder of your visit to {property} on {when}. Reply 1 to confirm or 2 to reschedule.' },
  { id: 'follow-up', label: 'Follow-up', category: 'Utility', fields: ['name'], body: 'Hi {name}, just checking in. Are you still looking? I have a couple of new options I think you’ll like.' },
  // M14: the marketing template launch broadcasts use (spec §8.17.3).
  { id: 'new-launch', label: 'New launch', category: 'Marketing', fields: ['name', 'property'], body: 'Hi {name}, {property} launches soon with early-access EOI. Want floor plans and a site visit?' },
]

export const FIELD_LABEL: Record<TemplateField, string> = { name: 'Buyer name', property: 'Property', when: 'Day and time', broker: 'Your name' }

export function fillTemplate(template: Template, values: Partial<Record<TemplateField, string>>): string {
  return template.body.replace(/\{(\w+)\}/g, (_, key: TemplateField) => values[key] || `{${key}}`)
}

/** WhatsApp only allows free-text replies within 24 hours of the buyer's last message. */
export const SERVICE_WINDOW_MINUTES = 24 * 60

export const DEFAULT_AUTO_REPLY = `Hi {name}, thanks for reaching out to ${BROKERAGE.name}! A property expert will reply in a few minutes. Meanwhile, a few quick questions so we send the right homes.`

/** The three questions the auto-qualification asks, in order (spec §8.4). */
export const QUALIFICATION_QUESTIONS = [
  { key: 'budget', ask: 'What’s your budget range?' },
  { key: 'need', ask: 'Which area, and how many bedrooms?' },
  { key: 'moveIn', ask: 'When are you planning to move in?' },
] as const
