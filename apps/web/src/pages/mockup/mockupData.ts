
import type { TemplateRegistryItem } from '../../templateEngine'

export const mockupCategoryOptions = [
  {
    description: 'Template wedding premium, adat, editorial, dan klasik.',
    id: 'wedding',
    label: 'Pernikahan Umum',
    typeId: '1',
  },
  {
    description: 'Alur wedding dengan bahasa dan komponen lebih religius.',
    id: 'syari',
    label: "Pernikahan Syar'i",
    typeId: '2',
  },
  {
    description: 'Template acara khitan dengan susunan keluarga.',
    id: 'khitan',
    label: 'Khitanan',
    typeId: '31',
  },
  {
    description: 'Template tasyakuran aqiqah dan kelahiran.',
    id: 'aqiqah',
    label: 'Aqiqah',
    typeId: '37',
  },
  {
    description: 'Template fleksibel untuk ulang tahun, tunangan, dan acara lain.',
    id: 'general',
    label: 'Umum',
    typeId: '40',
  },
] as const

export type MockupCategoryId = (typeof mockupCategoryOptions)[number]['id']

export type MockupTemplateFilter = 'all' | 'premium' | 'free'

export type MockupWizardStep = 'intro' | 'template' | 'details'

export type MockupCreateInvitationInput = {
  eventDate: string
  isAnnouncement: boolean
  slug: string
  template: TemplateRegistryItem
  title: string
}

export const initialMockupInvitationCards: MockupInvitationCard[] = [
  {
    code: 'UDG202605250046',
    date: '31/05/2026 08:00 s/d 31/05/2026 23:59',
    image: '/template-assets/wedding-premium042-wayang-batik/assets/images/background-cover-couple.jpg',
    slug: 'alika-herman',
    status: 'Versi Premium',
    template: 'WEDDING-PREMIUM042',
    templateId: 'template-042',
    title: 'Alika & Herman',
  },
  {
    code: 'UDG202605250066',
    date: '12/08/2026 09:00 s/d 12/08/2026 23:59',
    image: '/template-assets/wedding-premium074-indonesia-editorial/assets/images/footages/indonesia-wedding-03.png',
    slug: 'rama-shinta',
    status: 'Versi Gratis',
    template: 'WEDDING-PREMIUM074',
    templateId: 'template-074',
    title: 'Rama & Shinta',
  },
]

export type MockupMenuIconName =
  | 'calendar'
  | 'chart'
  | 'help'
  | 'image'
  | 'inbox'
  | 'layout'
  | 'lock'
  | 'logout'
  | 'pulse'
  | 'receipt'
  | 'settings'
  | 'sparkle'
  | 'ticket'
  | 'user'
  | 'users'
  | 'video'

export type MockupInvitationCard = {
  code: string
  date: string
  image: string
  slug: string
  status: string
  template: string
  templateId: string
  title: string
}

export function createMockupInvitationCode() {
  return `UDG${Date.now().toString().slice(-10)}`
}

export function formatMockupDateRange(eventDate: string) {
  if (!eventDate) {
    return 'Tanggal belum diisi'
  }

  const [year, month, day] = eventDate.split('-')
  return `${day}/${month}/${year} 08:00 s/d ${day}/${month}/${year} 23:59`
}

export function slugifyInvitation(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
