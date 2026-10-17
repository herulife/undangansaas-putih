import { useEffect, useState } from 'react'
import { apiURL, authHeaders } from '../../app/api'
import { formatRupiah, readableStatus, titleCase } from '../../app/format'
import type { AnalyticsOverview, PaymentRecord, RealtimeEvent } from '../../app/types'
import { PlaceholderModule } from '../../components/PlaceholderModule'

export function TransactionsPanel() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [message, setMessage] = useState('Memuat riwayat transaksi...')

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? ''
    let active = true
    fetch(apiURL('/api/payments'), { headers: authHeaders(token) })
      .then(async (response) => {
        if (!active) return
        if (!response.ok) {
          setMessage('Gagal memuat riwayat transaksi.')
          return
        }
        const items = await response.json() as PaymentRecord[]
        setPayments(items)
        setMessage(items.length === 0 ? 'Belum ada transaksi.' : '')
      })
      .catch(() => {
        if (active) setMessage('Gagal memuat riwayat transaksi.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="table-card">
      <div className="table-head">
        <h2>Riwayat Transaksi</h2>
        <span>{payments.length} transaksi</span>
      </div>
      {message ? (
        <p className="empty-state">{message}</p>
      ) : (
        <div className="rsvp-list">
          {payments.map((item) => (
            <article className="rsvp-row" key={item.id}>
              <div>
                <strong>{item.orderId}</strong>
                <span>{titleCase(item.tier)} - {formatRupiah(item.amountIdr)}</span>
              </div>
              <p>
                {readableStatus(item.status)}
                {' - '}
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.createdAt))}
              </p>
              {item.status === 'pending' && item.checkoutUrl ? (
                <a className="button secondary" href={item.checkoutUrl} rel="noreferrer" target="_blank">Bayar</a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function ReportPanel() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [message, setMessage] = useState('Memuat laporan...')

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? ''
    let active = true
    fetch(apiURL('/api/v1/analytics/overview?days=30'), { headers: authHeaders(token) })
      .then(async (response) => {
        if (!active) return
        if (!response.ok) {
          setMessage('Gagal memuat laporan.')
          return
        }
        const data = await response.json() as AnalyticsOverview
        setOverview(data)
        setMessage('')
      })
      .catch(() => {
        if (active) setMessage('Gagal memuat laporan.')
      })
    return () => {
      active = false
    }
  }, [])

  if (message) {
    return <PlaceholderModule title="Report" description={message} fields={['Pengunjung 30 hari', 'Pengunjung unik', 'Total RSVP', 'Konversi share']} />
  }
  if (!overview) {
    return null
  }

  const maxViews = Math.max(1, ...overview.days.map((day) => day.pageViews))

  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Report 30 Hari</p>
        <h2>Ringkasan pengunjung</h2>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }}>
          <div><strong>{overview.totals.pageViews}</strong><span>Page view</span></div>
          <div><strong>{overview.totals.uniqueVisitors}</strong><span>Pengunjung unik</span></div>
          <div><strong>{overview.totals.rsvpTotal}</strong><span>Total RSVP</span></div>
          <div><strong>{overview.totals.shareClicks}</strong><span>Share klik</span></div>
        </div>
        <div className="spark-bars" style={{ marginTop: '20px', display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
          {overview.days.map((day) => (
            <div
              key={day.day}
              title={`${day.day}: ${day.pageViews} view`}
              style={{ flex: 1, background: '#1f4f3a', height: `${Math.round((day.pageViews / maxViews) * 100)}%`, minHeight: '2px' }}
            />
          ))}
        </div>
      </article>
      <article className="module-card span-2">
        <p className="eyebrow">Undangan Populer</p>
        <h2>Top 5 undangan</h2>
        <div className="rsvp-list">
          {overview.topInvitations.map((item) => (
            <article className="rsvp-row" key={item.slug}>
              <div>
                <strong>{item.couple}</strong>
                <span>/{item.slug}</span>
              </div>
              <p>{item.pageViews} view - {item.rsvpCount} RSVP</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}

export function RealtimeVisitorPanel() {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [message, setMessage] = useState('Memuat aktivitas...')

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? ''
    let active = true
    function load() {
      fetch(apiURL('/api/v1/analytics/realtime'), { headers: authHeaders(token) })
        .then(async (response) => {
          if (!active) return
          if (!response.ok) {
            setMessage('Gagal memuat aktivitas.')
            return
          }
          const data = await response.json() as RealtimeEvent[]
          setEvents(data)
          setMessage(data.length === 0 ? 'Belum ada aktivitas 30 menit terakhir.' : '')
        })
        .catch(() => {
          if (active) setMessage('Gagal memuat aktivitas.')
        })
    }
    load()
    const timer = window.setInterval(load, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section className="table-card">
      <div className="table-head">
        <h2>Realtime Visitor</h2>
        <span>{events.length} aktivitas (30 menit)</span>
      </div>
      {message ? (
        <p className="empty-state">{message}</p>
      ) : (
        <div className="rsvp-list">
          {events.map((item, index) => (
            <article className="rsvp-row" key={`${item.createdAt}-${index}`}>
              <div>
                <strong>{item.guestName || '(tanpa nama)'}</strong>
                <span>/{item.slug}</span>
              </div>
              <p>
                {readableStatus(item.eventName)}
                {' - '}
                {new Intl.DateTimeFormat('id-ID', { timeStyle: 'medium' }).format(new Date(item.createdAt))}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function ResellerPanel() {
  return <PlaceholderModule title="Reseller | Mitra" description="Label reseller, akses client, katalog reseller, dan komisi bisa masuk setelah builder stabil." fields={['Label Brand', 'Client Access', 'Custom Domain', 'Margin']} />
}

export function SettingsPanel() {
  return <PlaceholderModule title="Pengaturan" description="Profil, password, notifikasi, bahasa dashboard, dan preferensi reseller." fields={['Nama', 'No HP', 'Email', 'Password']} />
}
