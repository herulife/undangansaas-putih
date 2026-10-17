import type { ReactNode } from 'react'

export function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(1, max - min)
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * 112
      const y = 34 - ((point - min) / range) * 26
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      aria-hidden="true"
      className={`metric-sparkline ${tone}`}
      focusable="false"
      viewBox="0 0 112 40"
    >
      <path d={path} />
    </svg>
  )
}

export function DashboardIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    builder: (
      <>
        <path d="M5 5h14v4H5z" />
        <path d="M5 15h6v4H5z" />
        <path d="M15 13h4v6h-4z" />
      </>
    ),
    calendar: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="5" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
      </>
    ),
    chevron: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="m20 18-6-6 6-6" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 20h14" />
      </>
    ),
    feedback: (
      <>
        <path d="M4 5h16v11H8l-4 4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.5 1.1-1.5 2.2" />
        <path d="M12 17h.1" />
      </>
    ),
    invoice: (
      <>
        <path d="M7 3h10l2 2v16l-3-1.5-2 1-2-1-2 1-2-1-3 1.5V5a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 16l4-4-4-4" />
        <path d="M18 12H9" />
      </>
    ),
    mail: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    media: (
      <>
        <rect height="14" rx="2" width="16" x="4" y="5" />
        <path d="m7 16 3.5-4 2.5 3 2-2.2 2 3.2" />
        <circle cx="9" cy="9" r="1.2" />
      </>
    ),
    menu: (
      <>
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
      </>
    ),
    notification: (
      <>
        <path d="M7 10a5 5 0 0 1 10 0c0 4 1.5 5 2 6H5c.5-1 2-2 2-6Z" />
        <path d="M10 19a2.4 2.4 0 0 0 4 0" />
      </>
    ),
    overview: (
      <>
        <rect height="7" rx="1.5" width="7" x="4" y="4" />
        <rect height="7" rx="1.5" width="7" x="13" y="4" />
        <rect height="7" rx="1.5" width="7" x="4" y="13" />
        <rect height="7" rx="1.5" width="7" x="13" y="13" />
      </>
    ),
    payment: (
      <>
        <rect height="13" rx="2" width="18" x="3" y="6" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </>
    ),
    report: (
      <>
        <path d="M5 19V5" />
        <path d="M5 19h15" />
        <path d="M9 16v-5" />
        <path d="M13 16V8" />
        <path d="M17 16v-3" />
      </>
    ),
    reseller: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 19c.8-3 2.5-5 4.5-5s3.7 2 4.5 5" />
        <path d="M13 18c.6-2 1.7-3.4 3.2-3.4 1.7 0 3 1.6 3.7 3.4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7.3 7.3 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7.3 7.3 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5a7.3 7.3 0 0 0 .1-1Z" />
      </>
    ),
    subscription: (
      <>
        <path d="M5 6h14v12H5z" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
        <path d="M17 15.5h2.5" />
      </>
    ),
    template: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    visitor: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    voucher: (
      <>
        <path d="M4 8a2 2 0 0 1 2-2h12v4a2 2 0 0 0 0 4v4H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
        <path d="M9 9h.1" />
        <path d="M14.5 9.5 9.5 15" />
        <path d="M15 15h.1" />
      </>
    ),
    wallet: (
      <>
        <path d="M5 7h13a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" />
        <path d="M16 12h4" />
        <path d="M16 12a1.5 1.5 0 1 0 0 3h4" />
      </>
    ),
    group: (
      <>
        <path d="M17 20v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1" />
        <circle cx="10.5" cy="6.5" r="3" />
        <path d="M20 14.5V8" />
        <path d="M16 11h8" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    checkin: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <path d="M14 14h3v3" />
        <path d="M20 20h-3v-3" />
        <path d="M14 20h.01M20 14h.01" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icons[name] ?? icons.overview}
    </svg>
  )
}
