const analyticsApiBase = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8088' : '')

export type AnalyticsEventName =
  | 'export_csv'
  | 'page_view'
  | 'publish'
  | 'rsvp_submit'
  | 'share_click'
  | 'upgrade_click'

export type TrackEventInput = {
  eventName: AnalyticsEventName
  invitationSlug?: string
  properties?: Record<string, string | number | boolean | null>
  visitorId?: string
}

export function trackEvent(input: TrackEventInput) {
  const payload = JSON.stringify({
    eventName: input.eventName,
    invitationSlug: input.invitationSlug ?? '',
    properties: input.properties ?? {},
    visitorId: input.visitorId ?? getVisitorId(),
  })
  const url = `${analyticsApiBase}/api/v1/events`

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' })
    if (navigator.sendBeacon(url, blob)) {
      return
    }
  }

  void fetch(url, {
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    method: 'POST',
  })
}

function getVisitorId() {
  const key = 'cintabuku:visitor-id'
  const current = window.localStorage.getItem(key)
  if (current) {
    return current
  }
  const next = crypto.randomUUID()
  window.localStorage.setItem(key, next)
  return next
}
