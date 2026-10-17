import type { MockupMenuIconName } from './mockupData'
import type { ReactNode } from 'react'

export function MockupMenuIcon({ name }: { name: MockupMenuIconName }) {
  const iconPaths: Record<MockupMenuIconName, ReactNode> = {
    calendar: <><path d="M7 3v3" /><path d="M17 3v3" /><path d="M4 9h16" /><rect height="16" rx="2" width="16" x="4" y="5" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-8" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.2c0 2-2.6 2.2-2.6 4" /><path d="M12 17h.01" /></>,
    image: <><rect height="16" rx="2" width="18" x="3" y="4" /><circle cx="8" cy="9" r="2" /><path d="m21 16-5-5L5 20" /></>,
    inbox: <><path d="M4 14h4l2 3h4l2-3h4" /><path d="M5 14 7 5h10l2 9" /><path d="M7 5h10" /></>,
    layout: <><rect height="16" rx="2" width="18" x="3" y="4" /><path d="M3 10h18" /><path d="M9 20V10" /></>,
    lock: <><rect height="10" rx="2" width="16" x="4" y="10" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    logout: <><path d="M10 17 15 12 10 7" /><path d="M15 12H3" /><path d="M21 3v18h-7" /></>,
    pulse: <><path d="M3 12h4l2-6 4 12 2-6h6" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05-2.12 2.12-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V20.5h-3v-.1a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.05.05-2.12-2.12.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.8v-3h.14A1.8 1.8 0 0 0 4.6 9a1.8 1.8 0 0 0-.36-1.98l-.05-.05 2.12-2.12.05.05A1.8 1.8 0 0 0 8.34 5.3a1.8 1.8 0 0 0 1.1-1.66V3.5h3v.14a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.05-.05 2.12 2.12-.05.05A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.66 1.1h.14v3h-.14A1.8 1.8 0 0 0 19.4 15Z" /></>,
    sparkle: <><path d="M12 3 14 9l6 2-6 2-2 6-2-6-6-2 6-2Z" /><path d="M19 3v4" /><path d="M21 5h-4" /></>,
    ticket: <><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 0 0-4V4H4Z" /><path d="M9 4v16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M14 18a5 5 0 0 1 7 2" /></>,
    video: <><rect height="12" rx="2" width="14" x="3" y="6" /><path d="m17 10 4-3v10l-4-3" /></>,
  }

  return (
    <svg fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  )
}
