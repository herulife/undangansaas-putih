import { apiURL, authHeaders } from '../../app/api'
import type { GuestData, Invitation } from '../../app/types'
import { useEffect, useState } from 'react'

export function GuestPanel({ invitations }: { invitations: Invitation[] }) {
  const pathSlug = window.location.pathname.split('/').filter(Boolean)[2] ?? ''
  const [selectedSlug, setSelectedSlug] = useState(pathSlug || '')
  const [guests, setGuests] = useState<GuestData[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStatus, setEditStatus] = useState<string>('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (selectedSlug) {
      fetchGuests()
    }
  }, [selectedSlug])

  function getToken() {
    return window.localStorage.getItem('auth_token') ?? ''
  }

  async function fetchGuests() {
    setLoading(true)
    try {
      const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/guests`), {
        headers: authHeaders(getToken()),
      })
      if (res.ok) {
        setGuests(await res.json() as GuestData[])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function addGuest() {
    if (!newName.trim()) return
    const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/guests`), {
      method: 'POST',
      headers: authHeaders(getToken(), true),
      body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
    })
    if (res.ok) {
      setNewName('')
      setNewPhone('')
      setMessage('Tamu berhasil ditambahkan')
      fetchGuests()
    } else {
      const err = await res.json()
      setMessage(err.error || 'Gagal menambah tamu')
    }
  }

  async function updateGuest(id: string) {
    const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/guests/${id}`), {
      method: 'PATCH',
      headers: authHeaders(getToken(), true),
      body: JSON.stringify({ name: editName, phone: editPhone, status: editStatus }),
    })
    if (res.ok) {
      setEditId(null)
      setMessage('Tamu berhasil diperbarui')
      fetchGuests()
    } else {
      const err = await res.json()
      setMessage(err.error || 'Gagal memperbarui tamu')
    }
  }

  async function deleteGuest(id: string) {
    if (!confirm('Hapus tamu ini?')) return
    const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/guests/${id}`), {
      method: 'DELETE',
      headers: authHeaders(getToken()),
    })
    if (res.ok) {
      setMessage('Tamu berhasil dihapus')
      fetchGuests()
    } else {
      const err = await res.json()
      setMessage(err.error || 'Gagal menghapus tamu')
    }
  }

  function openEdit(guest: GuestData) {
    setEditId(guest.id)
    setEditName(guest.name)
    setEditPhone(guest.phone)
    setEditStatus(guest.status)
  }

  async function handleImportCSV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/guests/import`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        setMessage(`${result.imported} dari ${result.total} tamu berhasil diimport`)
        fetchGuests()
      }
    } catch { /* ignore */ }
    event.target.value = ''
  }

  function startExportCSV() {
    const token = getToken()
    const url = apiURL(`/api/invitations/${selectedSlug}/guests/export`)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'guests.csv')
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      const blob = xhr.response
      const objectUrl = URL.createObjectURL(blob)
      link.href = objectUrl
      link.click()
      URL.revokeObjectURL(objectUrl)
    }
    xhr.send()
  }

  const displayGuests = guests

  return (
    <section className="module-grid">
      <article className="module-card span-2" style={{ maxWidth: 960 }}>
        <p className="eyebrow">Guest Management</p>
        <h2>Daftar Tamu</h2>

        <label>
          Pilih Undangan
          <select
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value)
              const newPath = e.target.value ? `/dashboard/tamu/${e.target.value}` : '/dashboard/tamu'
              window.history.replaceState(null, '', newPath)
            }}
            style={{ marginBottom: 16 }}
          >
            <option value="">-- Pilih undangan --</option>
            {invitations.map((inv) => (
              <option key={inv.slug} value={inv.slug}>
                {inv.couple} - /{inv.slug}
              </option>
            ))}
          </select>
        </label>

        {message ? <p className="form-message">{message}</p> : null}

        {selectedSlug ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
              <label style={{ flex: 1 }}>
                Nama tamu
                <input
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama lengkap"
                  value={newName}
                />
              </label>
              <label style={{ flex: 1 }}>
                No. HP
                <input
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08xxxx"
                  value={newPhone}
                />
              </label>
              <button className="button primary" disabled={!newName.trim()} onClick={addGuest} type="button">
                Tambah
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <label className="button secondary" style={{ cursor: 'pointer' }}>
                Import CSV
                <input accept=".csv" hidden onChange={handleImportCSV} type="file" />
              </label>
              <button className="button secondary" onClick={startExportCSV} type="button">
                Export CSV
              </button>
            </div>

            {loading ? (
              <p>Memuat data tamu...</p>
            ) : displayGuests.length === 0 ? (
              <p>Belum ada tamu untuk undangan ini.</p>
            ) : (
              <div className="table-card" style={{ padding: 0 }}>
                <div className="invite-table-labels">
                  <span>Nama</span>
                  <span>No. HP</span>
                  <span>Status</span>
                  <span>Personal URL</span>
                  <span>Aksi</span>
                </div>
                <div className="invite-list">
                  {displayGuests.map((guest) => (
                    <article className="invite-row" key={guest.id}>
                      {editId === guest.id ? (
                        <>
                          <input
                            onChange={(e) => setEditName(e.target.value)}
                            value={editName}
                          />
                          <input
                            onChange={(e) => setEditPhone(e.target.value)}
                            value={editPhone}
                          />
                          <select
                            onChange={(e) => setEditStatus(e.target.value)}
                            value={editStatus}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="opened">Opened</option>
                            <option value="failed">Failed</option>
                          </select>
                          <div className="row-actions">
                            <button className="button primary" onClick={() => void updateGuest(guest.id)} type="button">
                              Simpan
                            </button>
                            <button onClick={() => setEditId(null)} type="button">
                              Batal
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>{guest.name}</strong>
                          <span>{guest.phone || '-'}</span>
                          <b className="adminlte-badge">{guest.status}</b>
                          {guest.personalUrl ? (
                            <button
                              onClick={() => {
                                void navigator.clipboard?.writeText(guest.personalUrl)
                                setMessage(`Link tamu ${guest.name} disalin`)
                              }}
                              type="button"
                            >
                              Salin Link
                            </button>
                          ) : (
                            <span>-</span>
                          )}
                          <div className="row-actions">
                            <button onClick={() => openEdit(guest)} type="button">Edit</button>
                            <button className="danger" onClick={() => void deleteGuest(guest.id)} type="button">
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Pilih undangan dari dropdown di atas untuk mulai mengelola tamu.</p>
        )}
      </article>
    </section>
  )
}
