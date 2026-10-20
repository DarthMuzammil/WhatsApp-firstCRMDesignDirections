import type { ReactNode } from 'react'

const PATHS = {
  inbox: <><path d="M3 4.5h18v15H3z" /><path d="m3 14 5-5 4 4 3-3 6 6" /></>,
  pipeline: <><path d="M4 6h4v4H4zM10 14h4v4h-4zM16 4h4v4h-4z" /><path d="M8 8h3v8h-1M14 16h3V8" /></>,
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  calendar: <><path d="M4 5h16v15H4zM8 3v4M16 3v4M4 9h16" /><path d="M8 13h2M14 13h2M8 17h2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  phone: <path d="M7 3 4 5c0 8 7 15 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2z" />,
  send: <><path d="m3 4 18 8-18 8 3-8z" /><path d="M6 12h15" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5" />,
  back: <path d="m15 18-6-6 6-6" />,
  spark: <path d="m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4zM18 16l.7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8c.5 3 2 4.5 5 5l1-1" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  bed: <><path d="M3 18v-7h18v7M3 15h18M6 11V7h5v4" /></>,
  area: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
  pause: <path d="M9 6v12M15 6v12" />,
  play: <path d="m8 5 11 7-11 7z" />,
  volume: <><path d="M5 10v4h4l5 4V6L9 10zM18 9a4 4 0 0 1 0 6" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  alert: <><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17v.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .8 3.2 2.6 3.5 5.2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
  swap: <><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" /></>,
  plug: <><path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  )
}
