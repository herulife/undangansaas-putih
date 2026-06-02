/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

const cacheKey = 'cintabuku:tier-gate:v1'
const cacheTtlMs = 5 * 60 * 1000
const apiBase = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8088' : '')

export const featureFlagSchema = z.enum([
  'analytics:basic',
  'analytics:full',
  'api_access',
  'bulk_create',
  'client_dashboard',
  'custom_domain',
  'dynamic_og',
  'export_csv',
  'priority_support',
  'unlimited_gallery',
  'watermark_remove',
  'white_label',
])

export const tierNameSchema = z.enum(['free', 'creator', 'pro', 'business'])

const tierFeaturesSchema = z.object({
  analytics: z.enum(['basic', 'full']),
  apiAccess: z.boolean(),
  activeMonths: z.number().optional(),
  bulkCreate: z.boolean(),
  clientDashboard: z.boolean(),
  customDomain: z.boolean(),
  dynamicOg: z.boolean(),
  exportCsv: z.boolean(),
  flags: z.array(featureFlagSchema),
  maxGallery: z.number().nullable(),
  prioritySupport: z.boolean(),
  revenueShare: z.number(),
  rsvpLimit: z.number(),
  unlimitedGallery: z.boolean(),
  watermark: z.boolean(),
  whiteLabel: z.boolean(),
})

const tierGateResponseSchema = z.object({
  clientLimit: z.number(),
  effectiveTier: tierNameSchema,
  email: z.string(),
  features: tierFeaturesSchema,
  isB2b: z.boolean(),
  isExpired: z.boolean(),
  isInGracePeriod: z.boolean(),
  role: z.string(),
  tier: tierNameSchema,
  tierExpiresAt: z.string().nullable(),
  userId: z.string(),
})

const cachedGateSchema = z.object({
  expiresAt: z.number(),
  value: tierGateResponseSchema,
})

export type FeatureFlag = z.infer<typeof featureFlagSchema>
export type TierGateResponse = z.infer<typeof tierGateResponseSchema>

type TierGateStatus = 'anonymous' | 'error' | 'loading' | 'ready'

type TierGateContextValue = {
  can: (flag: FeatureFlag) => boolean
  features: TierGateResponse['features']
  refresh: () => Promise<void>
  shouldShowWatermark: boolean
  status: TierGateStatus
  tier: TierGateResponse['effectiveTier']
  tierData: TierGateResponse
}

const freeTierResponse: TierGateResponse = {
  clientLimit: 1,
  effectiveTier: 'free',
  email: '',
  features: {
    analytics: 'basic',
    apiAccess: false,
    bulkCreate: false,
    clientDashboard: false,
    customDomain: false,
    dynamicOg: false,
    exportCsv: false,
    flags: ['analytics:basic'],
    maxGallery: 3,
    prioritySupport: false,
    revenueShare: 0,
    rsvpLimit: 50,
    unlimitedGallery: false,
    watermark: true,
    whiteLabel: false,
  },
  isB2b: false,
  isExpired: false,
  isInGracePeriod: false,
  role: 'anonymous',
  tier: 'free',
  tierExpiresAt: null,
  userId: '',
}

const TierGateContext = createContext<TierGateContextValue | null>(null)

export function TierGateProvider({
  children,
  token,
}: {
  children: ReactNode
  token?: string
}) {
  const [status, setStatus] = useState<TierGateStatus>('loading')
  const [tierData, setTierData] = useState<TierGateResponse>(freeTierResponse)

  const resolveToken = useCallback(() => {
    if (token !== undefined) {
      return token
    }
    return window.localStorage.getItem('auth_token') ?? ''
  }, [token])

  const refresh = useCallback(async () => {
    const authToken = resolveToken()
    if (!authToken) {
      setTierData(freeTierResponse)
      setStatus('anonymous')
      return
    }

    const cached = readTierGateCache()
    if (cached) {
      setTierData(cached)
      setStatus('ready')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch(`${apiBase}/api/v1/me/features`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      if (!response.ok) {
        throw new Error(`Tier feature request failed: ${response.status}`)
      }
      const parsed = tierGateResponseSchema.parse(await response.json())
      writeTierGateCache(parsed)
      setTierData(parsed)
      setStatus('ready')
    } catch {
      setTierData(freeTierResponse)
      setStatus('error')
    }
  }, [resolveToken])

  useEffect(() => {
    // Fetching account state is the synchronization this provider owns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  useEffect(() => {
    function handleRefresh() {
      void refresh()
    }

    window.addEventListener('tier-gate:refresh', handleRefresh)
    return () => window.removeEventListener('tier-gate:refresh', handleRefresh)
  }, [refresh])

  const value = useMemo<TierGateContextValue>(() => {
    return {
      can: (flag) => tierData.features.flags.includes(flag),
      features: tierData.features,
      refresh,
      shouldShowWatermark: tierData.features.watermark,
      status,
      tier: tierData.effectiveTier,
      tierData,
    }
  }, [refresh, status, tierData])

  return (
    <TierGateContext.Provider value={value}>
      {children}
    </TierGateContext.Provider>
  )
}

export function useTierGate() {
  const context = useContext(TierGateContext)
  if (!context) {
    throw new Error('useTierGate must be used inside TierGateProvider')
  }
  return context
}

export function FeatureGate({
  children,
  fallback = null,
  flag,
}: {
  children: ReactNode
  fallback?: ReactNode
  flag: FeatureFlag
}) {
  const gate = useTierGate()
  return gate.can(flag) ? <>{children}</> : <>{fallback}</>
}

export function TierExpiryBanner() {
  const gate = useTierGate()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [dismissedKeys, setDismissedKeys] = useState(() => readDismissedTierBannerKeys())
  const storageKey = `cintabuku:tier-banner:${gate.tierData.tier}:${gate.tierData.tierExpiresAt ?? 'none'}`

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const daysLeft = useMemo(() => {
    if (!gate.tierData.tierExpiresAt) {
      return null
    }
    const expiresAt = new Date(gate.tierData.tierExpiresAt).getTime()
    if (Number.isNaN(expiresAt)) {
      return null
    }
    return Math.ceil((expiresAt - nowMs) / 86_400_000)
  }, [gate.tierData.tierExpiresAt, nowMs])

  const isPaidTier = gate.tierData.tier !== 'free'
  const shouldWarn = gate.status === 'ready'
    && isPaidTier
    && (gate.tierData.isExpired || (daysLeft !== null && daysLeft <= 7))
  const dismissed = dismissedKeys.includes(storageKey)

  if (!shouldWarn || dismissed) {
    return null
  }

  const message = gate.tierData.isInGracePeriod
    ? `Paket ${gate.tierData.tier.toUpperCase()} sudah lewat masa aktif dan masih dalam masa tenggang.`
    : gate.tierData.isExpired
      ? `Paket ${gate.tierData.tier.toUpperCase()} sudah berakhir, fitur premium akan kembali ke Free.`
      : `Paket ${gate.tierData.tier.toUpperCase()} berakhir dalam ${daysLeft} hari.`

  function dismiss() {
    setDismissedKeys((current) => {
      if (current.includes(storageKey)) {
        return current
      }
      const next = [...current, storageKey]
      writeDismissedTierBannerKeys(next)
      return next
    })
  }

  return (
    <aside className="tier-expiry-banner">
      <div>
        <strong>{message}</strong>
        <span>Perpanjang sekarang agar watermark, export, domain, dan analytics tetap sesuai paket.</span>
      </div>
      <a href="/dashboard/langganan">Lihat paket</a>
      <button onClick={dismiss} type="button">Tutup</button>
    </aside>
  )
}

function readDismissedTierBannerKeys() {
  try {
    const raw = window.sessionStorage.getItem('cintabuku:tier-banner-dismissed')
    const parsed = z.array(z.string()).safeParse(raw ? JSON.parse(raw) : [])
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function writeDismissedTierBannerKeys(keys: string[]) {
  try {
    window.sessionStorage.setItem('cintabuku:tier-banner-dismissed', JSON.stringify(keys.slice(-20)))
  } catch {
    // Session storage can be unavailable in private contexts.
  }
}

export function TierWatermark({
  className = 'tier-watermark',
  visible,
}: {
  className?: string
  visible?: boolean
}) {
  const gate = useTierGate()
  const shouldShow = visible ?? gate.shouldShowWatermark
  if (!shouldShow) {
    return null
  }

  return (
    <a className={className} href="/">
      Dibuat dengan CintaBuku
    </a>
  )
}

function readTierGateCache() {
  try {
    const raw = window.localStorage.getItem(cacheKey)
    if (!raw) {
      return null
    }
    const cached = cachedGateSchema.parse(JSON.parse(raw))
    if (cached.expiresAt <= Date.now()) {
      window.localStorage.removeItem(cacheKey)
      return null
    }
    return cached.value
  } catch {
    window.localStorage.removeItem(cacheKey)
    return null
  }
}

function writeTierGateCache(value: TierGateResponse) {
  window.localStorage.setItem(cacheKey, JSON.stringify({
    expiresAt: Date.now() + cacheTtlMs,
    value,
  }))
}
