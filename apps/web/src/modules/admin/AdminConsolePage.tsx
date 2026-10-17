import { useEffect, useState } from 'react'
import { apiURL, authHeaders } from '../../app/api'
import { formatRupiah } from '../../app/format'
import type {
  AdminMediaItem,
  AdminOverview,
  AdminPayment,
  AdminVoucher,
  AuditLogEntry,
  Template,
} from '../../app/types'

type AdminTab = 'ringkasan' | 'order' | 'media' | 'voucher' | 'template' | 'audit'

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'order', label: 'Order & Pembayaran' },
  { id: 'media', label: 'Media' },
  { id: 'voucher', label: 'Voucher' },
  { id: 'template', label: 'Template' },
  { id: 'audit', label: 'Audit Log' },
]

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function AdminConsolePage({ templates }: { templates: Template[] }) {
  const [tab, setTab] = useState<AdminTab>('ringkasan')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [media, setMedia] = useState<AdminMediaItem[]>([])
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([])
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [message, setMessage] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? ''
    let active = true
    function fetchInto<T>(path: string, apply: (data: T) => void) {
      fetch(apiURL(path), { headers: authHeaders(token) })
        .then((response) => (response.ok ? (response.json() as Promise<T>) : null))
        .then((data) => {
          if (active && data) apply(data)
        })
        .catch(() => { /* ignore */ })
    }
    fetchInto<AdminOverview>('/api/admin/overview', setOverview)
    fetchInto<AdminPayment[]>('/api/admin/payments', setPayments)
    fetchInto<{ assets: AdminMediaItem[] }>('/api/admin/media', (data) => setMedia(data.assets ?? []))
    fetchInto<AdminVoucher[]>('/api/admin/vouchers', setVouchers)
    fetchInto<{ logs: AuditLogEntry[] }>('/api/admin/audit-logs?limit=200', (data) => setLogs(data.logs ?? []))
    return () => {
      active = false
    }
  }, [version])

  function reviewPayment(id: string, action: 'verify' | 'reject') {
    const token = window.localStorage.getItem('auth_token') ?? ''
    setMessage('')
    fetch(apiURL(`/api/admin/payments/${id}/${action}`), {
      body: action === 'reject' ? JSON.stringify({ note: 'Ditolak admin' }) : undefined,
      headers: authHeaders(token),
      method: 'POST',
    })
      .then((response) => {
        if (response.ok) {
          setMessage(action === 'verify' ? 'Pembayaran diverifikasi.' : 'Pembayaran ditolak.')
          setVersion((value) => value + 1)
        } else {
          setMessage('Aksi gagal.')
        }
      })
      .catch(() => setMessage('Aksi gagal.'))
  }

  function deleteVoucher(id: string) {
    const token = window.localStorage.getItem('auth_token') ?? ''
    fetch(apiURL(`/api/admin/vouchers/${id}`), {
      headers: authHeaders(token),
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) setVersion((value) => value + 1)
      })
      .catch(() => { /* ignore */ })
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <a className="brand-link" href="/dashboard"><b>LinkUndang Admin</b></a>
        <a className="button secondary" href="/dashboard">Ke Dashboard</a>
      </header>
      <nav className="admin-tabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px 24px' }}>
        {tabs.map((item) => (
          <button
            className={tab === item.id ? 'button' : 'button secondary'}
            key={item.id}
            onClick={() => setTab(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="dashboard-content" style={{ padding: '0 24px 48px' }}>
        {message ? <p className="form-message">{message}</p> : null}

        {tab === 'ringkasan' && overview ? (
          <section className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <StatCard label="Total User" value={String(overview.totalUsers)} />
            <StatCard label="Total Undangan" value={String(overview.totalInvitations)} />
            <StatCard label="Transaksi Lunas" value={String(overview.paidTransactions)} />
            <StatCard label="Pendapatan" value={formatRupiah(overview.grossRevenueIdr)} />
            <StatCard label="Manual Pending" value={String(overview.pendingManual)} />
            <StatCard label="Voucher Aktif" value={String(overview.activeVouchers)} />
            <StatCard label="Aset Media" value={String(overview.totalMediaAssets)} />
            <StatCard label="Storage Terpakai" value={formatBytes(overview.storageUsedBytes)} />
          </section>
        ) : null}

        {tab === 'order' ? (
          <section className="table-card">
            <div className="table-head"><h2>Order &amp; Pembayaran</h2></div>
            <table>
              <thead>
                <tr><th>Order</th><th>User</th><th>Tier</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td><small>{payment.orderId || payment.id.slice(0, 8)}</small><br />{payment.provider}</td>
                    <td>{payment.userEmail}<br /><small>{payment.userName}</small></td>
                    <td>{payment.tier}</td>
                    <td>{formatRupiah(payment.amountIdr)}</td>
                    <td>{payment.status}</td>
                    <td>
                      {payment.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="button" onClick={() => void reviewPayment(payment.id, 'verify')} type="button">Verifikasi</button>
                          <button className="button secondary" onClick={() => void reviewPayment(payment.id, 'reject')} type="button">Tolak</button>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'media' ? (
          <section className="table-card">
            <div className="table-head"><h2>Media</h2></div>
            <table>
              <thead><tr><th>File</th><th>Owner</th><th>Tipe</th><th>Ukuran</th><th>Dibuat</th></tr></thead>
              <tbody>
                {media.map((item) => (
                  <tr key={item.id}>
                    <td><a href={item.url} rel="noreferrer" target="_blank">{item.fileName}</a></td>
                    <td>{item.owner || '-'}</td>
                    <td>{item.mediaType}</td>
                    <td>{formatBytes(item.sizeBytes)}</td>
                    <td>{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'voucher' ? (
          <section className="table-card">
            <div className="table-head"><h2>Voucher</h2></div>
            <table>
              <thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Kuota</th><th>Terpakai</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td>{voucher.code}</td>
                    <td>{voucher.discountType}</td>
                    <td>{voucher.discountType === 'percent' ? `${voucher.discountValue}%` : formatRupiah(voucher.discountValue)}</td>
                    <td>{voucher.quota}</td>
                    <td>{voucher.usedCount}</td>
                    <td>{voucher.status}</td>
                    <td><button className="button secondary" onClick={() => void deleteVoucher(voucher.id)} type="button">Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'template' ? (
          <section className="table-card">
            <div className="table-head"><h2>Template</h2><span>{templates.length} template aktif</span></div>
            <table>
              <thead><tr><th>Nama</th><th>Slug</th><th>Kategori</th><th>Tier</th></tr></thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{template.id}</td>
                    <td>{template.category}</td>
                    <td>{(template.tierAccess ?? []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === 'audit' ? (
          <section className="table-card">
            <div className="table-head"><h2>Audit Log</h2><span>{logs.length} entri terakhir</span></div>
            <table>
              <thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                    <td>{log.actorEmail || '-'}</td>
                    <td>{log.action}</td>
                    <td>{log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)})` : ''}</td>
                    <td>{log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card" style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px' }}>
      <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>{label}</p>
      <strong style={{ fontSize: '22px' }}>{value}</strong>
    </article>
  )
}
