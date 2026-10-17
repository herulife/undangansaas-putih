
import type { MockupInvitationCard } from './mockupData'
import { templateRegistry } from '../../templateEngine'
import { useTierGate } from '../../tierGate'
import type { FeatureFlag } from '../../tierGate'

export function MockupPhoneFrame({ alt, src }: { alt: string; src: string }) {
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

export function MockupBuilderPanel({ onCreateInvitation }: { onCreateInvitation: (templateId?: string) => void }) {
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

export function MockupTierGatePanel() {
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

export function MockupInvitationList({
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

export function MockupPremiumGallery() {
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

export function MockupTablePanel({ columns, emptyText, subtitle, title }: { columns: string[]; emptyText: string; subtitle: string; title: string }) {
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

export function MockupReportPanel() {
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

export function MockupPlanPanel({ items, price, title }: { items: string[]; price: string; title: string }) {
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

export function MockupSubscriptionPanel() {
  return <MockupPlanPanel title="Berlangganan" price="Mulai Rp.50rb" items={['Berlangganan 30 hari', 'Berlangganan 100 hari', 'Berlangganan 365 hari']} />
}

export function MockupVoucherPanel() {
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

export function MockupHelpPanel() {
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

export function MockupDigitalPanel({ activeMenu }: { activeMenu: string }) {
  const title = activeMenu === 'gambar' ? 'Undangan Gambar' : activeMenu === 'video' ? 'Undangan Video' : 'Undangan Digital'
  return <MockupPlanPanel title={title} price="Gratis" items={['Template Photoshop', 'Template PowerPoint', 'Download asset', 'Panduan edit']} />
}

export function MockupProfilePanel() {
  return (
    <section className="lu-panel lu-form-panel">
      <h2>Change Profile</h2>
      <label>Nama<input defaultValue="Candra Loka" /></label>
      <label>No HP<input placeholder="08xxxxxxxxxx" /></label>
      <button type="button">Submit</button>
    </section>
  )
}

export function MockupPasswordPanel() {
  return (
    <section className="lu-panel lu-form-panel">
      <h2>Change Password</h2>
      <label>New Password<input type="password" /></label>
      <label>Confirm Password<input type="password" /></label>
      <button type="button">Submit</button>
    </section>
  )
}
