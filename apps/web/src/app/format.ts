import type { Invitation, InvitationEvent } from './types'
import type { InvitationRenderData } from '../templateEngine'

export function findInvitation(slug: string, invitations: Invitation[]) {
  return invitations.find((item) => item.slug === slug)
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function readableStatus(status: string) {
  return titleCase(status.toLowerCase())
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.querySelector(selector) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export function parseHourMinute(time: string) {
  const match = time.match(/(\d{1,2})[.:](\d{2})/)
  if (!match) {
    return { hour: 8, minute: 0 }
  }
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

export function combineEventDate(dateISO: string, time: string, addHours = 0) {
  const parts = dateISO.split('-').map(Number)
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return new Date(Number.NaN)
  }
  const { hour, minute } = parseHourMinute(time)
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], hour + addHours, minute))
}

export function calendarStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`
}

export function buildGoogleCalendarUrl(input: {
  address: string
  date: string
  time: string
  title: string
  venue: string
}) {
  const start = combineEventDate(input.date, input.time, 0)
  const end = combineEventDate(input.date, input.time, 2)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return ''
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    ctz: 'Asia/Jakarta',
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    details: `Undangan digital ${input.title}`,
    location: [input.venue, input.address].filter(Boolean).join(', '),
    text: input.title,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildMapsEmbed(mapsUrl: string, address: string) {
  if (mapsUrl.includes('output=embed') || mapsUrl.includes('/maps/embed')) {
    return mapsUrl
  }
  const query = address.trim() || mapsUrl.trim()
  if (!query) {
    return ''
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

export function formatEventDate(dateISO: string) {
  const date = new Date(dateISO)
  if (Number.isNaN(date.getTime())) {
    return dateISO
  }
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)
}

export function resolveInvitationEvents(invitation: Invitation): InvitationEvent[] {
  const config = invitation.config ?? {}
  if (config.events && config.events.length > 0) {
    const events = config.events.filter((event) => event && (event.name || event.date || event.venue))
    if (events.length > 0) {
      return events
    }
  }
  return [{
    address: config.venueAddress ?? '',
    date: invitation.eventDate,
    mapsUrl: config.mapsUrl ?? '',
    name: 'Akad & Resepsi',
    time: config.receptionTime || config.akadTime || '',
    venue: config.venue ?? '',
  }]
}

export function toInvitationRenderData(invitation: Invitation, guestName: string): InvitationRenderData {
  const config = invitation.config ?? {}
  const date = new Date(invitation.eventDate)
  const validDate = !Number.isNaN(date.getTime())
  const coupleParts = invitation.couple.split(/\s+&\s+/)
  const groomName = config.groom?.trim() || coupleParts[0] || ''
  const brideName = config.bride?.trim() || coupleParts[1] || coupleParts[0] || ''
  return {
    slug: invitation.slug,
    title: invitation.title || invitation.couple,
    groomName,
    brideName,
    coupleDisplayName: invitation.couple,
    eventDay: validDate ? new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date) : '',
    eventDateText: validDate ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date) : invitation.eventDate,
    eventDateISO: invitation.eventDate,
    akadTime: config.akadTime || '',
    receptionTime: config.receptionTime || '',
    venueName: config.venue || '',
    venueAddress: config.venueAddress || '',
    openingGreeting: '',
    openingText: config.openingText || '',
    closingText: '',
    backsoundUrl: config.audioUrl || '',
    guestName,
    countdownTarget: countdownTargetISO(invitation),
  }
}

export function countdownTargetISO(invitation: Invitation): string {
  const events = resolveInvitationEvents(invitation)
  const sorted = [...events].sort((a, b) => {
    return combineEventDate(a.date, a.time, 0).getTime() - combineEventDate(b.date, b.time, 0).getTime()
  })
  const next = sorted[0]
  const date = next?.date && /^\d{4}-\d{2}-\d{2}$/.test(next.date) ? next.date : invitation.eventDate
  const time = next?.time || invitation.config?.receptionTime || invitation.config?.akadTime || ''
  const { hour, minute } = parseHourMinute(time)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date}T${pad(hour)}:${pad(minute)}:00+07:00`
}

export function invitationURL(slug: string) {
  return `${window.location.origin}/u/${slug}`
}
