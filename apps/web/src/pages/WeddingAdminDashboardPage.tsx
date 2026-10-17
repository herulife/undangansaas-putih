import { formatRupiah, readableStatus } from '../app/format'
import type { Invitation, Template } from '../app/types'
import { DomainPanel } from './dashboard/DomainPanel'
import { MockupMenuIcon } from './mockup/MockupMenuIcon'
import type { MockupMenuIconName } from './mockup/mockupData'
import { TierExpiryBanner, useTierGate } from '../tierGate'
import { useState } from 'react'

export function WeddingAdminDashboardPage({
  invitations,
  source,
  templates,
}: {
  invitations: Invitation[]
  source: 'api' | 'error'
  templates: Template[]
}) {
  const [showToast, setShowToast] = useState(true)
  const [adminView, setAdminView] = useState(window.location.hash.slice(1) || 'dashboard')
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
      note: source === 'api' ? 'Tersambung ke API' : 'Gagal terhubung',
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
            ['undangan', 'Undangan', 'inbox'],
            ['member', 'Member', 'users'],
            ['template', 'Template', 'sparkle'],
            ['transaksi', 'Transaksi', 'receipt'],
            ['payment', 'Pembayaran', 'ticket'],
            ['domain', 'Domain Kustom', 'receipt'],
            ['voucher', 'Voucher', 'ticket'],
            ['pengaturan', 'Pengaturan', 'settings'],
          ].map(([id, label, icon]) => (
            <a
              className={adminView === id ? 'active' : ''}
              href={`#${id}`}
              key={id}
              onClick={(e) => {
                e.preventDefault()
                setAdminView(id)
                window.location.hash = id
              }}
            >
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

          {adminView === 'dashboard' ? (
          <><section className="wa-stat-grid">
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
                          <th>Undangan</th>
                          <th>Pasangan</th>
                          <th>Template</th>
                          <th>Status</th>
                          <th>RSVP</th>
                        </tr>
                      </thead>
                  <tbody>
                    {invitations.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Belum ada undangan</td></tr>
                    ) : (
                      invitations.slice(0, 5).map((item) => (
                        <tr key={item.slug}>
                          <td><strong>#{item.slug}</strong></td>
                          <td>
                            <span className="wa-avatar">{item.couple.slice(0, 1)}</span>
                            {item.couple}
                          </td>
                          <td>{item.template}</td>
                          <td><em className={item.status === 'published' ? 'paid' : 'pending'}>{readableStatus(item.status)}</em></td>
                          <td>{item.rsvpCount} RSVP</td>
                        </tr>
                      ))
                    )}
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
                {invitations.length === 0 ? (
                  <div className="wa-member-row" style={{ justifyContent: 'center', color: '#888' }}>Belum ada member</div>
                ) : (
                  invitations.slice(0, 3).map((item) => (
                    <div className="wa-member-row" key={item.slug}>
                      <span>{item.couple.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{item.couple}</strong>
                        <small>/{item.slug}</small>
                      </div>
                      <b>{readableStatus(item.status)}</b>
                    </div>
                  ))
                )}
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
          </section></>
          ) : null}

          {adminView === 'undangan' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Daftar Undangan</h2>
                    <p>Kelola semua undangan yang sudah dibuat</p>
                  </div>
                </div>
                <div className="wa-table-wrap">
                  <table className="wa-table">
                    <thead>
                      <tr>
                        <th>Slug</th>
                        <th>Pasangan</th>
                        <th>Template</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>RSVP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Belum ada undangan</td></tr>
                      ) : (
                        invitations.map((item) => (
                          <tr key={item.slug}>
                            <td><strong>#{item.slug}</strong></td>
                            <td>
                              <span className="wa-avatar">{item.couple.slice(0, 1)}</span>
                              {item.couple}
                            </td>
                            <td>{item.template}</td>
                            <td>{item.eventDate}</td>
                            <td><em className={item.status === 'published' ? 'paid' : 'pending'}>{readableStatus(item.status)}</em></td>
                            <td>{item.rsvpCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'member' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Daftar Member</h2>
                    <p>Kelola akun pengguna yang terdaftar</p>
                  </div>
                </div>
                <div className="wa-member-list">
                  {invitations.length === 0 ? (
                    <div className="wa-member-row" style={{ justifyContent: 'center', color: '#888' }}>Belum ada member</div>
                  ) : (
                    invitations.slice(0, 10).map((item) => (
                      <div className="wa-member-row" key={item.slug}>
                        <span>{item.couple.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{item.couple}</strong>
                          <small>/{item.slug}</small>
                        </div>
                        <b>{readableStatus(item.status)}</b>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'template' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Kelola Template</h2>
                    <p>{templates.length} template terdaftar di database</p>
                  </div>
                </div>
                <div className="wa-table-wrap">
                  <table className="wa-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Slug</th>
                        <th>Kategori</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Belum ada template</td></tr>
                      ) : (
                        templates.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.name}</strong></td>
                            <td>{item.slug}</td>
                            <td>{item.category}</td>
                            <td><em className={item.isActive ? 'paid' : 'pending'}>{item.isActive ? 'Aktif' : 'Nonaktif'}</em></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'transaksi' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Riwayat Transaksi</h2>
                    <p>Catatan semua pembayaran yang masuk</p>
                  </div>
                </div>
                <div className="wa-table-wrap">
                  <table className="wa-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Paket</th>
                        <th>Nominal</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Belum ada transaksi</td></tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'payment' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Manajemen Pembayaran</h2>
                    <p>Konfigurasi payment gateway dan verifikasi</p>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3>Payment Gateway</h3>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>Status integrasi Midtrans</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <strong style={{ color: '#166534' }}>Midtrans</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#555' }}>Snap + Webhook</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                      <strong style={{ color: '#92400e' }}>Manual</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#555' }}>Admin input manual</p>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'voucher' ? (
            <section className="wa-bento-grid">
              <article className="wa-panel wa-panel-wide">
                <div className="wa-panel-head">
                  <div>
                    <h2>Kelola Voucher</h2>
                    <p>Buat dan distribusikan voucher diskon</p>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ color: '#888' }}>Fitur voucher akan segera tersedia.</p>
                </div>
              </article>
            </section>
          ) : null}

          {adminView === 'domain' ? <DomainPanel authUser={{ id: '', email: '', displayName: 'Admin', role: 'admin', tier: 'business' }} /> : null}
        </section>

        <footer className="wa-footer">
          LinkUndang Wedding Admin - Premium Invitation Management System
        </footer>
      </section>
    </main>
  )
}
