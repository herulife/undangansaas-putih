import { apiURL, authHeaders } from '../../app/api'
import type { AuthUser, DomainData } from '../../app/types'
import { useEffect, useState } from 'react'

export function DomainPanel({ authUser }: { authUser: AuthUser | null }) {
  const [domains, setDomains] = useState<DomainData[]>([])
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDomains()
  }, [])

  function getToken() {
    return window.localStorage.getItem('auth_token') ?? ''
  }

  async function fetchDomains() {
    setLoading(true)
    try {
      const res = await fetch(apiURL('/api/domains'), {
        headers: authHeaders(getToken()),
      })
      if (res.ok) {
        setDomains(await res.json() as DomainData[])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function addDomain() {
    const domain = newDomain.trim().toLowerCase()
    if (!domain) return
    const res = await fetch(apiURL('/api/domains'), {
      method: 'POST',
      headers: authHeaders(getToken(), true),
      body: JSON.stringify({ domain, invitationId: '' }),
    })
    if (res.ok) {
      setNewDomain('')
      setMessage('Domain berhasil ditambahkan')
      fetchDomains()
    } else {
      const err = await res.json()
      setMessage(err.error || 'Gagal menambah domain')
    }
  }

  async function verifyDomain(id: string) {
    const res = await fetch(apiURL(`/api/domains/${id}/verify`), {
      method: 'POST',
      headers: authHeaders(getToken()),
    })
    if (res.ok) {
      const data = await res.json()
      setMessage(data.status === 'verified' ? 'Domain terverifikasi!' : 'Domain belum mengarah ke server kami')
      fetchDomains()
    } else {
      const err = await res.json()
      setMessage(err.error || 'Gagal verifikasi')
    }
  }

  async function deleteDomain(id: string) {
    if (!confirm('Hapus domain ini?')) return
    const res = await fetch(apiURL(`/api/domains/${id}`), {
      method: 'DELETE',
      headers: authHeaders(getToken()),
    })
    if (res.ok) {
      setMessage('Domain berhasil dihapus')
      fetchDomains()
    }
  }

  const canUseDomain = authUser?.tier === 'pro' || authUser?.tier === 'business'

  return (
    <section className="module-grid">
      <article className="module-card span-2" style={{ maxWidth: 960 }}>
        <p className="eyebrow">Custom Domain</p>
        <h2>Domain Kustom</h2>

        {!canUseDomain ? (
          <p className="form-message" style={{ color: '#e67e22' }}>
            Fitur custom domain tersedia untuk paket <strong>Pro</strong> dan <strong>Business</strong>.
            <a href="/dashboard/langganan" style={{ marginLeft: 8 }}>Upgrade sekarang</a>
          </p>
        ) : null}

        {message ? <p className="form-message">{message}</p> : null}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'flex-end' }}>
          <label style={{ flex: 1 }}>
            Domain
            <input
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="undangan.example.com"
              value={newDomain}
            />
          </label>
          <button className="button primary" disabled={!newDomain.trim() || !canUseDomain} onClick={addDomain} type="button">
            Tambah
          </button>
        </div>

        <p style={{ marginBottom: 16, fontSize: '0.85em', color: '#888' }}>
          Tambahkan record A/CNAME di panel DNS domain kamu mengarah ke <strong>103.107.206.10</strong>,
          lalu klik tombol Verifikasi.
        </p>

        {loading ? (
          <p>Memuat data domain...</p>
        ) : domains.length === 0 ? (
          <p>Belum ada domain. Tambahkan domain di atas.</p>
        ) : (
          <div className="table-card" style={{ padding: 0 }}>
            <div className="invite-table-labels">
              <span>Domain</span>
              <span>Status</span>
              <span>Diverifikasi</span>
              <span>Aksi</span>
            </div>
            <div className="invite-list">
              {domains.map((item) => (
                <article className="invite-row" key={item.id}>
                  <strong>{item.domain}</strong>
                  <b className="adminlte-badge">{item.status}</b>
                  <span>{item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString('id-ID') : '-'}</span>
                  <div className="row-actions">
                    <button onClick={() => void verifyDomain(item.id)} type="button">
                      Verifikasi
                    </button>
                    <button className="danger" onClick={() => void deleteDomain(item.id)} type="button">
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
