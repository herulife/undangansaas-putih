import { invitationURL } from '../../app/format'
import type { AIImageInput, AIImageResult, AuthUser, CreateInvitationInput, Invitation, ManualProofInput, MidtransPaymentInput, MidtransPaymentResult, Template, TemplateAdminInput, VoucherValidateResult } from '../../app/types'
import { AIAssetGenerator } from '../../components/AIAssetGenerator'
import { DashboardIcon, Sparkline } from '../../components/dashboard-icons'
import { EmailVerificationBanner } from '../AuthPages'
import { BuilderEnginePanel } from './BuilderEnginePanel'
import { CheckInPanel } from './CheckInPanel'
import { DashboardSidebar } from './DashboardSidebar'
import { DomainPanel } from './DomainPanel'
import { GuestPanel } from './GuestPanel'
import { RealtimeVisitorPanel, ReportPanel, ResellerPanel, SettingsPanel, TransactionsPanel } from './SimplePanels'
import { SubscriptionPanel, VoucherPanel } from './SubscriptionPanel'
import { TemplateManagerPanel } from './TemplateManagerPanel'
import { MediaLibraryPanel } from './MediaLibraryPanel'
import { getDashboardModule } from './dashboardModules'
import { trackEvent } from '../../analytics'
import { TierExpiryBanner } from '../../tierGate'
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

export function DashboardPage({
  authUser,
  checkSlugAvailable,
  createInvitation,
  duplicateInvitation,
  formMessage,
  generateImage,
  generatedImages,
  imageMessage,
  invitations,
  isAdminSaving,
  isCreating,
  isDataLoading,
  isGeneratingImage,
  loadTrash,
  logout,
  onCreateMidtransPayment,
  onRegisterTemplate,
  onSubmitManualProof,
  onUploadProof,
  onValidateVoucher,
  paymentMessage,
  restoreInvitation,
  templateMessage,
  templates,
  source,
  trashInvitation,
  trashedInvitations,
}: {
  authUser: AuthUser | null
  checkSlugAvailable: (slug: string) => Promise<boolean | null>
  createInvitation: (input: CreateInvitationInput) => Promise<Invitation | null>
  duplicateInvitation: (slug: string) => Promise<Invitation | null>
  formMessage: string
  generateImage: (input: AIImageInput) => Promise<AIImageResult | null>
  generatedImages: AIImageResult[]
  imageMessage: string
  invitations: Invitation[]
  isAdminSaving: boolean
  isCreating: boolean
  isDataLoading: boolean
  isGeneratingImage: boolean
  loadTrash: () => Promise<void>
  logout: () => void
  onCreateMidtransPayment: (input: MidtransPaymentInput) => Promise<MidtransPaymentResult | null>
  onRegisterTemplate: (input: TemplateAdminInput) => Promise<boolean>
  onSubmitManualProof: (input: ManualProofInput) => Promise<boolean>
  onUploadProof: (file: File) => Promise<string | null>
  onValidateVoucher: (code: string, amountIdr: number) => Promise<VoucherValidateResult | null>
  paymentMessage: string
  restoreInvitation: (slug: string) => Promise<boolean>
  templateMessage: string
  templates: Template[]
  source: 'api' | 'error'
  trashInvitation: (slug: string) => Promise<boolean>
  trashedInvitations: Invitation[]
}) {
  const totalRSVP = invitations.reduce((sum, item) => sum + item.rsvpCount, 0)
  const firstTemplateSlug = templates[0]?.slug ?? 'adat-jawa'
  const [copiedSlug, setCopiedSlug] = useState('')
  const [createdLink, setCreatedLink] = useState('')
  const [slugAvailability, setSlugAvailability] = useState<boolean | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [form, setForm] = useState<CreateInvitationInput>({
    couple: '',
    eventDate: '',
    slug: '',
    templateSlug: firstTemplateSlug,
  })

  useEffect(() => {
    const candidate = form.slug.trim()
    if (!candidate) {
      return
    }
    let active = true
    const timeout = window.setTimeout(() => {
      setIsCheckingSlug(true)
      void checkSlugAvailable(candidate).then((available) => {
        if (active) {
          setSlugAvailability(available)
          setIsCheckingSlug(false)
        }
      })
    }, 400)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [checkSlugAvailable, form.slug])

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
  const displayName = authUser?.displayName || authUser?.email?.split('@')[0] || 'Sahabat Undangan'
  const totalPublished = invitations.filter((item) => item.status.toLowerCase() === 'published').length
  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  const metrics = [
    { caption: 'Total undangan', icon: 'overview', label: 'Undangan', tone: 'success', trend: [], value: String(invitations.length) },
    { caption: 'Sudah dipublikasi', icon: 'subscription', label: 'Published', tone: 'info', trend: [], value: String(totalPublished) },
    { caption: 'Total RSVP masuk', icon: 'payment', label: 'RSVP', tone: 'success', trend: [], value: String(totalRSVP) },
  ]

  return (
    <main className="saas-dashboard adminyo-dashboard oripio-dashboard min-screen">
      <DashboardSidebar activeModule={activeModule} authUser={authUser} logout={logout} />
      <section className="saas-main">
        <header className="saas-topbar">
          <button className="sidebar-collapse" aria-label="Collapse sidebar" type="button">
            <DashboardIcon name="chevron" />
          </button>
          <label className="oripio-search">
            <DashboardIcon name="search" />
            <input aria-label="Search" placeholder="Search" type="search" />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="topbar-actions">
            <button className="topbar-icon" aria-label="Cari data" type="button">
              <DashboardIcon name="help" />
            </button>
            <button className="topbar-icon" aria-label="Pesan" type="button">
              <DashboardIcon name="mail" />
            </button>
            <button className="topbar-icon" aria-label="Notifikasi" type="button">
              <DashboardIcon name="notification" />
            </button>
            <span className="topbar-avatar">{displayName.charAt(0).toUpperCase()}</span>
            <button className="topbar-logout" onClick={logout} type="button">Keluar</button>
          </div>
        </header>

        <section className="saas-content">
          <TierExpiryBanner />
          <EmailVerificationBanner authUser={authUser} />

          <div className="content-header oripio-welcome">
            <div>
              <h2>Welcome back {displayName}</h2>
              <p className="data-source">
                {isDataLoading ? 'Memuat data...' : source === 'api' ? 'API tersambung' : 'Gagal memuat data dari server'}
              </p>
            </div>
            <nav aria-label="Breadcrumb">
              <span className="oripio-date"><DashboardIcon name="calendar" /> {todayLabel}</span>
              <a className="oripio-export" href="/dashboard/report">
                <DashboardIcon name="download" />
                Export
              </a>
            </nav>
          </div>

          {activeModule === 'undangan' ? (
            <>
              <div className="reservation-tabs" aria-label="Invitation filters">
                {['All invitation', 'Online invitation', 'Direct order'].map((item, index) => (
                  <button className={index === 0 ? 'active' : ''} key={item} type="button">
                    <span aria-hidden="true" />
                    {item}
                  </button>
                ))}
              </div>

              <section className="metric-grid">
                {metrics.map((item) => (
                  <article className={`metric-card small-box ${item.tone}`} key={item.label}>
                    <span className="metric-icon"><DashboardIcon name={item.icon} /></span>
                    <button className="metric-more" aria-label={`More ${item.label}`} type="button">...</button>
                    <div>
                      <p>{item.label}</p>
                      <strong>{item.value}</strong>
                      <span>{item.caption}</span>
                    </div>
                    <Sparkline points={item.trend} tone={item.tone} />
                  </article>
                ))}
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
                    {form.slug.trim() ? (
                      <span className={slugAvailability === false ? 'field-hint error' : 'field-hint'}>
                        {isCheckingSlug
                          ? 'Memeriksa ketersediaan...'
                          : slugAvailability === false
                            ? 'Slug sudah dipakai, pilih yang lain.'
                            : slugAvailability === true
                              ? 'Slug tersedia.'
                              : ''}
                      </span>
                    ) : null}
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
                    <p className="eyebrow">Booking list</p>
                    <h2>Daftar Undangan</h2>
                  </div>
                  <div className="table-tools">
                    <label>
                      <span>Search</span>
                      <input placeholder="Search..." type="search" />
                    </label>
                    <select aria-label="Filter template floor">
                      <option>All status</option>
                      <option>Published</option>
                      <option>Draft</option>
                    </select>
                  </div>
                </div>
                <div className="invite-table-labels">
                  <span>Full name</span>
                  <span>Template</span>
                  <span>Event date</span>
                  <span>Guests</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                <div className="invite-list">
                  {invitations.map((item) => (
                    <article className="invite-row" key={item.slug}>
                      <div>
                        <strong>{item.couple}</strong>
                        <span>/{item.slug}</span>
                      </div>
                      <p>{item.template}</p>
                      <time>{item.eventDate}</time>
                      <span>{item.rsvpCount} Guests</span>
                      <b className="adminlte-badge">{item.rsvpCount} RSVP</b>
                      <div className="row-actions">
                        <a href={`/dashboard/edit/${item.slug}`}>Edit Konten</a>
                        <a href={`/u/${item.slug}`}>Preview</a>
                        <button type="button" onClick={() => void copyInvitationLink(item.slug)}>
                          {copiedSlug === item.slug ? 'Tersalin' : 'Salin Link'}
                        </button>
                        <a className="guest-link" href={`/dashboard/tamu/${item.slug}`}>Tamu</a>
                        <button type="button" onClick={() => void duplicateInvitation(item.slug)}>
                          Duplikat
                        </button>
                        <button type="button" onClick={() => void trashInvitation(item.slug)}>
                          Hapus
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="table-card" id="trash">
                <div className="table-head">
                  <div>
                    <p className="eyebrow">Trash</p>
                    <h2>Undangan Terhapus</h2>
                  </div>
                  <div className="table-tools">
                    <button
                      className="button secondary"
                      onClick={() => {
                        setShowTrash((current) => !current)
                        void loadTrash()
                      }}
                      type="button"
                    >
                      {showTrash ? 'Sembunyikan' : 'Muat trash'}
                    </button>
                  </div>
                </div>
                {showTrash ? (
                  <div className="invite-list">
                    {trashedInvitations.length === 0 ? (
                      <p className="empty-state">Tidak ada undangan di trash.</p>
                    ) : (
                      trashedInvitations.map((item) => (
                        <article className="invite-row" key={item.slug}>
                          <div>
                            <strong>{item.couple}</strong>
                            <span>/{item.slug}</span>
                          </div>
                          <p>{item.template}</p>
                          <time>{item.eventDate}</time>
                          <span>-</span>
                          <b className="adminlte-badge">Trashed</b>
                          <div className="row-actions">
                            <button type="button" onClick={() => void restoreInvitation(item.slug)}>
                              Pulihkan
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                ) : null}
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
            <>
              <MediaLibraryPanel />
              <AIAssetGenerator
                generatedImages={generatedImages}
                imageMessage={imageMessage}
                isGeneratingImage={isGeneratingImage}
                onGenerate={generateImage}
              />
            </>
          ) : null}
          {activeModule === 'transaksi' ? <TransactionsPanel /> : null}
          {activeModule === 'tamu' ? <GuestPanel invitations={invitations} /> : null}
          {activeModule === 'checkin' ? <CheckInPanel invitations={invitations} /> : null}
          {activeModule === 'report' ? <ReportPanel /> : null}
          {activeModule === 'visitor' ? <RealtimeVisitorPanel /> : null}
          {activeModule === 'reseller' ? <ResellerPanel /> : null}
          {activeModule === 'langganan' ? (
            <SubscriptionPanel
              authUser={authUser}
              isSaving={isAdminSaving}
              onCreateMidtransPayment={onCreateMidtransPayment}
              onSubmitManualProof={onSubmitManualProof}
              onUploadProof={onUploadProof}
              onValidateVoucher={onValidateVoucher}
              paymentMessage={paymentMessage}
            />
          ) : null}
          {activeModule === 'voucher' ? (
            <VoucherPanel onValidateVoucher={onValidateVoucher} paymentMessage={paymentMessage} />
          ) : null}
          {activeModule === 'domain' ? <DomainPanel authUser={authUser} /> : null}
          {activeModule === 'pengaturan' ? <SettingsPanel /> : null}
        </section>
      </section>
    </main>
  )
}
