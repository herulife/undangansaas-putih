export type Template = {
  id: string
  name: string
  slug: string
  category: string
  assetsUrl?: string
  configSchema?: Record<string, unknown>
  createdAt?: string
  isActive?: boolean
  previewUrl?: string
  tierAccess?: string[]
  updatedAt?: string
}

export type EventType = 'wedding' | 'aqiqah' | 'khitanan' | 'syukuran' | 'birthday' | 'lembaga' | 'other'

export type Invitation = {
  id?: string
  slug: string
  title?: string
  couple: string
  template: string
  templateSlug?: string
  eventType?: EventType
  childName?: string
  parentsName?: string
  hostName?: string
  organizationName?: string
  eventName?: string
  eventDate: string
  status: string
  config?: InvitationConfig
  rsvpCount: number
  watermark?: boolean
  createdAt?: string
}

export type CreateInvitationInput = {
  slug: string
  couple: string
  templateSlug: string
  eventDate: string
  eventType?: EventType
  childName?: string
  parentsName?: string
  hostName?: string
  organizationName?: string
  eventName?: string
  title?: string
  config?: InvitationConfig
}

export type UpdateInvitationInput = {
  couple: string
  eventDate: string
  status: string
  eventType?: EventType
  childName?: string
  parentsName?: string
  hostName?: string
  organizationName?: string
  eventName?: string
  title?: string
  config?: InvitationConfig
}

export type PublishInvitationInput = {
  customDomain: string
  dynamicOg: boolean
  galleryCount: number
  removeWatermark: boolean
}

export type InvitationEvent = {
  name: string
  date: string
  time: string
  venue: string
  address: string
  mapsUrl: string
}

export type InvitationStoryItem = {
  title: string
  text: string
}

export type InvitationConfig = {
  akadTime?: string
  audioUrl?: string
  bride?: string
  brideParents?: string
  coverImage?: string
  closingText?: string
  dresscode?: string
  dresscodeNote?: string
  events?: InvitationEvent[]
  gallery?: string[]
  giftAccount?: string
  giftBank?: string
  giftQrImage?: string
  greeting?: string
  groom?: string
  groomParents?: string
  hashtag?: string
  liveStreamUrl?: string
  mapsUrl?: string
  openingText?: string
  quotes?: string
  receptionTime?: string
  story?: InvitationStoryItem[]
  venue?: string
  venueAddress?: string
  videoUrl?: string
}

export type RSVP = {
  id: string
  name: string
  message: string
  status: string
  guests: number
  createdAt?: string
}

export type RSVPInput = {
  name: string
  message: string
  status: string
  guests: number
  guestId?: string
  website?: string
}

export type PaymentRecord = {
  id: string
  provider: string
  orderId: string
  tier: string
  amountIdr: number
  currency: string
  status: string
  checkoutUrl: string
  paidAt?: string
  createdAt: string
}

export type AIImageInput = {
  prompt: string
  style: string
  size: string
}

export type AIImageResult = {
  fileName: string
  provider: string
  url: string
  prompt: string
}

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: string
  tier: string
  emailVerified?: boolean
}

export type AuthState = {
  token: string
  user: AuthUser | null
}

export type AuthRequestInput = {
  displayName?: string
  email: string
  password: string
}

export type ManualPaymentInput = {
  amountIdr: number
  providerOrderId: string
  tier: string
  userId: string
}

export type MidtransPaymentInput = {
  invitationSlug: string
  tier: string
  amountIdr: number
  email: string
  name: string
  phone: string
  voucherCode?: string
}

export type MidtransPaymentResult = {
  paymentUrl: string
  orderId: string
  token: string
}

export type VoucherValidateResult = {
  code: string
  discountType: string
  discountValue: number
  discountAmount: number
  finalAmount: number
}

export type ManualProofInput = {
  tier: string
  amountIdr: number
  proofUrl: string
  note: string
}

export type AnalyticsDayPoint = {
  day: string
  pageViews: number
  uniqueVisitors: number
  rsvpSubmits: number
  shareClicks: number
  publishes: number
  upgradeClicks: number
}

export type AnalyticsOverview = {
  days: AnalyticsDayPoint[]
  totals: {
    pageViews: number
    uniqueVisitors: number
    rsvpTotal: number
    shareClicks: number
  }
  topInvitations: {
    slug: string
    couple: string
    pageViews: number
    rsvpCount: number
  }[]
}

export type RealtimeEvent = {
  eventName: string
  slug: string
  guestName: string
  createdAt: string
}

export type TemplateAdminInput = {
  assetsUrl: string
  category: string
  configSchema: Record<string, unknown>
  isActive: boolean
  name: string
  previewUrl: string
  slug: string
  tierAccess: string[]
}

export type GuestData = {
  id: string
  name: string
  phone: string
  status: 'draft' | 'sent' | 'opened' | 'failed'
  personalUrl: string
  sentAt: string | null
  openedAt: string | null
  createdAt: string
}

export type DomainData = {
  id: string
  domain: string
  invitationId?: string
  invitationSlug?: string
  status: 'pending' | 'verified' | 'active' | 'failed'
  verifiedAt?: string
  createdAt: string
}

export type MediaAsset = {
  id: string
  fileName: string
  url: string
  mediaType: 'images' | 'audio'
  provider: string
  sizeBytes: number
  createdAt: string
}

export type AdminPayment = {
  id: string
  userId: string
  userEmail: string
  userName: string
  provider: string
  orderId: string
  tier: string
  amountIdr: number
  currency: string
  status: string
  proofUrl: string
  manualNote: string
  verifiedAt?: string
  paidAt?: string
  createdAt: string
}

export type AdminVoucher = {
  id: string
  code: string
  discountType: string
  discountValue: number
  quota: number
  usedCount: number
  expiresAt?: string
  status: string
  createdAt: string
}

export type AuditLogEntry = {
  id: string
  actorEmail: string
  action: string
  targetType: string
  targetId: string
  metadata: Record<string, unknown> | null
  ip: string
  createdAt: string
}

export type AdminOverview = {
  totalUsers: number
  totalInvitations: number
  paidTransactions: number
  grossRevenueIdr: number
  pendingManual: number
  activeVouchers: number
  totalMediaAssets: number
  storageUsedBytes: number
  usersByTier: { tier: string; count: number }[]
}

export type AdminMediaItem = {
  id: string
  fileName: string
  url: string
  mediaType: string
  provider: string
  sizeBytes: number
  owner: string
  createdAt: string
}

export type CheckinGuest = {
  id: string
  name: string
  phone: string
  status: string
  token: string
  personalUrl: string
  checkedInAt: string | null
  checkinCount: number
}

export type CheckinSummary = {
  total: number
  checkedIn: number
  pending: number
}

export type CheckinListResponse = {
  slug: string
  screenKey: string
  summary: CheckinSummary
  guests: CheckinGuest[]
}

export type CheckinResult = {
  guest: { id: string; name: string; checkedInAt: string | null; checkinCount: number }
  alreadyCheckedIn: boolean
  slug: string
}

export type CheckinFeedItem = {
  guestName: string
  createdAt: string
}
