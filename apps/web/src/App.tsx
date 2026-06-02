import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react'
import {
  getTemplateById,
  loadTemplateHtml,
  renderTemplateHtml,
  sampleInvitationData,
  templateRegistry,
  type TemplateRegistryItem,
} from './templateEngine'
import { trackEvent } from './analytics'
import { TierExpiryBanner, TierWatermark, useTierGate, type FeatureFlag } from './tierGate'

type Template = {
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

type Invitation = {
  id?: string
  slug: string
  title?: string
  couple: string
  template: string
  templateSlug?: string
  eventDate: string
  status: string
  config?: InvitationConfig
  rsvpCount: number
  watermark?: boolean
  createdAt?: string
}

type CreateInvitationInput = {
  slug: string
  couple: string
  templateSlug: string
  eventDate: string
  title?: string
  config?: InvitationConfig
}

type UpdateInvitationInput = {
  couple: string
  eventDate: string
  status: string
  title?: string
  config?: InvitationConfig
}

type PublishInvitationInput = {
  customDomain: string
  dynamicOg: boolean
  galleryCount: number
  removeWatermark: boolean
}

type InvitationConfig = {
  akadTime?: string
  audioUrl?: string
  bride?: string
  coverImage?: string
  gallery?: string[]
  giftAccount?: string
  giftBank?: string
  groom?: string
  mapsUrl?: string
  openingText?: string
  receptionTime?: string
  venue?: string
  venueAddress?: string
}

type RSVP = {
  id: string
  name: string
  message: string
  status: string
  guests: number
  createdAt?: string
}

type RSVPInput = {
  name: string
  message: string
  status: string
  guests: number
}

type AIImageInput = {
  prompt: string
  style: string
  size: string
}

type AIImageResult = {
  fileName: string
  provider: string
  url: string
  prompt: string
}

type AuthUser = {
  id: string
  email: string
  displayName: string
  role: string
  tier: string
}

type AuthState = {
  token: string
  user: AuthUser | null
}

type AuthRequestInput = {
  displayName?: string
  email: string
  password: string
}

type ManualPaymentInput = {
  amountIdr: number
  providerOrderId: string
  tier: string
  userId: string
}

type TemplateAdminInput = {
  assetsUrl: string
  category: string
  configSchema: Record<string, unknown>
  isActive: boolean
  name: string
  previewUrl: string
  slug: string
  tierAccess: string[]
}

const fallbackTemplates: Template[] = [
  {
    id: 'tmp-jawa-001',
    name: 'Adat Jawa Klasik',
    slug: 'adat-jawa',
    category: 'premium',
  },
  {
    id: 'tmp-classic-001',
    name: 'Klasik Hijau Emas',
    slug: 'klasik-hijau-emas',
    category: 'premium',
  },
  {
    id: 'tmp-floral-001',
    name: 'Floral Soft Garden',
    slug: 'floral-garden',
    category: 'premium',
  },
]

const apiBase = import.meta.env.VITE_API_URL ?? (
  import.meta.env.DEV ? 'http://localhost:8088' : ''
)

function apiURL(path: string) {
  return `${apiBase}${path}`
}

function readStoredAuth(): AuthState {
  try {
    const token = window.localStorage.getItem('auth_token') ?? ''
    const user = window.localStorage.getItem('auth_user')
    return {
      token,
      user: user ? JSON.parse(user) as AuthUser : null,
    }
  } catch {
    return { token: '', user: null }
  }
}

function storeAuth(next: AuthState) {
  if (next.token) {
    window.localStorage.setItem('auth_token', next.token)
  } else {
    window.localStorage.removeItem('auth_token')
  }
  if (next.user) {
    window.localStorage.setItem('auth_user', JSON.stringify(next.user))
  } else {
    window.localStorage.removeItem('auth_user')
  }
}

function authHeaders(token: string, json = false) {
  const headers: Record<string, string> = {}
  if (json) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function useAuthSession() {
  const [auth, setAuthState] = useState<AuthState>(() => readStoredAuth())
  const [authMessage, setAuthMessage] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  function setAuth(next: AuthState) {
    storeAuth(next)
    setAuthState(next)
    window.dispatchEvent(new Event('tier-gate:refresh'))
  }

  async function authenticate(mode: 'login' | 'register', input: AuthRequestInput) {
    setIsAuthenticating(true)
    setAuthMessage('')
    try {
      const response = await fetch(apiURL(`/api/auth/${mode}`), {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Autentikasi gagal')
      }
      const payload = await response.json() as { token: string; user: AuthUser }
      setAuth({ token: payload.token, user: payload.user })
      setAuthMessage(mode === 'login' ? 'Login berhasil.' : 'Akun berhasil dibuat.')
      return true
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Autentikasi gagal')
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  function logout() {
    setAuth({ token: '', user: null })
    window.location.href = '/'
  }

  return {
    auth,
    authMessage,
    authenticate,
    isAuthenticating,
    logout,
  }
}



function useAPIData(token: string) {
  const [templates, setTemplates] = useState<Template[]>(fallbackTemplates)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageMessage, setImageMessage] = useState('')
  const [generatedImages, setGeneratedImages] = useState<AIImageResult[]>([])
  const [formMessage, setFormMessage] = useState('')
  const [editorMessage, setEditorMessage] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [templateMessage, setTemplateMessage] = useState('')
  const [rsvpsBySlug, setRSVPsBySlug] = useState<Record<string, RSVP[]>>({})
  const [rsvpMessage, setRSVPMessage] = useState('')
  const [publicInvitations, setPublicInvitations] = useState<Record<string, Invitation>>({})
  const [publicInvitationStatus, setPublicInvitationStatus] = useState<Record<string, 'error' | 'loading' | 'not-found' | 'ready'>>({})

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsDataLoading(true)
    try {
      const templateRequest = fetch(apiURL('/api/templates'), { signal })
      const invitationRequest = token
        ? fetch(apiURL('/api/invitations'), { headers: authHeaders(token), signal })
        : Promise.resolve(null)
      const [templateResponse, invitationResponse] = await Promise.all([
        templateRequest,
        invitationRequest,
      ])

      if (!templateResponse.ok) {
        throw new Error('API response was not ok')
      }

      const templateData = await templateResponse.json() as Template[]
      setTemplates(templateData.length > 0 ? templateData : fallbackTemplates)

      if (invitationResponse) {
        if (!invitationResponse.ok) {
          throw new Error('Invitation API response was not ok')
        }
        setInvitations(await invitationResponse.json() as Invitation[])
      } else {
        setInvitations([])
      }
      setSource('api')
    } catch {
      if (!signal?.aborted) {
        setTemplates(fallbackTemplates)
        setSource('fallback')
      }
    } finally {
      if (!signal?.aborted) {
        setIsDataLoading(false)
      }
    }
  }, [token])

  const loadPublicInvitation = useCallback(async (slug: string) => {
    if (!slug) {
      return
    }
    setPublicInvitationStatus((current) => {
      if (current[slug] === 'loading') {
        return current
      }
      return { ...current, [slug]: 'loading' }
    })
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}`))
      if (response.status === 404) {
        setPublicInvitationStatus((current) => ({ ...current, [slug]: 'not-found' }))
        return
      }
      if (!response.ok) {
        throw new Error('Invitation API response was not ok')
      }
      const invitation = await response.json() as Invitation
      setPublicInvitations((current) => ({ ...current, [slug]: invitation }))
      setPublicInvitationStatus((current) => ({ ...current, [slug]: 'ready' }))
    } catch {
      setPublicInvitationStatus((current) => ({ ...current, [slug]: 'error' }))
    }
  }, [])

  async function createInvitation(input: CreateInvitationInput) {
    if (!token) {
      setFormMessage('Silakan login dulu untuk membuat undangan.')
      return null
    }
    setIsCreating(true)
    setFormMessage('')
    try {
      const response = await fetch(apiURL('/api/invitations'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal membuat undangan')
      }

      const createdInvitation = await response.json() as Invitation
      setInvitations((current) => [createdInvitation, ...current])
      setSource('api')
      setFormMessage('Undangan baru berhasil dibuat.')
      return createdInvitation
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Gagal membuat undangan')
      return null
    } finally {
      setIsCreating(false)
    }
  }

  async function updateInvitation(slug: string, input: UpdateInvitationInput) {
    if (!token) {
      setEditorMessage('Silakan login dulu untuk menyimpan undangan.')
      return false
    }
    setIsUpdating(true)
    setEditorMessage('')
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}`), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'PATCH',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal menyimpan perubahan')
      }

      const updatedInvitation = await response.json() as Invitation
      setInvitations((current) =>
        current.map((item) => item.slug === updatedInvitation.slug ? updatedInvitation : item),
      )
      setEditorMessage('Perubahan undangan berhasil disimpan.')
      setSource('api')
      return true
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'Gagal menyimpan perubahan')
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  async function publishInvitation(slug: string, input: PublishInvitationInput) {
    if (!token) {
      setPublishMessage('Silakan login dulu untuk publish.')
      return false
    }
    setIsPublishing(true)
    setPublishMessage('')
    try {
      const response = await fetch(apiURL(`/api/v1/invitations/${slug}/publish`), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'PUT',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal publish undangan')
      }
      const published = await response.json() as Invitation
      setInvitations((current) =>
        current.map((item) => item.slug === published.slug ? published : item),
      )
      trackEvent({
        eventName: 'publish',
        invitationSlug: slug,
        properties: { dynamicOg: input.dynamicOg, removeWatermark: input.removeWatermark },
      })
      setPublishMessage('Undangan berhasil dipublish.')
      return true
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : 'Gagal publish undangan')
      return false
    } finally {
      setIsPublishing(false)
    }
  }

  async function submitRSVP(slug: string, input: RSVPInput) {
    setIsSubmittingRSVP(true)
    setRSVPMessage('')
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/rsvp`), {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal mengirim RSVP')
      }

      const createdRSVP = await response.json() as RSVP
      trackEvent({
        eventName: 'rsvp_submit',
        invitationSlug: slug,
        properties: { guests: input.guests, status: input.status },
      })
      setRSVPsBySlug((current) => ({
        ...current,
        [slug]: [createdRSVP, ...(current[slug] ?? [])],
      }))
      setPublicInvitations((current) => {
        const invitation = current[slug]
        if (!invitation) return current
        return { ...current, [slug]: { ...invitation, rsvpCount: invitation.rsvpCount + 1 } }
      })
      setInvitations((current) =>
        current.map((item) => item.slug === slug ? { ...item, rsvpCount: item.rsvpCount + 1 } : item),
      )
      setRSVPMessage('Terima kasih, RSVP Anda sudah tersimpan.')
      return true
    } catch (error) {
      setRSVPMessage(error instanceof Error ? error.message : 'Gagal mengirim RSVP')
      return false
    } finally {
      setIsSubmittingRSVP(false)
    }
  }

  async function generateImage(input: AIImageInput) {
    if (!token) {
      setImageMessage('Silakan login dulu untuk generate asset.')
      return null
    }
    setIsGeneratingImage(true)
    setImageMessage('')
    try {
      const response = await fetch(apiURL('/api/ai/images'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal generate gambar')
      }

      const image = await response.json() as AIImageResult
      setGeneratedImages((current) => [image, ...current])
      setImageMessage('Gambar berhasil dibuat dan disimpan sebagai asset lokal.')
      return image
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Gagal generate gambar')
      return null
    } finally {
      setIsGeneratingImage(false)
    }
  }

  async function createManualPayment(input: ManualPaymentInput) {
    if (!token) {
      setPaymentMessage('Silakan login admin dulu.')
      return false
    }
    setIsAdminSaving(true)
    setPaymentMessage('')
    try {
      const response = await fetch(apiURL('/api/admin/payments/manual'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal aktivasi payment manual')
      }
      setPaymentMessage('Payment manual berhasil dicatat dan tier user diperbarui.')
      return true
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Gagal aktivasi payment manual')
      return false
    } finally {
      setIsAdminSaving(false)
    }
  }

  async function registerTemplate(input: TemplateAdminInput) {
    if (!token) {
      setTemplateMessage('Silakan login admin dulu.')
      return false
    }
    setIsAdminSaving(true)
    setTemplateMessage('')
    try {
      const response = await fetch(apiURL('/api/admin/templates'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal register template')
      }
      const template = await response.json() as Template
      setTemplates((current) => [template, ...current])
      setTemplateMessage('Template berhasil diregister.')
      return true
    } catch (error) {
      setTemplateMessage(error instanceof Error ? error.message : 'Gagal register template')
      return false
    } finally {
      setIsAdminSaving(false)
    }
  }

  const loadRSVPs = useCallback(async (slug: string) => {
    if (!token) {
      setRSVPsBySlug((current) => ({ ...current, [slug]: current[slug] ?? [] }))
      return
    }
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/rsvps`), {
        headers: authHeaders(token),
      })
      if (!response.ok) {
        throw new Error('API response was not ok')
      }
      const data = await response.json() as RSVP[]
      setRSVPsBySlug((current) => ({ ...current, [slug]: data }))
    } catch {
      setRSVPsBySlug((current) => ({ ...current, [slug]: current[slug] ?? [] }))
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      void loadData(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [loadData])

  return {
    createInvitation,
    createManualPayment,
    editorMessage,
    formMessage,
    generateImage,
    generatedImages,
    imageMessage,
    isAdminSaving,
    invitations,
    isCreating,
    isDataLoading,
    isGeneratingImage,
    isPublishing,
    isSubmittingRSVP,
    isUpdating,
    loadData,
    loadPublicInvitation,
    loadRSVPs,
    paymentMessage,
    publicInvitations,
    publicInvitationStatus,
    publishInvitation,
    publishMessage,
    rsvpMessage,
    rsvpsBySlug,
    source,
    submitRSVP,
    registerTemplate,
    templateMessage,
    templates,
    updateInvitation,
  }
}

function findInvitation(slug: string, invitations: Invitation[]) {
  return invitations.find((item) => item.slug === slug)
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function readableStatus(status: string) {
  return titleCase(status.toLowerCase())
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.querySelector(selector) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function AuthPage({
  authMessage,
  isAuthenticating,
  mode,
  onAuthenticate,
}: {
  authMessage: string
  isAuthenticating: boolean
  mode: 'login' | 'register'
  onAuthenticate: (mode: 'login' | 'register', input: AuthRequestInput) => Promise<boolean>
}) {
  const [form, setForm] = useState<AuthRequestInput>({
    displayName: '',
    email: '',
    password: '',
  })
  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await onAuthenticate(mode, form)
    if (ok) {
      window.location.href = '/dashboard/undangan'
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          <span>U</span>
          <strong>undanganku</strong>
        </a>
        <p className="eyebrow">{isRegister ? 'Daftar akun' : 'Masuk dashboard'}</p>
        <h1>{isRegister ? 'Buat undangan pertama kamu.' : 'Lanjutkan undangan yang sedang dikerjakan.'}</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Nama
              <input
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="Nama kamu"
                required
                type="text"
                value={form.displayName}
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="nama@email.com"
              required
              type="email"
              value={form.email}
            />
          </label>
          <label>
            Password
            <input
              minLength={8}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimal 8 karakter"
              required
              type="password"
              value={form.password}
            />
          </label>
          <button className="button primary" disabled={isAuthenticating} type="submit">
            {isAuthenticating ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
          </button>
          {authMessage ? <p className="form-message">{authMessage}</p> : null}
        </form>
        <p className="auth-switch">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
          {' '}
          <a href={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Masuk' : 'Daftar gratis'}
          </a>
        </p>
      </section>
    </main>
  )
}

function LoadingPage({ title }: { title: string }) {
  return (
    <main className="auth-page">
      <section className="auth-card compact">
        <p className="eyebrow">Mohon tunggu</p>
        <h1>{title}</h1>
        <p>Data sedang disiapkan dari server.</p>
      </section>
    </main>
  )
}

function NotFoundPage({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <main className="auth-page">
      <section className="auth-card compact">
        <p className="eyebrow">Tidak ditemukan</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <a className="button primary" href="/">Kembali ke Home</a>
      </section>
    </main>
  )
}

function App() {
  const pathname = window.location.pathname
  const authSession = useAuthSession()
  const {
    createInvitation,
    editorMessage,
    formMessage,
    generateImage,
    generatedImages,
    imageMessage,
    invitations,
    isCreating,
    isDataLoading,
    isGeneratingImage,
    isPublishing,
    isSubmittingRSVP,
    isUpdating,
    loadPublicInvitation,
    loadRSVPs,
    publicInvitations,
    publicInvitationStatus,
    publishInvitation,
    publishMessage,
    rsvpMessage,
    rsvpsBySlug,
    source,
    submitRSVP,
    createManualPayment,
    isAdminSaving,
    paymentMessage,
    registerTemplate,
    templateMessage,
    templates,
    updateInvitation,
  } = useAPIData(authSession.auth.token)

  const publicSlug = pathname.startsWith('/u/')
    ? pathname.split('/').filter(Boolean)[1] ?? ''
    : ''

  useEffect(() => {
    if (publicSlug) {
      void loadPublicInvitation(publicSlug)
    }
  }, [loadPublicInvitation, publicSlug])

  if (pathname.startsWith('/login')) {
    return (
      <AuthPage
        authMessage={authSession.authMessage}
        isAuthenticating={authSession.isAuthenticating}
        mode="login"
        onAuthenticate={authSession.authenticate}
      />
    )
  }

  if (pathname.startsWith('/register')) {
    return (
      <AuthPage
        authMessage={authSession.authMessage}
        isAuthenticating={authSession.isAuthenticating}
        mode="register"
        onAuthenticate={authSession.authenticate}
      />
    )
  }

  if (pathname.startsWith('/dashboard/edit/')) {
    if (!authSession.auth.token) {
      return (
        <AuthPage
          authMessage="Silakan login dulu untuk membuka editor."
          isAuthenticating={authSession.isAuthenticating}
          mode="login"
          onAuthenticate={authSession.authenticate}
        />
      )
    }
    const slug = pathname.split('/').filter(Boolean)[2] ?? ''
    const invitation = findInvitation(slug, invitations)
    if (!invitation && isDataLoading) {
      return <LoadingPage title="Memuat editor undangan..." />
    }
    if (!invitation) {
      return <NotFoundPage title="Undangan tidak ditemukan" description="Data ini tidak ada di akun yang sedang login." />
    }
    return (
      <EditorPage
        editorMessage={editorMessage}
        invitation={invitation}
        isPublishing={isPublishing}
        isUpdating={isUpdating}
        loadRSVPs={loadRSVPs}
        publishInvitation={publishInvitation}
        publishMessage={publishMessage}
        rsvps={rsvpsBySlug[slug] ?? []}
        updateInvitation={updateInvitation}
      />
    )
  }

  if (pathname.startsWith('/dashboard')) {
    if (!authSession.auth.token) {
      return (
        <AuthPage
          authMessage="Login untuk masuk dashboard."
          isAuthenticating={authSession.isAuthenticating}
          mode="login"
          onAuthenticate={authSession.authenticate}
        />
      )
    }
    return (
      <DashboardPage
        authUser={authSession.auth.user}
        createInvitation={createInvitation}
        formMessage={formMessage}
        generateImage={generateImage}
        generatedImages={generatedImages}
        imageMessage={imageMessage}
        invitations={invitations}
        isAdminSaving={isAdminSaving}
        isCreating={isCreating}
        isDataLoading={isDataLoading}
        isGeneratingImage={isGeneratingImage}
        logout={authSession.logout}
        onCreateManualPayment={createManualPayment}
        onRegisterTemplate={registerTemplate}
        paymentMessage={paymentMessage}
        templateMessage={templateMessage}
        templates={templates}
        source={source}
      />
    )
  }

  if (pathname.startsWith('/mockup-dashboard')) {
    return <LinkundanganStyleMockupPage />
  }

  if (pathname.startsWith('/mockup-saas-flow') || pathname.startsWith('/mokap-saas')) {
    return <LinkundanganStyleMockupPage />
  }

  if (pathname.startsWith('/templates')) {
    return <TemplatesPage templates={templates} />
  }

  if (pathname.startsWith('/builder-preview')) {
    return <BuilderPreviewPage />
  }

  if (pathname.startsWith('/preview/')) {
    const templateId = pathname.split('/').filter(Boolean)[1] ?? templateRegistry[0].id
    return <DirectTemplatePreviewPage templateId={templateId} />
  }

  if (pathname.startsWith('/u/')) {
    const slug = pathname.split('/').filter(Boolean)[1] ?? ''
    const status = publicInvitationStatus[slug]
    const invitation = publicInvitations[slug]
    if (status === 'not-found') {
      return <NotFoundPage title="Undangan tidak ditemukan" description="Periksa kembali link undangan yang dibagikan." />
    }
    if (status === 'error') {
      return <NotFoundPage title="Undangan belum bisa dimuat" description="API sedang tidak tersedia atau link belum dipublish." />
    }
    if (!invitation) {
      return <LoadingPage title="Memuat undangan..." />
    }
    return (
      <PublicInvitationPage
        invitation={invitation}
        isSubmittingRSVP={isSubmittingRSVP}
        rsvpMessage={rsvpMessage}
        submitRSVP={submitRSVP}
      />
    )
  }

  return <HomePage invitations={invitations} templates={templates} source={source} />
}

const weddingAdminTransactions = [
  {
    amount: 'Rp 79.000',
    customer: 'Budi Santoso',
    id: '#TX-9021',
    packageName: 'Pro',
    status: 'Selesai',
  },
  {
    amount: 'Rp 39.000',
    customer: 'Anisa Rahma',
    id: '#TX-9022',
    packageName: 'Creator',
    status: 'Pending',
  },
  {
    amount: 'Rp 199.000',
    customer: 'Siska Amelia',
    id: '#TX-9023',
    packageName: 'Business',
    status: 'Selesai',
  },
]

const weddingAdminMembers = [
  {
    email: 'rian.hidayat@example.com',
    initials: 'RH',
    name: 'Rian Hidayat',
    plan: 'Creator',
  },
  {
    email: 'siska.p@example.com',
    initials: 'SP',
    name: 'Siska Putri',
    plan: 'Pro',
  },
]

export function WeddingAdminDashboardPage({
  invitations,
  source,
  templates,
}: {
  invitations: Invitation[]
  source: 'api' | 'fallback'
  templates: Template[]
}) {
  const [showToast, setShowToast] = useState(true)
  const gate = useTierGate()
  const totalRSVP = invitations.reduce((sum, item) => sum + item.rsvpCount, 0)
  const publishedCount = invitations.filter((item) => item.status.toLowerCase() === 'published').length
  const pendingPayment = Math.max(1, invitations.length - publishedCount)
  const revenue = publishedCount * 79000
  const recentInvitations = invitations.slice(0, 3)

  const statCards: Array<{
    accent: 'danger' | 'good' | 'neutral'
    icon: MockupMenuIconName
    label: string
    note: string
    value: string
  }> = [
    {
      accent: 'good',
      icon: 'inbox',
      label: 'Total Undangan',
      note: source === 'api' ? 'Tersambung ke API' : 'Mode demo',
      value: String(invitations.length),
    },
    {
      accent: 'good',
      icon: 'sparkle',
      label: 'Template Aktif',
      note: 'Siap dipakai di builder',
      value: String(templates.length),
    },
    {
      accent: 'danger',
      icon: 'ticket',
      label: 'Pending Payment',
      note: 'Butuh verifikasi',
      value: String(pendingPayment),
    },
    {
      accent: 'good',
      icon: 'receipt',
      label: 'Revenue',
      note: `${totalRSVP} RSVP tercatat`,
      value: revenue > 0 ? formatRupiah(revenue) : 'Rp 0',
    },
  ]

  return (
    <main className="wa-dashboard">
      {showToast ? (
        <aside className="wa-toast">
          <span aria-hidden="true"><MockupMenuIcon name="sparkle" /></span>
          <div>
            <strong>Selamat Datang, Admin!</strong>
            <small>Siap mengelola hari bahagia mereka?</small>
          </div>
          <button aria-label="Tutup notifikasi" onClick={() => setShowToast(false)} type="button">x</button>
        </aside>
      ) : null}

      <aside className="wa-sidebar">
        <a className="wa-brand" href="/dashboard/undangan">
          <strong>Admin Panel</strong>
          <span>Wedding Management</span>
        </a>
        <nav className="wa-nav" aria-label="Dashboard navigation">
          {[
            ['dashboard', 'Dashboard', 'inbox'],
            ['member', 'Member', 'users'],
            ['transaksi', 'Transaksi', 'receipt'],
            ['pengaturan', 'Pengaturan', 'settings'],
          ].map(([id, label, icon]) => (
            <a className={id === 'dashboard' ? 'active' : ''} href={`#${id}`} key={id}>
              <span aria-hidden="true"><MockupMenuIcon name={icon as MockupMenuIconName} /></span>
              {label}
            </a>
          ))}
        </nav>
        <a className="wa-create" href="/mockup-dashboard">
          Buat Undangan
        </a>
        <div className="wa-sidebar-footer">
          <a href="#bantuan"><MockupMenuIcon name="help" />Bantuan</a>
          <a href="#keluar"><MockupMenuIcon name="logout" />Keluar</a>
        </div>
      </aside>

      <section className="wa-shell">
        <header className="wa-topbar">
          <label className="wa-search">
            <span aria-hidden="true"><MockupMenuIcon name="settings" /></span>
            <input placeholder="Cari transaksi atau member..." />
          </label>
          <div className="wa-top-actions">
            <button aria-label="Notifikasi" type="button"><MockupMenuIcon name="pulse" /></button>
            <button aria-label="Pengaturan" type="button"><MockupMenuIcon name="settings" /></button>
            <div className="wa-admin">
              <div>
                <strong>Admin Wedding</strong>
                <span>Super Administrator</span>
              </div>
              <b>AW</b>
            </div>
          </div>
        </header>

        <section className="wa-content">
          <TierExpiryBanner />

          <section className="wa-stat-grid">
            {statCards.map((card) => (
              <article className="wa-stat-card" key={card.label}>
                <span aria-hidden="true"><MockupMenuIcon name={card.icon} /></span>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <small className={`wa-stat-note ${card.accent}`}>{card.note}</small>
              </article>
            ))}
          </section>

          <section className="wa-bento-grid">
            <article className="wa-panel wa-panel-wide">
              <div className="wa-panel-head">
                <div>
                  <h2>Transaksi Terbaru</h2>
                  <p>Pantau aktivitas pembayaran terkini</p>
                </div>
                <a href="#transaksi">Lihat Semua</a>
              </div>
              <div className="wa-table-wrap">
                <table className="wa-table">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Customer</th>
                      <th>Paket</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weddingAdminTransactions.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.id}</strong></td>
                        <td>
                          <span className="wa-avatar">{item.customer.slice(0, 1)}</span>
                          {item.customer}
                        </td>
                        <td>{item.packageName}</td>
                        <td><em className={item.status === 'Selesai' ? 'paid' : 'pending'}>{item.status}</em></td>
                        <td>{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="wa-panel">
              <div className="wa-panel-head">
                <div>
                  <h2>Member Baru</h2>
                  <p>Pendaftaran akun terbaru</p>
                </div>
              </div>
              <div className="wa-member-list">
                {weddingAdminMembers.map((member) => (
                  <div className="wa-member-row" key={member.email}>
                    <span>{member.initials}</span>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </div>
                    <b>{member.plan}</b>
                  </div>
                ))}
                {recentInvitations.map((item) => (
                  <div className="wa-member-row" key={item.slug}>
                    <span>{item.couple.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <strong>{item.couple}</strong>
                      <small>/{item.slug}</small>
                    </div>
                    <b>{readableStatus(item.status)}</b>
                  </div>
                ))}
              </div>
              <a className="wa-outline-action" href="#member">Kelola Semua Member</a>
            </article>

            <article className="wa-announcement">
              <div>
                <h2>Update Fitur Baru: RSVP Otomatis</h2>
                <p>
                  Admin dapat mengaktifkan konfirmasi kehadiran dan export data sesuai tier. Saat ini tier aktif: {gate.tier.toUpperCase()}.
                </p>
                <a href="/dashboard/langganan">Pelajari Selengkapnya</a>
              </div>
              <span aria-hidden="true"><MockupMenuIcon name="pulse" /></span>
            </article>
          </section>
        </section>

        <footer className="wa-footer">
          CintaBuku Wedding Admin - Premium Invitation Management System
        </footer>
      </section>
    </main>
  )
}

function HomePage({
  invitations,
  templates,
  source,
}: {
  invitations: Invitation[]
  templates: Template[]
  source: 'api' | 'fallback'
}) {
  const heroTemplate = templateRegistry[6] ?? templateRegistry[0]
  const sideTemplate = templateRegistry[1] ?? templateRegistry[0]
  const thirdTemplate = templateRegistry[7] ?? templateRegistry[0]
  const categoryItems = [
    ['Wedding Modern', 'bg-blue'],
    ['Adat Jawa', 'bg-violet'],
    ['Adat Sunda', 'bg-rose'],
    ['Minang Klasik', 'bg-amber'],
    ['Muslim Elegan', 'bg-cyan'],
    ['Khitan & Aqiqah', 'bg-emerald'],
    ['Syukuran', 'bg-lime'],
    ['Event Custom', 'bg-slate'],
  ]
  const templateCards = [
    {
      name: 'Elegan-Grey',
      price: 'Rp.39.000',
      image: '/template-assets/wedding-premium050-original/assets/images/088-4-3f763d32.webp',
      url: '/template-assets/wedding-premium050-original/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Black-Java',
      price: 'Rp.39.000',
      image: '/template-assets/034/assets/images/074-pexels-nadi-lindsay-2789545.jpg',
      url: '/template-assets/034/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Jawa Klasik',
      price: 'Rp.59.000',
      image: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan/assets/images/hero-couple.webp',
      url: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Minang Klasik',
      price: 'Rp.69.000',
      image: '/template-assets/adat-minang-050-klasik-zahra-fadli/assets/images/hero-couple.webp',
      url: '/template-assets/adat-minang-050-klasik-zahra-fadli/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Sunda Premium',
      price: 'Rp.69.000',
      image: '/template-assets/adat-sunda-050-pro-raras-danis/assets/images/hero-couple.webp',
      url: '/template-assets/adat-sunda-050-pro-raras-danis/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Indonesia Editorial',
      price: 'Rp.79.000',
      image: '/template-assets/wedding-premium074-indonesia-editorial/assets/images/footages/indonesia-wedding-03.png',
      url: '/template-assets/wedding-premium074-indonesia-editorial/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Wayang Batik',
      price: 'Rp.59.000',
      image: '/template-assets/wedding-premium042-wayang-batik/assets/images/background-cover-couple.jpg',
      url: '/template-assets/wedding-premium042-wayang-batik/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Nature Soft',
      price: 'Rp.39.000',
      image: '/template-assets/adat-jawa-alyssa-rayhan-optimized/assets/images/photo-gallery-04.webp',
      url: '/template-assets/adat-jawa-alyssa-rayhan-optimized/index.html?to=Tamu+Undangan',
    },
  ]
  const featureItems = [
    ['Editor siap pakai', 'Ubah nama pasangan, tanggal, lokasi, foto, musik, dan rekening tanpa menyentuh kode.'],
    ['Link personal tamu', 'Bagikan undangan dengan nama penerima agar terasa lebih sopan dan rapi.'],
    ['RSVP terkumpul', 'Ucapan, jumlah hadir, dan daftar tamu masuk ke dashboard untuk dipantau.'],
    ['Preview seperti HP', 'Cek tampilan mobile, maps, audio, dan auto-scroll sebelum link disebarkan.'],
  ]
  const pricingItems = [
    ['Starter', 'Rp.0', 'Coba alur builder dan preview undangan sebelum memilih paket.'],
    ['Creator', 'Rp.39.000', 'Template premium, nama tamu, RSVP, maps, dan publish link.'],
    ['Signature', 'Rp.59.000', 'Musik, auto-scroll, galeri foto, gift, dan style adat pilihan.'],
    ['Studio', 'Rp.99.000', 'Dibantu admin, revisi prioritas, dan tampilan lebih personal.'],
  ]
  const heroBadges = ['Preview mobile', 'Nama tamu otomatis', 'Maps aktif']
  const processSteps = [
    ['01', 'Pilih tema', 'Mulai dari template premium yang sudah siap jual.'],
    ['02', 'Isi detail', 'Masukkan data acara, foto, rekening, RSVP, dan lokasi.'],
    ['03', 'Bagikan link', 'Preview dulu, lalu kirim link personal ke tamu.'],
  ]

  return (
    <main className="ii-home min-screen">
      <header className="ii-nav">
        <a className="ii-logo" href="/">
          <span aria-hidden="true" />
          <strong>undanganku</strong>
        </a>
        <nav aria-label="Navigasi utama">
          <a className="active" href="/">Home</a>
          <a href="#harga">Harga</a>
          <a href="#template-design">Contoh</a>
          <a href="#fitur">Tools</a>
          <a href="#template-design">Template</a>
          <a href="#fitur">Tutorial</a>
          <a href="/dashboard">Login</a>
        </nav>
        <a className="ii-cta" href="/mockup-dashboard">Mulai Gratis</a>
        <button className="ii-menu" aria-label="Buka menu" type="button">
          <span />
          <span />
          <span />
        </button>
      </header>

      <section className="ii-hero">
        <div className="ii-hero-copy">
          <small className="ii-hero-kicker">Platform undangan digital premium</small>
          <h1>
            Undangan
            <br />
            Digital Premium
            <br />
            Siap Dibagikan
            <br />
            <span>Hari Ini</span>
          </h1>
          <p>
            Buat link undangan yang terlihat rapi di HP tamu: template adat,
            nama penerima, musik, maps, RSVP, galeri, dan gift tersusun dalam
            satu alur yang mudah diedit.
          </p>
          <div className="ii-hero-badges" aria-label="Keunggulan utama">
            {heroBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="ii-actions">
            <a href="/mockup-dashboard">Mulai Buat Undangan &gt;</a>
            <a href="/dashboard">
              <b>WA</b>
              Konsultasi Admin
            </a>
          </div>
          <p className="ii-admin-note">
            <strong>Bisa dibantu sampai jadi.</strong> Preview dulu, revisi tampilan, lalu publish saat sudah cocok.
          </p>
        </div>

        <div className="ii-hero-visual" aria-label="Preview undangan">
          <div className="ii-preview-stack">
            <div className="ii-side-card left">
              <img alt="Preview template undangan kiri" src={sideTemplate.thumbnail} />
            </div>
            <div className="ii-phone">
              <div className="ii-notch" />
              <img alt="Preview template utama" src={heroTemplate.thumbnail} />
              <div>
                <small>The Wedding Of</small>
                <strong>Alyssa & Rayhan</strong>
                <span>Buka Undangan</span>
              </div>
            </div>
            <div className="ii-side-card right">
              <img alt="Preview template undangan kanan" src={thirdTemplate.thumbnail} />
            </div>
          </div>
          <div className="ii-flow-card">
            <small>Flow pembuatan</small>
            <strong>Dari data acara sampai link siap share</strong>
            {processSteps.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <div>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ii-categories" aria-label="Kategori acara">
        {categoryItems.map(([label, tone]) => (
          <a className={`ii-category ${tone}`} href="#template-design" key={label}>
            <span aria-hidden="true" />
            <strong>{label}</strong>
          </a>
        ))}
      </section>

      <section className="ii-template-section" id="template-design">
        <div className="ii-heading">
          <small>Katalog premium</small>
          <h2>Mulai dari desain yang sudah terasa siap pakai</h2>
          <p>{templateRegistry.length} template lokal siap preview. Data katalog API: {source === 'api' ? 'aktif' : `${templates.length} demo`}.</p>
        </div>
        <div className="ii-template-grid">
          {templateCards.map((template) => (
            <article className="ii-template-card" key={template.name}>
              <a href={template.url}>
                <img alt={`Preview ${template.name}`} src={template.image} />
              </a>
              <p>{template.price}</p>
              <h3>{template.name}</h3>
              <div aria-label="Rating bintang">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <a href={template.url}>Preview</a>
              <a href="/mockup-dashboard">Gunakan Tema</a>
            </article>
          ))}
        </div>
        <a className="ii-more" href="/templates">Tampilkan Tema Lainnya</a>
      </section>

      <section className="ii-proof">
        <article>
          <strong>800.000+</strong>
          <span>Link undangan dibuat</span>
        </article>
        <article>
          <strong>2.5 juta+</strong>
          <span>Tamu menerima undangan</span>
        </article>
        <article>
          <strong>{invitations.length}</strong>
          <span>Project aktif</span>
        </article>
        <article>
          <strong>{templateRegistry.length}</strong>
          <span>Template aktif</span>
        </article>
      </section>

      <section className="ii-feature-section" id="fitur">
        <div className="ii-heading">
          <small>Fitur operasional</small>
          <h2>Satu dashboard untuk edit, preview, dan publish</h2>
          <p>Dibuat untuk pemilik acara, reseller, dan admin yang perlu kerja cepat tanpa kehilangan rasa premium.</p>
        </div>
        <div className="ii-feature-grid">
          {featureItems.map(([title, body]) => (
            <article key={title}>
              <span aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ii-pricing" id="harga">
        <div className="ii-heading">
          <small>Paket fleksibel</small>
          <h2>Pilih paket sesuai kebutuhan acara</h2>
        </div>
        <div className="ii-price-grid">
          {pricingItems.map(([name, price, body], index) => (
            <article className={index === 2 ? 'featured' : ''} key={name}>
              <small>{name}</small>
              <strong>{price}</strong>
              <p>{body}</p>
              <a href="/mockup-dashboard">Pilih Paket</a>
            </article>
          ))}
        </div>
      </section>

      <footer className="ii-footer">
        <strong>undanganku</strong>
        <span>Undangan digital Indonesia yang rapi, hangat, dan siap dibagikan.</span>
      </footer>

      <a className="ii-wa" href="/dashboard" aria-label="Chat admin">
        <small>Butuh Bantuan?</small>
        <b>WA</b>
      </a>
      <nav className="ii-bottom-nav" aria-label="Navigasi mobile">
        <a href="/">Home</a>
        <a href="#harga">Harga</a>
        <a href="#template-design">Template</a>
        <a href="/dashboard">Login</a>
      </nav>
    </main>
  )
}

function TemplatesPage({ templates }: { templates: Template[] }) {
  const catalogItems = templateRegistry.map((template) => ({
    category: template.category,
    code: template.code,
    id: template.id,
    image: template.thumbnail,
    name: template.name,
    plan: template.plan,
    url: `${template.publicPath}/index.html?to=Tamu+Undangan`,
  }))

  return (
    <main className="paper-grain min-screen">
      <Nav />
      <section className="page-shell page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Katalog template</p>
            <h1>Pilih desain undangan digital.</h1>
            <p>
              {catalogItems.length} template lokal siap preview. Data katalog API:
              {' '}{templates.length} item.
            </p>
          </div>
          <a className="button primary" href="/dashboard">
            Kelola Template
          </a>
        </div>

        <div className="template-grid">
          {catalogItems.map((template) => (
            <article className="template-card" key={template.id}>
              <a className="template-art" href={template.url}>
                <img alt={`Preview ${template.name}`} src={template.image} />
              </a>
              <div className="template-body">
                <p>{template.plan}</p>
                <h2>{template.name}</h2>
                <span>{titleCase(template.category)} - {template.code}</span>
                <a className="button secondary" href={template.url}>
                  Preview
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

const mockupCategoryOptions = [
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

type MockupCategoryId = (typeof mockupCategoryOptions)[number]['id']
type MockupTemplateFilter = 'all' | 'premium' | 'free'
type MockupWizardStep = 'intro' | 'template' | 'details'

type MockupCreateInvitationInput = {
  eventDate: string
  isAnnouncement: boolean
  slug: string
  template: TemplateRegistryItem
  title: string
}

const initialMockupInvitationCards: MockupInvitationCard[] = [
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

export function LinkundanganStyleMockupPage() {
  const [activeMenu, setActiveMenu] = useState('undangan')
  const [invitationCards, setInvitationCards] = useState(initialMockupInvitationCards)
  const [isCreateWizardOpen, setCreateWizardOpen] = useState(false)
  const [wizardInitialTemplateId, setWizardInitialTemplateId] = useState(templateRegistry[0].id)
  const [wizardNotice, setWizardNotice] = useState('')
  const [wizardSessionKey, setWizardSessionKey] = useState(0)
  const menuGroups = [
    {
      title: '',
      items: [
        ['undangan', 'inbox', 'Undangan Online'],
        ['builder', 'layout', 'Builder Template'],
        ['transaksi', 'receipt', 'Order | Transaksi'],
        ['premium', 'sparkle', 'List Versi Premium'],
        ['report', 'chart', 'Report'],
        ['visitor', 'pulse', 'Realtime Visitor'],
        ['reseller', 'users', 'Reseller | Mitra'],
        ['langganan', 'calendar', 'Langganan'],
        ['voucher', 'ticket', 'Gunakan Voucher'],
        ['bantuan', 'help', 'Butuh Bantuan'],
      ],
    },
    {
      title: 'Undangan Lainnya',
      items: [
        ['digital', 'layout', 'Undangan Digital'],
        ['gambar', 'image', 'Undangan Gambar'],
        ['video', 'video', 'Undangan Video'],
      ],
    },
    {
      title: 'Lainnya',
      items: [
        ['profile', 'user', 'Edit Profile'],
        ['password', 'lock', 'Ganti Password'],
      ],
    },
  ] as const

  function openCreateWizard(templateId = templateRegistry[0].id) {
    setWizardInitialTemplateId(templateId)
    setWizardSessionKey((key) => key + 1)
    setCreateWizardOpen(true)
  }

  function handleCreateInvitation(input: MockupCreateInvitationInput) {
    const newCard: MockupInvitationCard = {
      code: createMockupInvitationCode(),
      date: formatMockupDateRange(input.eventDate),
      image: input.template.thumbnail,
      slug: input.slug,
      status: input.template.plan === 'premium' ? 'Versi Premium' : 'Versi Gratis',
      template: input.template.code,
      templateId: input.template.id,
      title: input.title,
    }

    setInvitationCards((current) => [newCard, ...current])
    setActiveMenu('undangan')
    setWizardNotice(`Undangan "${input.title}" berhasil dibuat. Lanjutkan dari tombol Edit Konten.`)
    window.setTimeout(() => setWizardNotice(''), 4200)
  }

  return (
    <main className="lu-mockup">
      <aside className="lu-sidebar">
        <a className="lu-logo" href="/dashboard/undangan">
          <span>U</span>
          <strong>
            UNDANGANKU
            <small>PANEL UNDANGAN</small>
          </strong>
        </a>
        <nav className="lu-menu">
          {menuGroups.map((group) => (
            <div key={group.title || 'utama'}>
              {group.title ? <h3>{group.title}</h3> : null}
              {group.items.map(([id, icon, label]) => (
                <a
                  className={activeMenu === id ? 'active' : ''}
                  href={`#${id}`}
                  key={label}
                  onClick={(event) => {
                    event.preventDefault()
                    setActiveMenu(id)
                  }}
                >
                  <span aria-hidden="true"><MockupMenuIcon name={icon} /></span>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <button className="lu-sidebar-logout" type="button">
          <span aria-hidden="true"><MockupMenuIcon name="logout" /></span>
          Keluar
        </button>
      </aside>

      <section className="lu-main">
        <header className="lu-topbar">
          <div>
            <strong>DASHBOARD</strong>
            <span>BUKA WEBSITE</span>
          </div>
          <div className="lu-admin-meta">
            <strong>Candra Loka</strong>
            <span>SUPERADMIN</span>
          </div>
        </header>

        <MockupDashboardContent
          activeMenu={activeMenu}
          invitationCards={invitationCards}
          onCreateInvitation={openCreateWizard}
          setActiveMenu={setActiveMenu}
          wizardNotice={wizardNotice}
        />
      </section>
      <MockupCreateInvitationWizard
        initialTemplateId={wizardInitialTemplateId}
        isOpen={isCreateWizardOpen}
        key={wizardSessionKey}
        onClose={() => setCreateWizardOpen(false)}
        onCreate={handleCreateInvitation}
      />
    </main>
  )
}

type MockupMenuIconName =
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

function MockupMenuIcon({ name }: { name: MockupMenuIconName }) {
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

type MockupInvitationCard = {
  code: string
  date: string
  image: string
  slug: string
  status: string
  template: string
  templateId: string
  title: string
}

function MockupDashboardContent({
  activeMenu,
  invitationCards,
  onCreateInvitation,
  setActiveMenu,
  wizardNotice,
}: {
  activeMenu: string
  invitationCards: MockupInvitationCard[]
  onCreateInvitation: (templateId?: string) => void
  setActiveMenu: (menu: string) => void
  wizardNotice: string
}) {
  if (activeMenu === 'undangan') {
    return (
      <>
        <MockupDashboardOverview onCreateInvitation={onCreateInvitation} setActiveMenu={setActiveMenu} />
        {wizardNotice ? <section className="lu-success-banner">{wizardNotice}</section> : null}
        <MockupInvitationList invitationCards={invitationCards} onCreateInvitation={onCreateInvitation} />
      </>
    )
  }

  if (activeMenu === 'builder') {
    return <MockupBuilderPanel onCreateInvitation={onCreateInvitation} />
  }

  if (activeMenu === 'premium') {
    return <MockupPremiumGallery />
  }

  if (activeMenu === 'transaksi') {
    return <MockupTablePanel title="Riwayat Transaksi" subtitle="Order premium dan pembayaran" columns={['Kode', 'Status', 'Bayar Sebelum', 'Dibuat Pada']} emptyText="Belum ada transaksi." />
  }

  if (activeMenu === 'report') {
    return <MockupReportPanel />
  }

  if (activeMenu === 'visitor') {
    return <MockupTablePanel title="Realtime Visitors" subtitle="Pengunjung undangan saat ini" columns={['Guest', 'Page', 'Visited At']} emptyText="Belum ada pengunjung aktif." />
  }

  if (activeMenu === 'reseller') {
    return <MockupPlanPanel title="Reseller | Mitra" price="Rp.35rb" items={['Ganti label Linkundangan', 'Akses password client', 'Katalog reseller', 'Materi promosi siap pakai']} />
  }

  if (activeMenu === 'langganan') {
    return <MockupSubscriptionPanel />
  }

  if (activeMenu === 'voucher') {
    return <MockupVoucherPanel />
  }

  if (activeMenu === 'bantuan') {
    return <MockupHelpPanel />
  }

  if (activeMenu === 'digital' || activeMenu === 'gambar' || activeMenu === 'video') {
    return <MockupDigitalPanel activeMenu={activeMenu} />
  }

  if (activeMenu === 'profile') {
    return <MockupProfilePanel />
  }

  if (activeMenu === 'password') {
    return <MockupPasswordPanel />
  }

  return <MockupBuilderPanel onCreateInvitation={onCreateInvitation} />
}

function MockupDashboardOverview({
  onCreateInvitation,
  setActiveMenu,
}: {
  onCreateInvitation: () => void
  setActiveMenu: (menu: string) => void
}) {
  const kpis = [
    ['12', 'Undangan aktif', '7 premium'],
    ['328', 'Tamu membuka', '+18 hari ini'],
    ['92', 'RSVP masuk', '74 hadir'],
    ['4', 'Template baru', 'Siap jual'],
  ]
  const cards: Array<{
    action?: 'create'
    description: string
    icon: MockupMenuIconName
    menu?: string
    title: string
  }> = [
    { title: 'Website Publik', description: 'Lihat tampilan undangan dan katalog dari sisi tamu.', icon: 'layout', menu: 'premium' },
    { title: 'Buat Undangan', description: 'Mulai dari kategori, template, lalu isi data acara.', icon: 'inbox', action: 'create' },
    { title: 'Kelola Template', description: 'Pilih template premium atau gratis yang siap dipakai.', icon: 'sparkle', menu: 'premium' },
    { title: 'Order Premium', description: 'Pantau transaksi upgrade dan status pembayaran.', icon: 'receipt', menu: 'transaksi' },
    { title: 'Report Visitor', description: 'Pantau traffic, RSVP, dan aktivitas undangan.', icon: 'chart', menu: 'report' },
    { title: 'Pengaturan Sistem', description: 'Kelola profil, voucher, reseller, dan akses akun.', icon: 'settings', menu: 'profile' },
  ]

  return (
    <>
      <section className="lu-welcome-panel">
        <span>DASHBOARD ADMIN</span>
        <h1>Selamat datang, Candra Loka</h1>
        <p>
          Kelola undangan digital melalui pintasan cepat untuk template, tamu,
          transaksi, visitor, dan pengaturan operasional harian.
        </p>
      </section>
      <section className="lu-kpi-grid" aria-label="Ringkasan operasional">
        {kpis.map(([value, label, note], index) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
            <i aria-hidden="true">{index + 1}</i>
          </article>
        ))}
      </section>
      <section className="lu-shortcut-grid">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => {
              if (card.action === 'create') {
                onCreateInvitation()
                return
              }
              if (card.menu) {
                setActiveMenu(card.menu)
              }
            }}
            type="button"
          >
            <span aria-hidden="true"><MockupMenuIcon name={card.icon} /></span>
            <strong>{card.title}</strong>
            <small>{card.description}</small>
          </button>
        ))}
      </section>
      <section className="lu-note-panel">
        Gunakan kartu pintasan di atas untuk membuka modul yang paling sering dipakai, lalu lanjutkan pengelolaan template dan undangan aktif di bawah.
      </section>
      <section className="lu-workflow-panel">
        <article>
          <span>Admin</span>
          <strong>Upload template, kelola order, cek report.</strong>
        </article>
        <article>
          <span>User</span>
          <strong>Pilih tema, edit konten, preview, publish.</strong>
        </article>
        <article>
          <span>Builder</span>
          <strong>Registry template lokal siap dihubungkan ke form editor.</strong>
        </article>
      </section>
      <MockupTierGatePanel />
    </>
  )
}

function MockupPhoneFrame({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="lu-phone-frame">
      <div className="lu-phone-top" aria-hidden="true">
        <span>8:50</span>
        <i />
        <b />
      </div>
      <div className="lu-phone-screen">
        <img alt={alt} src={src} />
      </div>
      <div className="lu-phone-browser" aria-hidden="true">
        <span>AA</span>
        <strong>127.0.0.1</strong>
        <i />
      </div>
      <div className="lu-phone-nav" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className="lu-phone-home" aria-hidden="true" />
    </div>
  )
}

function MockupBuilderPanel({ onCreateInvitation }: { onCreateInvitation: (templateId?: string) => void }) {
  const builderStats = [
    ['Template aktif', String(templateRegistry.length), 'Registry siap dipakai'],
    ['Section engine', '12+', 'Cover, acara, galeri, RSVP'],
    ['Target publish', '< 1.5s', 'Asset lokal dan lazy load'],
  ]

  return (
    <section className="lu-panel" id="mockup-builder">
      <div className="lu-section-title">
        <div>
          <span>Langkah 1</span>
          <h2>Pilih Kategori & Template</h2>
        </div>
        <a href="/preview/template-042">Preview Halaman</a>
      </div>
      <div className="lu-builder-summary">
        {builderStats.map(([label, value, note]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="lu-builder-grid">
        <label>
          Kategori Acara
          <select defaultValue="1">
            <option value="1">Pernikahan Umum</option>
            <option value="2">Pernikahan Syar'i</option>
            <option value="31">Khitanan</option>
            <option value="37">Aqiqah</option>
            <option value="40">Umum</option>
          </select>
        </label>
        <label>
          Cari Template
          <input placeholder="Contoh: PREMIUM042 atau adat" />
        </label>
        <div className="lu-filter-row">
          {['Terbaru', 'Populer', 'Premium', 'Gratis'].map((item) => (
            <button key={item} type="button">{item}</button>
          ))}
        </div>
      </div>
      <div className="lu-template-row">
        {templateRegistry.map((template) => (
          <article key={template.id}>
            <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
            <strong>{template.code}</strong>
            <span>{template.plan.toUpperCase()}</span>
            <div className="lu-template-actions">
              <a href={`/preview/${template.id}`}>Contoh</a>
              <button onClick={() => onCreateInvitation(template.id)} type="button">Gunakan</button>
            </div>
          </article>
        ))}
      </div>
      <MockupTierGatePanel />
    </section>
  )
}

function MockupTierGatePanel() {
  const gate = useTierGate()
  const controls: Array<{ flag: FeatureFlag; label: string; note: string }> = [
    { flag: 'export_csv', label: 'Export CSV', note: 'Creator+' },
    { flag: 'custom_domain', label: 'Custom Domain', note: 'Pro+' },
    { flag: 'dynamic_og', label: 'Dynamic OG', note: 'Pro+' },
    { flag: 'bulk_create', label: 'Bulk Create', note: 'Business' },
  ]

  return (
    <div className="lu-tier-gate-panel">
      <div>
        <span>Tier aktif</span>
        <strong>{gate.tier.toUpperCase()}</strong>
        <small>
          {gate.status === 'anonymous'
            ? 'Token login belum tersedia, UI jatuh ke akses Free.'
            : gate.tierData.isInGracePeriod
              ? 'Tier dalam masa tenggang.'
              : `RSVP limit ${gate.features.rsvpLimit}`}
        </small>
      </div>
      <div className="lu-tier-control-grid">
        {controls.map((control) => {
          const allowed = gate.can(control.flag)
          return (
            <button className={allowed ? 'is-allowed' : ''} disabled={!allowed} key={control.flag} type="button">
              <strong>{control.label}</strong>
              <span>{allowed ? 'Aktif' : control.note}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MockupCreateInvitationWizard({
  initialTemplateId,
  isOpen,
  onClose,
  onCreate,
}: {
  initialTemplateId: string
  isOpen: boolean
  onClose: () => void
  onCreate: (input: MockupCreateInvitationInput) => void
}) {
  const [categoryId, setCategoryId] = useState<MockupCategoryId>('wedding')
  const [draft, setDraft] = useState({
    eventDate: '',
    isAnnouncement: true,
    slug: '',
    title: '',
  })
  const [filter, setFilter] = useState<MockupTemplateFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId)
  const [step, setStep] = useState<MockupWizardStep>('intro')

  if (!isOpen) {
    return null
  }

  const selectedTemplate = getTemplateById(selectedTemplateId)
  const activeCategory = mockupCategoryOptions.find((category) => category.id === categoryId) ?? mockupCategoryOptions[0]
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTemplates = templateRegistry.filter((template) => {
    const categoryMatches = categoryId === 'syari'
      ? template.category === 'wedding'
      : template.category === categoryId
    const filterMatches = filter === 'all' || template.plan === filter
    const queryMatches = !normalizedQuery
      || template.code.toLowerCase().includes(normalizedQuery)
      || template.name.toLowerCase().includes(normalizedQuery)

    return categoryMatches && filterMatches && queryMatches
  })

  function updateTitle(title: string) {
    setDraft((current) => ({
      ...current,
      slug: current.slug ? current.slug : slugifyInvitation(title),
      title,
    }))
  }

  function selectTemplate(template: TemplateRegistryItem) {
    setSelectedTemplateId(template.id)
    setStep('details')
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.title.trim()
    const slug = slugifyInvitation(draft.slug || title)

    if (!title || !slug) {
      return
    }

    onCreate({
      eventDate: draft.eventDate,
      isAnnouncement: draft.isAnnouncement,
      slug,
      template: selectedTemplate,
      title,
    })
    onClose()
  }

  return (
    <div className="lu-modal-backdrop" role="presentation">
      <section aria-label="Buat undangan baru" className="lu-create-modal" role="dialog">
        <header className="lu-modal-head">
          <div>
            <span>BUAT UNDANGAN</span>
            <h2>{step === 'intro' ? 'Mulai undangan baru' : step === 'template' ? 'Pilih kategori & template' : 'Isi judul & link'}</h2>
          </div>
          <button aria-label="Tutup" className="lu-close-icon" onClick={onClose} type="button">x</button>
        </header>

        <div className="lu-stepper" aria-label="Progress pembuatan undangan">
          {[
            ['intro', 'Onboarding'],
            ['template', 'Template'],
            ['details', 'Identitas'],
          ].map(([id, label]) => (
            <button
              className={step === id ? 'active' : ''}
              key={id}
              onClick={() => setStep(id as MockupWizardStep)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {step === 'intro' ? (
          <div className="lu-wizard-intro">
            <p>
              Flow pembuatan dibuat pendek: pilih tema, isi identitas publik,
              lalu lanjut edit konten acara.
            </p>
            <div className="lu-wizard-checklist">
              {[
                'Pilih tema gratis atau premium',
                'Atur judul dan slug undangan',
                'Isi data acara di editor konten',
                'Atur backsound, RSVP, auto scroll, dan privasi',
                'Preview lalu sebar undangan',
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="lu-modal-actions">
              <button className="secondary" onClick={onClose} type="button">Batal</button>
              <button onClick={() => setStep('template')} type="button">Buat Undangan</button>
            </div>
          </div>
        ) : null}

        {step === 'template' ? (
          <div className="lu-wizard-template">
            <div className="lu-category-grid">
              {mockupCategoryOptions.map((category) => (
                <button
                  className={category.id === categoryId ? 'active' : ''}
                  key={category.id}
                  onClick={() => setCategoryId(category.id)}
                  type="button"
                >
                  <strong>{category.label}</strong>
                  <span>Type {category.typeId}</span>
                  <small>{category.description}</small>
                </button>
              ))}
            </div>

            <div className="lu-wizard-tools">
              <label>
                Cari Template
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: PREMIUM042 atau adat"
                  value={query}
                />
              </label>
              <div className="lu-segmented" role="group" aria-label="Filter template">
                {[
                  ['all', 'Semua'],
                  ['premium', 'Premium'],
                  ['free', 'Gratis'],
                ].map(([id, label]) => (
                  <button
                    className={filter === id ? 'active' : ''}
                    key={id}
                    onClick={() => setFilter(id as MockupTemplateFilter)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visibleTemplates.length > 0 ? (
              <div className="lu-picker-grid">
                {visibleTemplates.map((template) => (
                  <article
                    className={`lu-picker-card${selectedTemplateId === template.id ? ' is-selected' : ''}`}
                    key={template.id}
                  >
                    <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
                    <div className="lu-picker-meta">
                      <strong>{template.code}</strong>
                      <span>{template.name}</span>
                      <small>{template.plan.toUpperCase()} - {activeCategory.label}</small>
                    </div>
                    <div className="lu-picker-actions">
                      <a href={`/preview/${template.id}`} target="_blank" rel="noreferrer">Contoh</a>
                      <button onClick={() => selectTemplate(template)} type="button">Gunakan</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="lu-empty-state">
                Belum ada template aktif untuk kategori ini. Katalog admin nanti bisa menambah template baru tanpa mengubah flow user.
              </div>
            )}
          </div>
        ) : null}

        {step === 'details' ? (
          <form className="lu-detail-form" onSubmit={submitWizard}>
            <div className="lu-selected-template">
              <img alt="" src={selectedTemplate.thumbnail} />
              <div>
                <span>Template dipilih</span>
                <strong>{selectedTemplate.code}</strong>
                <small>{selectedTemplate.name}</small>
              </div>
              <button onClick={() => setStep('template')} type="button">Ganti</button>
            </div>

            <label>
              Judul
              <input
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="The Wedding Of Alika & Herman"
                required
                value={draft.title}
              />
            </label>
            <label>
              URL Undangan
              <input
                aria-label="URL Undangan"
                onChange={(event) => setDraft({ ...draft, slug: slugifyInvitation(event.target.value) })}
                placeholder="alika-herman"
                required
                value={draft.slug}
              />
              <small className="lu-url-preview">https://share.cintabuku.id/{draft.slug || 'nama-undangan'}</small>
            </label>
            <label>
              Tanggal Acara
              <input
                onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })}
                required
                type="date"
                value={draft.eventDate}
              />
            </label>
            <label className="lu-check">
              <input
                checked={draft.isAnnouncement}
                onChange={(event) => setDraft({ ...draft, isAnnouncement: event.target.checked })}
                type="checkbox"
              />
              Umumkan di katalog saat acara berlangsung
            </label>
            <div className="lu-modal-actions">
              <button className="secondary" onClick={() => setStep('template')} type="button">Kembali</button>
              <button type="submit">Buat & Lanjut Edit</button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}

function MockupInvitationList({
  invitationCards,
  onCreateInvitation,
}: {
  invitationCards: MockupInvitationCard[]
  onCreateInvitation: () => void
}) {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>List Daftar Undanganmu</span>
          <h2>Undangan Aktif</h2>
        </div>
        <div className="lu-section-actions">
          <div className="lu-filter-row">
            {['All', 'Free', 'Premium', 'Custom', 'Trash'].map((item) => (
              <button key={item} type="button">{item}</button>
            ))}
          </div>
          <button className="lu-primary-action" onClick={onCreateInvitation} type="button">
            Buat Undangan Baru
          </button>
        </div>
      </div>
      <div className="lu-invitation-grid">
        {invitationCards.map((item) => (
          <article className="lu-invitation-card" key={item.code}>
            <div className="lu-invitation-preview">
              <MockupPhoneFrame alt={item.title} src={item.image} />
            </div>
            <div className="lu-card-body">
              <button className="lu-duplicate" type="button">Duplikat</button>
              <b>{item.status}</b>
              <h3>{item.title}</h3>
              <div className="lu-row">
                <span>Kode Undangan</span>
                <strong>{item.code}</strong>
              </div>
              <div className="lu-row">
                <span>Template</span>
                <strong>{item.template}</strong>
              </div>
              <div className="lu-row">
                <span>Link</span>
                <strong>/{item.slug}</strong>
              </div>
              <div className="lu-row">
                <span>Waktu Acara</span>
                <strong>{item.date}</strong>
              </div>
              <div className="lu-card-actions">
                <a href="#setting">Setting</a>
                <a href={`/dashboard/edit/${item.slug}`}>Edit Konten</a>
                <a href={`/preview/${item.templateId}`}>Preview</a>
                <button type="button">Hapus</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function createMockupInvitationCode() {
  return `UDG${Date.now().toString().slice(-10)}`
}

function formatMockupDateRange(eventDate: string) {
  if (!eventDate) {
    return 'Tanggal belum diisi'
  }

  const [year, month, day] = eventDate.split('-')
  return `${day}/${month}/${year} 08:00 s/d ${day}/${month}/${year} 23:59`
}

function slugifyInvitation(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function MockupPremiumGallery() {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>Katalog referensi</span>
          <h2>List Undangan Versi Premium</h2>
        </div>
        <input className="lu-search" placeholder="Cari berdasarkan nama template" />
      </div>
      <div className="lu-template-row">
        {templateRegistry.concat(templateRegistry).map((template, index) => (
          <article key={`${template.id}-${index}`}>
            <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
            <strong>{index % 2 === 0 ? 'The Wedding of Alika & Herman' : 'Pernikahan Nusantara'}</strong>
            <span>{template.code}</span>
            <div className="lu-template-actions">
              <a href={`/preview/${template.id}`}>Lihat</a>
              <button type="button">Salin Link</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function MockupTablePanel({ columns, emptyText, subtitle, title }: { columns: string[]; emptyText: string; subtitle: string; title: string }) {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <input className="lu-search" placeholder="Search" />
      </div>
      <div className="lu-table">
        <div className="lu-table-head">
          {columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        <p>{emptyText}</p>
      </div>
    </section>
  )
}

function MockupReportPanel() {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>Report</span>
          <h2>Statistik Pengunjung</h2>
        </div>
        <div className="lu-filter-row">
          <button type="button">Bulan ini</button>
          <button type="button">Unik</button>
        </div>
      </div>
      <div className="lu-stats">
        <article><strong>128</strong><span>Pengunjung Katalog</span></article>
        <article><strong>72</strong><span>Pengunjung Undangan</span></article>
        <article><strong>31</strong><span>RSVP Masuk</span></article>
      </div>
      <div className="lu-chart">Grafik 30 hari terakhir</div>
    </section>
  )
}

function MockupPlanPanel({ items, price, title }: { items: string[]; price: string; title: string }) {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>Upgrade fitur</span>
          <h2>{title}</h2>
        </div>
        <strong className="lu-price">{price}</strong>
      </div>
      <div className="lu-plan-list">
        {items.map((item) => <article key={item}>{item}<button type="button">Aktifkan</button></article>)}
      </div>
    </section>
  )
}

function MockupSubscriptionPanel() {
  return <MockupPlanPanel title="Berlangganan" price="Mulai Rp.50rb" items={['Berlangganan 30 hari', 'Berlangganan 100 hari', 'Berlangganan 365 hari']} />
}

function MockupVoucherPanel() {
  return (
    <section className="lu-panel lu-form-panel">
      <h2>Tukar Voucher</h2>
      <label>
        Masukkan kode voucher
        <input placeholder="Kode Voucher" />
      </label>
      <button type="button">Gunakan</button>
    </section>
  )
}

function MockupHelpPanel() {
  return (
    <section className="lu-panel">
      <div className="lu-section-title">
        <div>
          <span>Tutorial</span>
          <h2>Butuh Bantuan</h2>
        </div>
      </div>
      <div className="lu-help-list">
        {['Cara membuat undangan online', 'Cara upgrade premium', 'Cara membagikan undangan', 'Cara ganti credit reseller'].map((item) => (
          <article key={item}>{item}<button type="button">Lihat</button></article>
        ))}
      </div>
    </section>
  )
}

function MockupDigitalPanel({ activeMenu }: { activeMenu: string }) {
  const title = activeMenu === 'gambar' ? 'Undangan Gambar' : activeMenu === 'video' ? 'Undangan Video' : 'Undangan Digital'
  return <MockupPlanPanel title={title} price="Gratis" items={['Template Photoshop', 'Template PowerPoint', 'Download asset', 'Panduan edit']} />
}

function MockupProfilePanel() {
  return (
    <section className="lu-panel lu-form-panel">
      <h2>Change Profile</h2>
      <label>Nama<input defaultValue="Candra Loka" /></label>
      <label>No HP<input placeholder="08xxxxxxxxxx" /></label>
      <button type="button">Submit</button>
    </section>
  )
}

function MockupPasswordPanel() {
  return (
    <section className="lu-panel lu-form-panel">
      <h2>Change Password</h2>
      <label>New Password<input type="password" /></label>
      <label>Confirm Password<input type="password" /></label>
      <button type="button">Submit</button>
    </section>
  )
}

function DirectTemplatePreviewPage({ templateId }: { templateId: string }) {
  const selectedTemplate = getTemplateById(templateId)

  return (
    <main className="direct-template-preview">
      <iframe
        src={`${selectedTemplate.publicPath}/index.html`}
        title={`${sampleInvitationData.coupleDisplayName} - ${selectedTemplate.code}`}
      />
    </main>
  )
}

function BuilderPreviewPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateRegistry[0].id)
  const [previewState, setPreviewState] = useState({
    message: 'Memuat template...',
    srcDoc: '',
  })
  const selectedTemplate = getTemplateById(selectedTemplateId)

  useEffect(() => {
    let isMounted = true

    loadTemplateHtml(selectedTemplate)
      .then((html) => {
        if (!isMounted) return
        setPreviewState({
          message: `Preview ${selectedTemplate.code} berhasil dirender dari sample JSON.`,
          srcDoc: renderTemplateHtml(html, selectedTemplate, sampleInvitationData),
        })
      })
      .catch((error) => {
        if (!isMounted) return
        setPreviewState({
          message: error instanceof Error ? error.message : 'Gagal merender template',
          srcDoc: '',
        })
      })

    return () => {
      isMounted = false
    }
  }, [selectedTemplate])

  function selectPreviewTemplate(templateId: string) {
    setPreviewState({
      message: 'Memuat template...',
      srcDoc: '',
    })
    setSelectedTemplateId(templateId)
  }

  return (
    <main className="builder-preview-page min-screen">
      <Nav />
      <section className="page-shell builder-preview-shell">
        <div className="section-heading builder-preview-heading">
          <div>
            <p className="eyebrow">Builder undangan</p>
            <h1>Preview engine untuk template siap jual.</h1>
            <p>
              Pilih template dari registry, cek data sample, lalu lihat hasil
              render di frame preview. Halaman ini menjadi fondasi editor konten
              user sebelum publish.
            </p>
          </div>
          <a className="button primary" href="/mockup-dashboard">
            Dashboard
          </a>
        </div>

        <div className="builder-layout">
          <aside className="builder-panel">
            <div className="builder-panel-head">
              <div>
                <span>Registry</span>
                <h2>Template aktif</h2>
              </div>
              <strong>{templateRegistry.length}</strong>
            </div>
            <div className="builder-status-grid">
              <article>
                <span>Plan</span>
                <strong>{selectedTemplate.plan.toUpperCase()}</strong>
              </article>
              <article>
                <span>Kategori</span>
                <strong>{selectedTemplate.category}</strong>
              </article>
              <article>
                <span>Assets</span>
                <strong>Lokal</strong>
              </article>
            </div>
            <div className="template-registry-list">
              {templateRegistry.map((template) => (
                <TemplateRegistryButton
                  isActive={template.id === selectedTemplate.id}
                  key={template.id}
                  onSelect={() => selectPreviewTemplate(template.id)}
                  template={template}
                />
              ))}
            </div>

            <div className="json-card">
              <p className="eyebrow">Data sample</p>
              <pre>{JSON.stringify(sampleInvitationData, null, 2)}</pre>
            </div>
          </aside>

          <section className="builder-preview-stage">
            <div className="builder-preview-toolbar">
              <div>
                <strong>{selectedTemplate.name}</strong>
                <span>{previewState.message}</span>
              </div>
              <div className="builder-toolbar-actions">
                <a
                  className="button secondary"
                  href={`/preview/${selectedTemplate.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Route Preview
                </a>
                <a
                  className="button secondary"
                  href={`${selectedTemplate.publicPath}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka File
                </a>
              </div>
            </div>
            <div className="builder-frame-shell">
              <div className="builder-device-top" aria-hidden="true">
                <span>Mobile preview</span>
                <strong>{selectedTemplate.code}</strong>
              </div>
              <iframe
                className="template-render-frame"
                srcDoc={previewState.srcDoc}
                title={`Preview ${selectedTemplate.code}`}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function TemplateRegistryButton({
  isActive,
  onSelect,
  template,
}: {
  isActive: boolean
  onSelect: () => void
  template: TemplateRegistryItem
}) {
  return (
    <button
      className={`template-registry-button${isActive ? ' is-active' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <img alt="" src={template.thumbnail} />
      <span>
        <strong>{template.code}</strong>
        <small>{template.name}</small>
        <em>{template.notes}</em>
      </span>
    </button>
  )
}

export function DashboardPage({
  authUser,
  createInvitation,
  formMessage,
  generateImage,
  generatedImages,
  imageMessage,
  invitations,
  isAdminSaving,
  isCreating,
  isDataLoading,
  isGeneratingImage,
  logout,
  onCreateManualPayment,
  onRegisterTemplate,
  paymentMessage,
  templateMessage,
  templates,
  source,
}: {
  authUser: AuthUser | null
  createInvitation: (input: CreateInvitationInput) => Promise<Invitation | null>
  formMessage: string
  generateImage: (input: AIImageInput) => Promise<AIImageResult | null>
  generatedImages: AIImageResult[]
  imageMessage: string
  invitations: Invitation[]
  isAdminSaving: boolean
  isCreating: boolean
  isDataLoading: boolean
  isGeneratingImage: boolean
  logout: () => void
  onCreateManualPayment: (input: ManualPaymentInput) => Promise<boolean>
  onRegisterTemplate: (input: TemplateAdminInput) => Promise<boolean>
  paymentMessage: string
  templateMessage: string
  templates: Template[]
  source: 'api' | 'fallback'
}) {
  const totalRSVP = invitations.reduce((sum, item) => sum + item.rsvpCount, 0)
  const firstTemplateSlug = templates[0]?.slug ?? 'adat-jawa'
  const [copiedSlug, setCopiedSlug] = useState('')
  const [createdLink, setCreatedLink] = useState('')
  const [form, setForm] = useState<CreateInvitationInput>({
    couple: '',
    eventDate: '',
    slug: '',
    templateSlug: firstTemplateSlug,
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const createdInvitation = await createInvitation({
      ...form,
      templateSlug: form.templateSlug || firstTemplateSlug,
    })
    if (createdInvitation) {
      setCreatedLink(invitationURL(createdInvitation.slug))
      setForm({
        couple: '',
        eventDate: '',
        slug: '',
        templateSlug: firstTemplateSlug,
      })
    }
  }

  async function copyInvitationLink(slug: string) {
    const link = invitationURL(slug)
    await navigator.clipboard?.writeText(link)
    trackEvent({
      eventName: 'share_click',
      invitationSlug: slug,
      properties: { surface: 'dashboard_copy_link' },
    })
    setCopiedSlug(slug)
    window.setTimeout(() => setCopiedSlug(''), 1600)
  }

  const dashboardPath = window.location.pathname
  const activeModule = getDashboardModule(dashboardPath)
  const moduleTitle = dashboardModules.find((item) => item.id === activeModule)?.label ?? 'Undangan Online'
  const totalPremium = invitations.filter((item) => item.status.toLowerCase() === 'published').length
  const totalFree = invitations.length - totalPremium
  const metrics = [
    { caption: 'Template premium aktif', icon: 'PR', label: 'Versi Premium', tone: 'info', value: totalPremium },
    { caption: 'Undangan free tersimpan', icon: 'FR', label: 'Versi Gratis', tone: 'success', value: totalFree },
    { caption: 'Semua undangan user', icon: 'UD', label: 'Total Undangan', tone: 'warning', value: invitations.length },
    { caption: 'Konfirmasi kehadiran', icon: 'RS', label: 'Total RSVP', tone: 'danger', value: totalRSVP },
  ]

  return (
    <main className="saas-dashboard adminlte-v3 min-screen">
      <DashboardSidebar activeModule={activeModule} authUser={authUser} />
      <section className="saas-main">
        <header className="saas-topbar">
          <div className="saas-topbar-title">
            <span>Dashboard</span>
            <h1>{moduleTitle}</h1>
          </div>
          <div className="topbar-actions">
            <a href="/builder-preview">Builder Engine</a>
            <a className="topbar-primary" href="/dashboard/undangan#buat-undangan">
              Buat Undangan Baru
            </a>
            <button className="topbar-logout" onClick={logout} type="button">Keluar</button>
          </div>
        </header>

        <section className="saas-content">
          <TierExpiryBanner />

          <div className="content-header">
            <div>
              <p className="data-source">
                {isDataLoading ? 'Memuat data...' : source === 'api' ? 'API production tersambung' : 'Mode fallback aktif'}
              </p>
              <h2>{moduleTitle}</h2>
            </div>
            <nav aria-label="Breadcrumb">
              <a href="/dashboard/undangan">Home</a>
              <span>/</span>
              <b>{moduleTitle}</b>
            </nav>
          </div>

          {activeModule === 'undangan' ? (
            <>
              <section className="metric-grid">
                {metrics.map((item) => (
                  <article className={`metric-card small-box ${item.tone}`} key={item.label}>
                    <div>
                      <strong>{item.value}</strong>
                      <p>{item.label}</p>
                      <span>{item.caption}</span>
                    </div>
                    <i aria-hidden="true">{item.icon}</i>
                  </article>
                ))}
              </section>

              <section className="upgrade-banner">
                <strong>% Potongan Harga Hari Ini</strong>
                <p>Upgrade premium, private event, RSVP, buku tamu, dan custom code.</p>
                <span>Rp.50.000</span>
              </section>

              <section className="form-card" id="buat-undangan">
                <div className="box-header">
                  <p className="eyebrow">Create invitation</p>
                  <h2>Buat undangan baru</h2>
                </div>
                <form className="invite-form" onSubmit={handleSubmit}>
                  <label>
                    Nama pasangan
                    <input
                      onChange={(event) => setForm({ ...form, couple: event.target.value })}
                      placeholder="Alika & Herman"
                      required
                      type="text"
                      value={form.couple}
                    />
                  </label>
                  <label>
                    Slug URL
                    <input
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                      placeholder="alika-herman"
                      required
                      type="text"
                      value={form.slug}
                    />
                  </label>
                  <label>
                    Tanggal acara
                    <input
                      onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
                      required
                      type="date"
                      value={form.eventDate}
                    />
                  </label>
                  <label>
                    Template
                    <select
                      onChange={(event) => setForm({ ...form, templateSlug: event.target.value })}
                      value={form.templateSlug || firstTemplateSlug}
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.slug}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button primary" disabled={isCreating} type="submit">
                    {isCreating ? 'Menyimpan...' : 'Simpan Undangan'}
                  </button>
                  {formMessage ? <p className="form-message">{formMessage}</p> : null}
                  {createdLink ? (
                    <p className="created-link">
                      Link undangan: <a href={createdLink}>{createdLink}</a>
                    </p>
                  ) : null}
                </form>
              </section>

              <section className="table-card">
                <div className="table-head">
                  <div>
                    <p className="eyebrow">Data table</p>
                    <h2>List Daftar Undanganmu</h2>
                  </div>
                  <div className="filter-pills">
                    {['All', 'Free', 'Premium', 'Custom Design', 'Trash'].map((item) => (
                      <button key={item} type="button">{item}</button>
                    ))}
                  </div>
                </div>
                <div className="invite-list">
                  {invitations.map((item) => (
                    <article className="invite-row" key={item.slug}>
                      <div>
                        <strong>{item.couple}</strong>
                        <span>/{item.slug}</span>
                      </div>
                      <p>{item.template}</p>
                      <b className="adminlte-badge">{item.rsvpCount} RSVP</b>
                      <div className="row-actions">
                        <a href={`/dashboard/edit/${item.slug}`}>Edit Konten</a>
                        <a href={`/u/${item.slug}`}>Preview</a>
                        <button type="button" onClick={() => void copyInvitationLink(item.slug)}>
                          {copiedSlug === item.slug ? 'Tersalin' : 'Salin Link'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {activeModule === 'builder' ? <BuilderEnginePanel /> : null}
          {activeModule === 'template' ? (
            <TemplateManagerPanel
              isSaving={isAdminSaving}
              onRegisterTemplate={onRegisterTemplate}
              templateMessage={templateMessage}
              templates={templates}
            />
          ) : null}
          {activeModule === 'media' ? (
            <AIAssetGenerator
              generatedImages={generatedImages}
              imageMessage={imageMessage}
              isGeneratingImage={isGeneratingImage}
              onGenerate={generateImage}
            />
          ) : null}
          {activeModule === 'transaksi' ? <TransactionsPanel /> : null}
          {activeModule === 'report' ? <ReportPanel /> : null}
          {activeModule === 'visitor' ? <RealtimeVisitorPanel /> : null}
          {activeModule === 'reseller' ? <ResellerPanel /> : null}
          {activeModule === 'langganan' ? (
            <SubscriptionPanel
              authUser={authUser}
              isSaving={isAdminSaving}
              onCreateManualPayment={onCreateManualPayment}
              paymentMessage={paymentMessage}
            />
          ) : null}
          {activeModule === 'voucher' ? <VoucherPanel /> : null}
          {activeModule === 'pengaturan' ? <SettingsPanel /> : null}
        </section>
      </section>
    </main>
  )
}

const dashboardModules = [
  { group: 'Main Navigation', id: 'undangan', label: 'Dashboard Undangan', href: '/dashboard/undangan', icon: 'DU', badge: 'Live' },
  { group: 'Main Navigation', id: 'builder', label: 'Builder Engine', href: '/dashboard/builder', icon: 'BE' },
  { group: 'Main Navigation', id: 'template', label: 'Template Catalog', href: '/dashboard/template', icon: 'TC' },
  { group: 'Assets', id: 'media', label: 'Media Manager', href: '/dashboard/media', icon: 'MM' },
  { group: 'Admin', id: 'transaksi', label: 'Order & Transaksi', href: '/dashboard/transaksi', icon: 'OT' },
  { group: 'Admin', id: 'report', label: 'Report', href: '/dashboard/report', icon: 'RP' },
  { group: 'Admin', id: 'visitor', label: 'Realtime Visitor', href: '/dashboard/visitor', icon: 'RV' },
  { group: 'Business', id: 'reseller', label: 'Reseller & Mitra', href: '/dashboard/reseller', icon: 'RM' },
  { group: 'Business', id: 'langganan', label: 'Langganan', href: '/dashboard/langganan', icon: 'LG' },
  { group: 'Business', id: 'voucher', label: 'Gunakan Voucher', href: '/dashboard/voucher', icon: 'VC' },
  { group: 'System', id: 'pengaturan', label: 'Pengaturan', href: '/dashboard/pengaturan', icon: 'PG' },
]

const dashboardModuleGroups = ['Main Navigation', 'Assets', 'Admin', 'Business', 'System']

function getDashboardModule(pathname: string) {
  const module = pathname.split('/').filter(Boolean)[1]
  return dashboardModules.some((item) => item.id === module) ? module : 'undangan'
}

function DashboardSidebar({
  activeModule,
  authUser,
}: {
  activeModule: string
  authUser: AuthUser | null
}) {
  const displayName = authUser?.displayName || authUser?.email || 'User'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

  return (
    <aside className="saas-sidebar">
      <a className="sidebar-brand brand-link" href="/">
        <span className="brand-image">U</span>
        <b>undang</b>
        <em>panel</em>
      </a>
      <div className="sidebar-user user-panel">
        <div className="avatar">{initials}</div>
        <div>
          <strong>{displayName}</strong>
          <p><span /> Online</p>
          <small>{authUser?.role === 'admin' ? 'SUPERADMIN' : 'USER'} - {(authUser?.tier ?? 'free').toUpperCase()}</small>
        </div>
      </div>
      <nav className="sidebar-menu">
        {dashboardModuleGroups.map((group) => (
          <div className="nav-treeview" key={group}>
            <p>{group}</p>
            {dashboardModules
              .filter((item) => item.group === group)
              .map((item) => (
                <a className={activeModule === item.id ? 'active' : ''} href={item.href} key={item.id}>
                  <span className="nav-icon">{item.icon}</span>
                  <strong>{item.label}</strong>
                  {item.badge ? <small>{item.badge}</small> : null}
                </a>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

function BuilderEnginePanel() {
  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Flow builder</p>
        <h2>Mesin template siap dipakai user</h2>
        <p>
          Registry memilih template, data undangan mengisi JSON, lalu preview
          tampil di iframe. Tahap berikutnya tinggal menyambungkan form section
          ke schema masing-masing template.
        </p>
        <div className="builder-flow-list">
          {['Pilih template', 'Isi konten', 'Preview mobile', 'Publish link'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="module-actions">
          <a className="button primary" href="/builder-preview">Buka Preview Engine</a>
          <a className="button secondary" href="/dashboard/template">Kelola Template</a>
        </div>
      </article>
      {templateRegistry.map((template) => (
        <article className="template-mini-card" key={template.id}>
          <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
          <strong>{template.code}</strong>
          <span>{template.name}</span>
          <small>{template.plan.toUpperCase()}</small>
        </article>
      ))}
    </section>
  )
}

function TemplateManagerPanel({
  isSaving,
  onRegisterTemplate,
  templateMessage,
  templates,
}: {
  isSaving: boolean
  onRegisterTemplate: (input: TemplateAdminInput) => Promise<boolean>
  templateMessage: string
  templates: Template[]
}) {
  const [form, setForm] = useState<TemplateAdminInput>({
    assetsUrl: '/template-assets/',
    category: 'wedding',
    configSchema: {
      properties: {
        couple: { minLength: 1, type: 'string' },
        eventDate: { format: 'date', type: 'string' },
      },
      required: ['couple', 'eventDate'],
      type: 'object',
    },
    isActive: true,
    name: '',
    previewUrl: '/preview/',
    slug: '',
    tierAccess: ['creator', 'pro', 'business'],
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await onRegisterTemplate(form)
    if (ok) {
      setForm((current) => ({ ...current, name: '', slug: '' }))
    }
  }

  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Template catalog</p>
        <h2>Register template baru</h2>
        <p>
          Template masih memakai folder lokal di `public/template-assets`, lalu
          didaftarkan ke database agar builder bisa mengambil registry dari API.
        </p>
        <form className="invite-form template-admin-form" onSubmit={handleSubmit}>
          <label>
            Nama template
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Adat Jawa Klasik 050"
              required
              value={form.name}
            />
          </label>
          <label>
            Slug
            <input
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="adat-jawa-klasik-050"
              required
              value={form.slug}
            />
          </label>
          <label>
            Kategori
            <input
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              value={form.category}
            />
          </label>
          <label>
            Tier access
            <input
              onChange={(event) => setForm({ ...form, tierAccess: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
              value={form.tierAccess.join(', ')}
            />
          </label>
          <label>
            Assets URL
            <input
              onChange={(event) => setForm({ ...form, assetsUrl: event.target.value })}
              value={form.assetsUrl}
            />
          </label>
          <label>
            Preview URL
            <input
              onChange={(event) => setForm({ ...form, previewUrl: event.target.value })}
              value={form.previewUrl}
            />
          </label>
          <button className="button primary" disabled={isSaving} type="submit">
            {isSaving ? 'Menyimpan...' : 'Register Template'}
          </button>
          {templateMessage ? <p className="form-message">{templateMessage}</p> : null}
        </form>
      </article>
      {templates.map((template) => (
        <article className="template-mini-card" key={template.id}>
          <MockupPhoneFrame alt={template.name} src={templateRegistry.find((item) => item.publicPath === template.assetsUrl)?.thumbnail ?? templateRegistry[0].thumbnail} />
          <strong>{template.slug}</strong>
          <span>{template.category} - {(template.tierAccess ?? ['free']).join(', ')}</span>
          <a href={template.previewUrl || '/builder-preview'}>Preview</a>
        </article>
      ))}
    </section>
  )
}

function TransactionsPanel() {
  return <PlaceholderModule title="Riwayat Transaksi" description="Invoice, status pembayaran, upgrade premium, dan voucher order akan ditampilkan di sini." fields={['Kode Transaksi', 'Status', 'Bayar Sebelum', 'Dibuat Pada']} />
}

function ReportPanel() {
  return <PlaceholderModule title="Report" description="Grafik pengunjung harian, undangan populer, RSVP masuk, dan export laporan." fields={['Pengunjung 30 hari', 'Pengunjung unik', 'Total RSVP', 'Konversi share']} />
}

function RealtimeVisitorPanel() {
  return <PlaceholderModule title="Realtime Visitor" description="Nanti memakai websocket/SSE milik kita sendiri untuk melihat tamu yang sedang membuka undangan." fields={['Guest', 'Page', 'Visited At', 'Device']} />
}

function ResellerPanel() {
  return <PlaceholderModule title="Reseller | Mitra" description="Label reseller, akses client, katalog reseller, dan komisi bisa masuk setelah builder stabil." fields={['Label Brand', 'Client Access', 'Custom Domain', 'Margin']} />
}

function SubscriptionPanel({
  authUser,
  isSaving,
  onCreateManualPayment,
  paymentMessage,
}: {
  authUser: AuthUser | null
  isSaving: boolean
  onCreateManualPayment: (input: ManualPaymentInput) => Promise<boolean>
  paymentMessage: string
}) {
  const [form, setForm] = useState<ManualPaymentInput>({
    amountIdr: 39000,
    providerOrderId: '',
    tier: 'creator',
    userId: authUser?.id ?? '',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreateManualPayment(form)
  }

  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Langganan</p>
        <h2>Aktivasi payment manual</h2>
        <p>
          Jalur ini untuk admin: catat pembayaran manual, update tier user, dan
          isi masa aktif. Payment gateway bisa ditambahkan setelah flow ini stabil.
        </p>
        <form className="invite-form" onSubmit={handleSubmit}>
          <label>
            User ID
            <input
              onChange={(event) => setForm({ ...form, userId: event.target.value })}
              required
              value={form.userId}
            />
          </label>
          <label>
            Paket
            <select
              onChange={(event) => {
                const tier = event.target.value
                setForm({
                  ...form,
                  amountIdr: tier === 'business' ? 199000 : tier === 'pro' ? 79000 : 39000,
                  tier,
                })
              }}
              value={form.tier}
            >
              <option value="creator">Creator - Rp39.000</option>
              <option value="pro">Pro - Rp79.000</option>
              <option value="business">Business - Rp199.000</option>
            </select>
          </label>
          <label>
            Nominal
            <input
              min="0"
              onChange={(event) => setForm({ ...form, amountIdr: Number(event.target.value) })}
              type="number"
              value={form.amountIdr}
            />
          </label>
          <label>
            Order ID
            <input
              onChange={(event) => setForm({ ...form, providerOrderId: event.target.value })}
              placeholder="Kosongkan untuk auto"
              value={form.providerOrderId}
            />
          </label>
          <button className="button primary" disabled={isSaving} type="submit">
            {isSaving ? 'Memproses...' : 'Aktifkan Manual'}
          </button>
          {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
        </form>
      </article>
      {[
        ['Free', 'Rp0', 'Watermark, gallery 3, RSVP 50'],
        ['Creator', 'Rp39.000', 'Tanpa watermark, gallery 15, RSVP 300'],
        ['Pro', 'Rp79.000', 'Custom domain, dynamic OG, analytics full'],
        ['Business', 'Rp199.000/bln', 'White label, API, bulk create'],
      ].map(([name, price, desc]) => (
        <article className="module-card" key={name}>
          <p className="eyebrow">{name}</p>
          <h2>{price}</h2>
          <p>{desc}</p>
        </article>
      ))}
    </section>
  )
}

function VoucherPanel() {
  return (
    <section className="form-card compact-module">
      <p className="eyebrow">Voucher</p>
      <h2>Tukar Voucher</h2>
      <form className="invite-form">
        <label className="wide-field">
          Kode voucher
          <input placeholder="Masukkan kode voucher" type="text" />
        </label>
        <button className="button primary" type="button">Gunakan</button>
      </form>
    </section>
  )
}

function SettingsPanel() {
  return <PlaceholderModule title="Pengaturan" description="Profil, password, notifikasi, bahasa dashboard, dan preferensi reseller." fields={['Nama', 'No HP', 'Email', 'Password']} />
}

function PlaceholderModule({
  description,
  fields,
  title,
}: {
  description: string
  fields: string[]
  title: string
}) {
  return (
    <section className="module-card">
      <p className="eyebrow">Skeleton module</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="placeholder-table">
        {fields.map((field) => (
          <span key={field}>{field}</span>
        ))}
      </div>
    </section>
  )
}

function AIAssetGenerator({
  generatedImages,
  imageMessage,
  isGeneratingImage,
  onGenerate,
}: {
  generatedImages: AIImageResult[]
  imageMessage: string
  isGeneratingImage: boolean
  onGenerate: (input: AIImageInput) => Promise<AIImageResult | null>
}) {
  const [form, setForm] = useState<AIImageInput>({
    prompt: 'Ilustrasi pasangan pengantin adat Jawa klasik, nuansa krem emas, elegan, detail ornamen batik, komposisi simetris',
    size: '1024x1024',
    style: 'premium wedding invitation asset, soft lighting, refined, no text, original artwork',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onGenerate(form)
  }

  return (
    <section className="form-card ai-generator-card">
      <div className="ai-generator-heading">
        <div>
          <p className="eyebrow">AI asset studio</p>
          <h2>Generate foto & ornamen template</h2>
        </div>
        <span>NVIDIA/Google/OpenAI</span>
      </div>

      <form className="ai-generator-form" onSubmit={handleSubmit}>
        <label className="wide-field">
          Prompt utama
          <textarea
            onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            placeholder="Contoh: ornamen batik Jawa emas untuk undangan digital"
            required
            rows={4}
            value={form.prompt}
          />
        </label>
        <label>
          Gaya
          <input
            onChange={(event) => setForm({ ...form, style: event.target.value })}
            placeholder="No text, premium, soft lighting"
            type="text"
            value={form.style}
          />
        </label>
        <label>
          Ukuran
          <select
            onChange={(event) => setForm({ ...form, size: event.target.value })}
            value={form.size}
          >
            <option value="1024x1024">1024 x 1024</option>
            <option value="1024x1536">1024 x 1536</option>
            <option value="1536x1024">1536 x 1024</option>
          </select>
        </label>
        <button className="button primary" disabled={isGeneratingImage} type="submit">
          {isGeneratingImage ? 'Membuat gambar...' : 'Generate Asset'}
        </button>
        {imageMessage ? <p className="form-message">{imageMessage}</p> : null}
      </form>

      <div className="ai-result-grid">
        {generatedImages.length === 0 ? (
          <p className="empty-state">
            Hasil generate akan muncul di sini dan file-nya tersimpan di storage VPS.
          </p>
        ) : (
          generatedImages.map((image) => (
            <article className="ai-result-card" key={image.fileName}>
              <img alt={image.prompt} src={apiURL(image.url)} />
              <div>
                <strong>{image.fileName}</strong>
                <a href={apiURL(image.url)} target="_blank" rel="noreferrer">
                  Buka asset
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function EditorPage({
  editorMessage,
  invitation,
  isPublishing,
  isUpdating,
  loadRSVPs,
  publishInvitation,
  publishMessage,
  rsvps,
  updateInvitation,
}: {
  editorMessage: string
  invitation: Invitation
  isPublishing: boolean
  isUpdating: boolean
  loadRSVPs: (slug: string) => Promise<void>
  publishInvitation: (slug: string, input: PublishInvitationInput) => Promise<boolean>
  publishMessage: string
  rsvps: RSVP[]
  updateInvitation: (slug: string, input: UpdateInvitationInput) => Promise<boolean>
}) {
  const [form, setForm] = useState<UpdateInvitationInput>({
    couple: invitation.couple,
    eventDate: invitation.eventDate,
    status: invitation.status.toLowerCase(),
    title: invitation.title || invitation.couple,
    config: {
      akadTime: invitation.config?.akadTime ?? '',
      audioUrl: invitation.config?.audioUrl ?? '',
      bride: invitation.config?.bride ?? '',
      coverImage: invitation.config?.coverImage ?? '',
      gallery: invitation.config?.gallery ?? [],
      giftAccount: invitation.config?.giftAccount ?? '',
      giftBank: invitation.config?.giftBank ?? '',
      groom: invitation.config?.groom ?? '',
      mapsUrl: invitation.config?.mapsUrl ?? '',
      openingText: invitation.config?.openingText ?? '',
      receptionTime: invitation.config?.receptionTime ?? '',
      venue: invitation.config?.venue ?? '',
      venueAddress: invitation.config?.venueAddress ?? '',
    },
  })
  const [publishForm, setPublishForm] = useState<PublishInvitationInput>({
    customDomain: '',
    dynamicOg: false,
    galleryCount: invitation.config?.gallery?.length ?? 0,
    removeWatermark: !(invitation.watermark ?? true),
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await updateInvitation(invitation.slug, form)
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await publishInvitation(invitation.slug, {
      ...publishForm,
      galleryCount: form.config?.gallery?.length ?? publishForm.galleryCount,
    })
  }

  function updateConfig(key: keyof InvitationConfig, value: string | string[]) {
    setForm((current) => ({
      ...current,
      config: {
        ...(current.config ?? {}),
        [key]: value,
      },
    }))
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRSVPs(invitation.slug)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [invitation.slug, loadRSVPs])

  return (
    <main className="dashboard min-screen">
      <section className="page-shell">
        <header className="dashboard-hero">
          <div>
            <a href="/dashboard">CintaBuku.</a>
            <h1>Edit Undangan</h1>
            <p>Ubah data inti sebelum masuk ke builder section yang lebih lengkap.</p>
          </div>
          <a className="button gold" href={`/u/${invitation.slug}`}>
            Preview
          </a>
        </header>

        <section className="form-card editor-card">
          <div>
            <p className="eyebrow">/{invitation.slug}</p>
            <h2>{invitation.couple}</h2>
          </div>
          <form className="invite-form editor-form" onSubmit={handleSubmit}>
            <label>
              Judul undangan
              <input
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                type="text"
                value={form.title ?? ''}
              />
            </label>
            <label>
              Nama pasangan
              <input
                onChange={(event) => setForm({ ...form, couple: event.target.value })}
                required
                type="text"
                value={form.couple}
              />
            </label>
            <label>
              Tanggal acara
              <input
                onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
                required
                type="date"
                value={form.eventDate}
              />
            </label>
            <label>
              Status
              <select
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                value={form.status}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Nama mempelai wanita
              <input
                onChange={(event) => updateConfig('bride', event.target.value)}
                placeholder="Alyssa Kirana"
                type="text"
                value={form.config?.bride ?? ''}
              />
            </label>
            <label>
              Nama mempelai pria
              <input
                onChange={(event) => updateConfig('groom', event.target.value)}
                placeholder="Rayhan Pradipta"
                type="text"
                value={form.config?.groom ?? ''}
              />
            </label>
            <label>
              Jam akad
              <input
                onChange={(event) => updateConfig('akadTime', event.target.value)}
                placeholder="08.00 WIB"
                type="text"
                value={form.config?.akadTime ?? ''}
              />
            </label>
            <label>
              Jam resepsi
              <input
                onChange={(event) => updateConfig('receptionTime', event.target.value)}
                placeholder="11.00 WIB"
                type="text"
                value={form.config?.receptionTime ?? ''}
              />
            </label>
            <label className="wide-field">
              Teks pembuka
              <textarea
                onChange={(event) => updateConfig('openingText', event.target.value)}
                placeholder="Dengan memohon rahmat Allah SWT..."
                rows={3}
                value={form.config?.openingText ?? ''}
              />
            </label>
            <label>
              Venue
              <input
                onChange={(event) => updateConfig('venue', event.target.value)}
                placeholder="Pendopo Agung"
                type="text"
                value={form.config?.venue ?? ''}
              />
            </label>
            <label>
              Link Google Maps
              <input
                onChange={(event) => updateConfig('mapsUrl', event.target.value)}
                placeholder="https://maps.google.com/..."
                type="url"
                value={form.config?.mapsUrl ?? ''}
              />
            </label>
            <label className="wide-field">
              Alamat
              <textarea
                onChange={(event) => updateConfig('venueAddress', event.target.value)}
                placeholder="Alamat lengkap lokasi acara"
                rows={3}
                value={form.config?.venueAddress ?? ''}
              />
            </label>
            <label>
              Cover image URL
              <input
                onChange={(event) => updateConfig('coverImage', event.target.value)}
                placeholder="/api/uploads/images/..."
                type="text"
                value={form.config?.coverImage ?? ''}
              />
            </label>
            <label>
              Audio URL
              <input
                onChange={(event) => updateConfig('audioUrl', event.target.value)}
                placeholder="/template-assets/.../gending.mp3"
                type="text"
                value={form.config?.audioUrl ?? ''}
              />
            </label>
            <label>
              Bank hadiah
              <input
                onChange={(event) => updateConfig('giftBank', event.target.value)}
                placeholder="BCA"
                type="text"
                value={form.config?.giftBank ?? ''}
              />
            </label>
            <label>
              Nomor rekening
              <input
                onChange={(event) => updateConfig('giftAccount', event.target.value)}
                placeholder="123456789"
                type="text"
                value={form.config?.giftAccount ?? ''}
              />
            </label>
            <label className="wide-field">
              Gallery URLs
              <textarea
                onChange={(event) => updateConfig('gallery', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
                placeholder="Satu URL gambar per baris"
                rows={4}
                value={(form.config?.gallery ?? []).join('\n')}
              />
            </label>
            <button className="button primary" disabled={isUpdating} type="submit">
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {editorMessage ? <p className="form-message">{editorMessage}</p> : null}
          </form>
        </section>

        <section className="form-card editor-card">
          <div>
            <p className="eyebrow">Publish</p>
            <h2>Validasi paket dan bagikan link</h2>
          </div>
          <form className="invite-form editor-form" onSubmit={handlePublish}>
            <label>
              Custom domain
              <input
                onChange={(event) => setPublishForm({ ...publishForm, customDomain: event.target.value })}
                placeholder="undangan.domainkamu.com"
                type="text"
                value={publishForm.customDomain}
              />
            </label>
            <label>
              Hapus watermark
              <select
                onChange={(event) => setPublishForm({ ...publishForm, removeWatermark: event.target.value === 'yes' })}
                value={publishForm.removeWatermark ? 'yes' : 'no'}
              >
                <option value="no">Tidak</option>
                <option value="yes">Ya</option>
              </select>
            </label>
            <label>
              Dynamic OG
              <select
                onChange={(event) => setPublishForm({ ...publishForm, dynamicOg: event.target.value === 'yes' })}
                value={publishForm.dynamicOg ? 'yes' : 'no'}
              >
                <option value="no">Tidak</option>
                <option value="yes">Ya</option>
              </select>
            </label>
            <button className="button primary" disabled={isPublishing} type="submit">
              {isPublishing ? 'Publish...' : 'Publish Undangan'}
            </button>
            {publishMessage ? <p className="form-message">{publishMessage}</p> : null}
          </form>
        </section>

        <section className="table-card">
          <div className="table-head">
            <h2>RSVP masuk</h2>
            <span>{rsvps.length} respon</span>
          </div>
          <div className="rsvp-list">
            {rsvps.length === 0 ? (
              <p className="empty-state">Belum ada RSVP untuk undangan ini.</p>
            ) : (
              rsvps.map((item) => (
                <article className="rsvp-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{readableStatus(item.status)} - {item.guests} tamu</span>
                  </div>
                  <p>{item.message || 'Tanpa ucapan'}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function PublicInvitationPage({
  invitation,
  isSubmittingRSVP,
  rsvpMessage,
  submitRSVP,
}: {
  invitation: Invitation
  isSubmittingRSVP: boolean
  rsvpMessage: string
  submitRSVP: (slug: string, input: RSVPInput) => Promise<boolean>
}) {
  const eventDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(invitation.eventDate))
  const config = invitation.config ?? {}
  const guestName = new URLSearchParams(window.location.search).get('to')?.trim() || 'Bapak/Ibu/Saudara/i'
  const brideName = config.bride || 'Cikita'
  const groomName = config.groom || 'Joko Suhanto'
  const venueName = config.venue || 'Gedung Serbaguna Darussunnah'
  const venueAddress = config.venueAddress || 'Detail lokasi dan maps akan tersambung ke editor.'
  const mapsUrl = config.mapsUrl || 'https://maps.google.com'
  const galleryImages = config.gallery && config.gallery.length > 0
    ? config.gallery
    : [1, 2, 3, 4, 5].map((item) => `/assets/templates/adat-jawa/generated/gallery-${item}.webp`)
  const [form, setForm] = useState<RSVPInput>({
    guests: 1,
    message: '',
    name: '',
    status: 'attending',
  })
  const [musicOn, setMusicOn] = useState(false)
  const gate = useTierGate()
  const showWatermark = invitation.watermark ?? gate.shouldShowWatermark

  useEffect(() => {
    const title = `${invitation.title || invitation.couple} untuk ${guestName}`
    const description = `Undangan ${invitation.couple}, ${eventDate} di ${venueName}`
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:image', apiURL(`/api/v1/og/${invitation.slug}.svg`))
    trackEvent({
      eventName: 'page_view',
      invitationSlug: invitation.slug,
      properties: {
        guest: guestName,
        template: invitation.templateSlug ?? '',
      },
    })
  }, [eventDate, guestName, invitation.couple, invitation.slug, invitation.templateSlug, invitation.title, venueName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await submitRSVP(invitation.slug, form)
    if (ok) {
      setForm({
        guests: 1,
        message: '',
        name: '',
        status: 'attending',
      })
    }
  }

  if (invitation.templateSlug === 'klasik-hijau-emas') {
    return (
      <main className="classic-green-theme min-screen">
        <section className="classic-hero">
          <div className="classic-frame">
            <p className="eyebrow">Walimatul Urs</p>
            <h1>{invitation.couple}</h1>
            <span>{eventDate}</span>
            <div className="classic-divider" />
            <p>Dengan hormat kami mengundang Bapak/Ibu/Saudara/i untuk hadir.</p>
            <a className="button gold" href="#rsvp">
              Buka Undangan
            </a>
          </div>
        </section>

        <section className="classic-content">
          <article className="classic-card">
            <span>Menuju Hari Bahagia</span>
            <div className="countdown-row">
              {['Hari', 'Jam', 'Menit', 'Detik'].map((label, index) => (
                <b key={label}>
                  {index === 0 ? '28' : '00'}
                  <small>{label}</small>
                </b>
              ))}
            </div>
          </article>
          <article className="classic-card">
            <span>Akad & Resepsi</span>
            <h2>Sabtu, {eventDate}</h2>
            <p>Detail venue, maps, dan susunan acara siap dihubungkan ke editor.</p>
          </article>
          <PublicRSVPForm
            form={form}
            isSubmittingRSVP={isSubmittingRSVP}
            onChange={setForm}
            onSubmit={handleSubmit}
            rsvpMessage={rsvpMessage}
          />
        </section>
        <TierWatermark visible={showWatermark} />
        <InviteBottomNav />
      </main>
    )
  }

  return (
    <main className="clone-invite-shell">
      <button
        aria-label={musicOn ? 'Matikan musik' : 'Nyalakan musik'}
        className={`music-toggle ${musicOn ? 'is-playing' : ''}`}
        onClick={() => setMusicOn((current) => !current)}
        type="button"
      >
        {musicOn ? '||' : '♪'}
      </button>
      {config.audioUrl ? <audio autoPlay={musicOn} loop src={config.audioUrl} /> : null}

      <section className="clone-cover min-screen" id="cover">
        <div className="cover-panel cover-panel-left" />
        <div className="cover-panel cover-panel-right" />
        <div className="clone-cover-card">
          <img
            alt="Ornamen gunungan Jawa"
            className="gunungan-mark"
            src="/assets/templates/adat-jawa/generated/gunungan.webp"
          />
          <p className="clone-kicker">The Wedding Of</p>
          <h1>{invitation.couple}</h1>
          <span>Sabtu, {eventDate}</span>
          <div className="clone-recipient">
            <small>Kepada Yth.</small>
            <strong>{guestName}</strong>
          </div>
          <a className="clone-open-button" href="#detail-acara">
            Buka Undangan
          </a>
        </div>
      </section>

      <section className="clone-page">
        <div className="clone-photo-card">
          <img
            alt={`Ilustrasi mempelai ${invitation.couple}`}
            className="clone-photo"
            src="/assets/templates/adat-jawa/generated/couple-portrait.webp"
          />
          <p className="clone-kicker">Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
          <h2>{invitation.couple}</h2>
          <p>{config.openingText || 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.'}</p>
        </div>

        <div className="couple-grid" id="mempelai">
          <article>
            <span>Mempelai Pria</span>
            <h2>{groomName}</h2>
            <p>Putra dari Bapak dan Ibu keluarga besar mempelai pria.</p>
          </article>
          <article>
            <span>Mempelai Wanita</span>
            <h2>{brideName}</h2>
            <p>Putri dari Bapak dan Ibu keluarga besar mempelai wanita.</p>
          </article>
        </div>

        <div className="clone-countdown">
          {['Hari', 'Jam', 'Menit', 'Detik'].map((label, index) => (
            <b key={label}>
              {index === 0 ? '28' : '00'}
              <small>{label}</small>
            </b>
          ))}
        </div>

        <div className="clone-frame" id="detail-acara">
          <span>Akad Nikah</span>
          <h2>Sabtu, {eventDate}</h2>
          <p>{config.akadTime || '08.00 WIB'} sampai selesai</p>
        </div>

        <div className="clone-frame">
          <span>Resepsi</span>
          <h2>{venueName}</h2>
          <p>{config.receptionTime || '11.00 WIB'} - {venueAddress}</p>
        </div>

        <div className="map-card" id="lokasi">
          <span>Lokasi</span>
          <h2>Petunjuk Arah</h2>
          <div className="map-placeholder">
            <img alt="Ilustrasi peta lokasi acara" src="/assets/templates/adat-jawa/generated/map-illustration.webp" />
          </div>
          <a className="clone-open-button" href={mapsUrl} rel="noreferrer" target="_blank">
            Buka Google Maps
          </a>
        </div>

        <div className="clone-gallery" id="galeri">
          {galleryImages.map((image, index) => (
            <div key={image}>
              <img
                alt={`Galeri pernikahan ${index + 1}`}
                src={image}
              />
            </div>
          ))}
        </div>

        <div className="story-timeline" id="cerita">
          {[
            ['Awal Bertemu', 'Pertemuan sederhana yang menjadi awal cerita panjang.'],
            ['Lamaran', 'Keluarga besar dipertemukan dalam suasana hangat dan penuh doa.'],
            ['Hari Bahagia', 'Dengan izin Allah, kami melangkah menuju ibadah pernikahan.'],
          ].map(([title, text]) => (
            <article key={title}>
              <span>
                <img alt="" src="/assets/templates/adat-jawa/story-icon.svg" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>

        <PublicRSVPForm
          form={form}
          isSubmittingRSVP={isSubmittingRSVP}
          onChange={setForm}
          onSubmit={handleSubmit}
          rsvpMessage={rsvpMessage}
        />

        <div className="guestbook-card">
          <span>Ucapan & Doa</span>
          <h2>Buku Tamu</h2>
          <article>
            <strong>Keluarga Besar</strong>
            <p>Semoga menjadi keluarga sakinah, mawaddah, warahmah.</p>
          </article>
          <article>
            <strong>Sahabat</strong>
            <p>Selamat menempuh hidup baru, semoga bahagia selalu.</p>
          </article>
        </div>

        <div className="gift-card" id="gift">
          <span>Amplop Digital</span>
          <h2>Tanda Kasih</h2>
          <img
            alt="Ilustrasi amplop digital"
            className="gift-illustration"
            src="/assets/templates/adat-jawa/generated/gift-envelope.webp"
          />
          <p>{config.giftBank && config.giftAccount ? `${config.giftBank} - ${config.giftAccount}` : 'Fitur rekening, QR, dan kado fisik akan tersambung ke editor paket premium.'}</p>
          <button className="clone-open-button" type="button">Salin Rekening</button>
        </div>

        <div className="closing-card">
          <p>
            Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan
            hadir dan memberikan doa restu.
          </p>
          <h2>{invitation.couple}</h2>
        </div>

        <TierWatermark className="credit" visible={showWatermark} />
      </section>
      <InviteBottomNav />
    </main>
  )
}

function PublicRSVPForm({
  form,
  isSubmittingRSVP,
  onChange,
  onSubmit,
  rsvpMessage,
}: {
  form: RSVPInput
  isSubmittingRSVP: boolean
  onChange: (form: RSVPInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  rsvpMessage: string
}) {
  return (
    <form className="rsvp-form" id="rsvp" onSubmit={onSubmit}>
      <h2>Konfirmasi Kehadiran</h2>
      <label>
        Nama
        <input
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Nama Anda"
          required
          type="text"
          value={form.name}
        />
      </label>
      <label>
        Kehadiran
        <select
          onChange={(event) => onChange({ ...form, status: event.target.value })}
          value={form.status}
        >
          <option value="attending">Hadir</option>
          <option value="declined">Tidak hadir</option>
        </select>
      </label>
      <label>
        Jumlah tamu
        <input
          max="10"
          min="1"
          onChange={(event) => onChange({ ...form, guests: Number(event.target.value) })}
          type="number"
          value={form.guests}
        />
      </label>
      <label className="wide-field">
        Ucapan
        <textarea
          onChange={(event) => onChange({ ...form, message: event.target.value })}
          placeholder="Tulis ucapan singkat"
          rows={4}
          value={form.message}
        />
      </label>
      <button className="button primary" disabled={isSubmittingRSVP} type="submit">
        {isSubmittingRSVP ? 'Mengirim...' : 'Kirim RSVP'}
      </button>
      {rsvpMessage ? <p className="form-message">{rsvpMessage}</p> : null}
    </form>
  )
}

function InviteBottomNav() {
  return (
    <nav className="invite-bottom-nav">
      <a href="#cover">Cover</a>
      <a href="#mempelai">Mempelai</a>
      <a href="#detail-acara">Acara</a>
      <a href="#galeri">Galeri</a>
      <a href="#rsvp">RSVP</a>
    </nav>
  )
}

function Nav() {
  return (
    <nav className="nav page-shell">
      <a className="brand" href="/">
        undanganku
      </a>
      <div className="nav-links">
        <a href="/templates">Template</a>
        <a href="/builder-preview">Builder Engine</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/u/joko-cikita">Demo Undangan</a>
      </div>
      <a className="button nav-button" href="/dashboard">
        Mulai SaaS
      </a>
    </nav>
  )
}

function invitationURL(slug: string) {
  return `${window.location.origin}/u/${slug}`
}

export default App
