
import { MockupCreateInvitationWizard } from './MockupCreateInvitationWizard'
import { MockupMenuIcon } from './MockupMenuIcon'
import { MockupBuilderPanel, MockupDigitalPanel, MockupHelpPanel, MockupInvitationList, MockupPasswordPanel, MockupPlanPanel, MockupPremiumGallery, MockupProfilePanel, MockupReportPanel, MockupSubscriptionPanel, MockupTablePanel, MockupTierGatePanel, MockupVoucherPanel } from './MockupPanels'
import { createMockupInvitationCode, formatMockupDateRange, initialMockupInvitationCards } from './mockupData'
import type { MockupCreateInvitationInput, MockupInvitationCard, MockupMenuIconName } from './mockupData'
import { templateRegistry } from '../../templateEngine'
import { useState } from 'react'

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

export function MockupDashboardContent({
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

export function MockupDashboardOverview({
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
