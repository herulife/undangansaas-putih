import type { EventType } from './types'

export type EventFormField = 'couple' | 'childName' | 'parentsName' | 'hostName' | 'organizationName' | 'eventName'

export type EventTypeOption = {
  value: EventType
  label: string
  description: string
  guestLabel: string
  invitationNoun: string
  category: string
  fields: EventFormField[]
}

export const eventTypeOptions: EventTypeOption[] = [
  {
    value: 'wedding',
    label: 'Pernikahan',
    description: 'Undangan pernikahan / resepsi',
    guestLabel: 'Tamu',
    invitationNoun: 'Pernikahan',
    category: 'wedding',
    fields: ['couple'],
  },
  {
    value: 'aqiqah',
    label: 'Aqiqah',
    description: 'Tasyakuran kelahiran anak',
    guestLabel: 'Tamu',
    invitationNoun: 'Aqiqah',
    category: 'aqiqah',
    fields: ['childName', 'parentsName'],
  },
  {
    value: 'khitanan',
    label: 'Khitanan / Sunatan',
    description: 'Walimatul khitan',
    guestLabel: 'Tamu',
    invitationNoun: 'Khitanan',
    category: 'khitan',
    fields: ['childName', 'parentsName'],
  },
  {
    value: 'syukuran',
    label: 'Syukuran',
    description: 'Syukuran / tasyakuran umum',
    guestLabel: 'Tamu',
    invitationNoun: 'Syukuran',
    category: 'syukuran',
    fields: ['eventName', 'hostName'],
  },
  {
    value: 'birthday',
    label: 'Ulang Tahun',
    description: 'Pesta ulang tahun',
    guestLabel: 'Tamu',
    invitationNoun: 'Ulang Tahun',
    category: 'birthday',
    fields: ['childName', 'parentsName'],
  },
  {
    value: 'lembaga',
    label: 'Lembaga / Instansi',
    description: 'Acara resmi lembaga, sekolah, perusahaan',
    guestLabel: 'Peserta',
    invitationNoun: 'Acara',
    category: 'lembaga',
    fields: ['eventName', 'organizationName'],
  },
  {
    value: 'other',
    label: 'Lainnya',
    description: 'Jenis acara lain',
    guestLabel: 'Tamu',
    invitationNoun: 'Acara',
    category: 'general',
    fields: ['eventName', 'hostName'],
  },
]

export function eventTypeMeta(value?: string): EventTypeOption {
  return eventTypeOptions.find((option) => option.value === value) ?? eventTypeOptions[0]
}

export function eventTypeLabel(value?: string): string {
  return eventTypeMeta(value).label
}

export function filterTemplatesByCategory<T extends { category?: string }>(items: T[], eventType?: string): T[] {
  const meta = eventTypeMeta(eventType)
  const matched = items.filter((item) => {
    const category = (item.category ?? '').toLowerCase()
    return category.includes(meta.category)
  })
  return matched.length > 0 ? matched : items
}
