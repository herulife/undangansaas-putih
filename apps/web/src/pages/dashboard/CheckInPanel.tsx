import { apiURL, authHeaders } from '../../app/api'
import type { CheckinGuest, CheckinListResponse, CheckinResult, Invitation } from '../../app/types'
import { useEffect, useRef, useState } from 'react'

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

function getToken() {
  return window.localStorage.getItem('auth_token') ?? ''
}

function extractToken(raw: string) {
  const value = raw.trim()
  if (!value) return ''
  const idx = value.lastIndexOf('/scan/')
  if (idx >= 0) return value.slice(idx + '/scan/'.length).replace(/[/\s]+$/, '')
  return value
}

export function CheckInPanel({ invitations }: { invitations: Invitation[] }) {
  const initialSlug = window.location.pathname.split('/').filter(Boolean)[2] ?? ''
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [data, setData] = useState<CheckinListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [qrGuest, setQrGuest] = useState<CheckinGuest | null>(null)
  const [qrSrc, setQrSrc] = useState('')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (selectedSlug) {
      void fetchCheckin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug])

  async function fetchCheckin() {
    setLoading(true)
    try {
      const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/checkin`), {
        headers: authHeaders(getToken()),
      })
      if (res.ok) {
        setData(await res.json() as CheckinListResponse)
      } else if (res.status === 403) {
        setMessage('Paket Anda belum mendukung fitur check-in. Upgrade ke Creator ke atas.')
      } else {
        const err = await res.json().catch(() => null) as { error?: string } | null
        setMessage(err?.error ?? 'Gagal memuat data check-in')
      }
    } catch {
      setMessage('Gagal memuat data check-in')
    }
    setLoading(false)
  }

  async function doCheckin(token: string) {
    const clean = token.trim()
    if (!clean) return
    setMessage('')
    try {
      const res = await fetch(apiURL('/api/checkin'), {
        method: 'POST',
        headers: authHeaders(getToken(), true),
        body: JSON.stringify({ token: clean }),
      })
      if (res.ok) {
        const result = await res.json() as CheckinResult
        setLastResult(result)
        setMessage(result.alreadyCheckedIn
          ? `${result.guest.name} sudah check-in sebelumnya`
          : `${result.guest.name} berhasil check-in`)
        setManualToken('')
        if (data && result.slug !== selectedSlug) {
          setSelectedSlug(result.slug)
        } else {
          void fetchCheckin()
        }
      } else if (res.status === 404) {
        setLastResult(null)
        setMessage('Kode QR tidak dikenali')
      } else if (res.status === 403) {
        setMessage('Paket Anda belum mendukung fitur check-in.')
      } else {
        setMessage('Gagal memproses check-in')
      }
    } catch {
      setMessage('Gagal memproses check-in')
    }
  }

  async function resetCheckin(guest: CheckinGuest) {
    if (!confirm(`Reset status hadir ${guest.name}?`)) return
    const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/checkin/reset`), {
      method: 'POST',
      headers: authHeaders(getToken(), true),
      body: JSON.stringify({ guestId: guest.id }),
    })
    if (res.ok) {
      setMessage(`Status hadir ${guest.name} direset`)
      void fetchCheckin()
    } else {
      setMessage('Gagal reset status hadir')
    }
  }

  async function openQR(guest: CheckinGuest) {
    setQrGuest(guest)
    setQrSrc('')
    try {
      const res = await fetch(apiURL(`/api/invitations/${selectedSlug}/checkin/qr/${guest.id}`), {
        headers: authHeaders(getToken()),
      })
      if (res.ok) {
        const blob = await res.blob()
        setQrSrc(URL.createObjectURL(blob))
      }
    } catch {
      /* ignore */
    }
  }

  function stopScan() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  async function startScan() {
    setScanError('')
    const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector
    if (!Detector) {
      setScanError('Browser tidak mendukung scan kamera. Gunakan input kode manual.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
    } catch {
      setScanError('Tidak bisa mengakses kamera. Gunakan input kode manual.')
    }
  }

  useEffect(() => {
    if (!scanning || !videoRef.current || !streamRef.current || !data) return
    const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector
    if (!Detector) return
    const video = videoRef.current
    video.srcObject = streamRef.current
    let active = true
    let timer = 0
    const detector = new Detector({ formats: ['qr_code'] })

    const loop = async () => {
      if (!active || !videoRef.current) return
      try {
        const codes = await detector.detect(video)
        if (codes.length > 0 && !busyRef.current) {
          const token = extractToken(codes[0].rawValue)
          if (token) {
            busyRef.current = true
            stopScan()
            await doCheckin(token)
            busyRef.current = false
            active = false
            return
          }
        }
      } catch {
        /* ignore detection errors */
      }
      timer = window.setTimeout(loop, 450)
    }
    void video.play().then(loop).catch(() => setScanError('Kamera tidak dapat dimulai.'))
    return () => {
      active = false
      window.clearTimeout(timer)
      stopScan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, data])

  useEffect(() => () => {
    if (qrSrc) URL.revokeObjectURL(qrSrc)
  }, [qrSrc])

  const summary = data?.summary
  const layarURL = data ? `${window.location.origin}/layar/${data.slug}?key=${data.screenKey}` : ''

  return (
    <section className="module-grid">
      <article className="module-card span-2" style={{ maxWidth: 1024 }}>
        <p className="eyebrow">Guest Check-in</p>
        <h2>Check-in & Layar Sapa</h2>

        <label>
          Pilih Undangan
          <select
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value)
              const newPath = e.target.value ? `/dashboard/checkin/${e.target.value}` : '/dashboard/checkin'
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

        {!selectedSlug ? (
          <p>Pilih undangan untuk membuka fitur check-in.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div className="metric-card small-box success" style={{ flex: 1, minWidth: 120 }}>
                <div>
                  <p>Total tamu</p>
                  <strong>{summary?.total ?? '-'}</strong>
                </div>
              </div>
              <div className="metric-card small-box info" style={{ flex: 1, minWidth: 120 }}>
                <div>
                  <p>Sudah hadir</p>
                  <strong>{summary?.checkedIn ?? '-'}</strong>
                </div>
              </div>
              <div className="metric-card small-box warning" style={{ flex: 1, minWidth: 120 }}>
                <div>
                  <p>Belum hadir</p>
                  <strong>{summary?.pending ?? '-'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <label style={{ flex: 1 }}>
                Kode / Token QR (manual)
                <input
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void doCheckin(manualToken)
                  }}
                  placeholder="Tempel token atau URL hasil scan"
                  value={manualToken}
                />
              </label>
              <button className="button primary" disabled={!manualToken.trim()} onClick={() => void doCheckin(manualToken)} type="button">
                Check-in
              </button>
              <button className="button secondary" onClick={() => (scanning ? stopScan() : void startScan())} type="button">
                {scanning ? 'Stop kamera' : 'Scan kamera'}
              </button>
            </div>

            {scanError ? <p className="field-hint error">{scanError}</p> : null}

            {scanning ? (
              <div style={{ margin: '12px 0' }}>
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{ width: 320, maxWidth: '100%', borderRadius: 12, background: '#000' }}
                />
                <p className="field-hint">Arahkan kamera ke QR tamu...</p>
              </div>
            ) : null}

            {lastResult ? (
              <div className="form-card" style={{ marginBottom: 16, background: lastResult.alreadyCheckedIn ? '#fff7e6' : '#eafaf1' }}>
                <strong>{lastResult.guest.name}</strong>
                <p>
                  {lastResult.alreadyCheckedIn ? 'Sudah pernah check-in' : 'Check-in berhasil'} ·{' '}
                  {lastResult.guest.checkedInAt ? new Date(lastResult.guest.checkedInAt).toLocaleString('id-ID') : '-'}
                </p>
              </div>
            ) : null}

            {layarURL ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <a className="button secondary" href={layarURL} target="_blank" rel="noreferrer">
                  Buka Layar Sapa
                </a>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(layarURL)
                    setMessage('Link layar sapa disalin')
                  }}
                >
                  Salin link layar
                </button>
              </div>
            ) : null}

            {loading ? (
              <p>Memuat data tamu...</p>
            ) : !data || data.guests.length === 0 ? (
              <p>Belum ada tamu untuk undangan ini.</p>
            ) : (
              <div className="table-card" style={{ padding: 0 }}>
                <div className="invite-table-labels">
                  <span>Nama</span>
                  <span>No. HP</span>
                  <span>Status hadir</span>
                  <span>Check-in</span>
                  <span>Aksi</span>
                </div>
                <div className="invite-list">
                  {data.guests.map((guest) => (
                    <article className="invite-row" key={guest.id}>
                      <strong>{guest.name}</strong>
                      <span>{guest.phone || '-'}</span>
                      <b className="adminlte-badge">{guest.checkedInAt ? 'Hadir' : 'Belum'}</b>
                      <span>{guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleTimeString('id-ID') : '-'}</span>
                      <div className="row-actions">
                        <button onClick={() => void openQR(guest)} type="button">QR</button>
                        {guest.checkedInAt ? (
                          <button className="danger" onClick={() => void resetCheckin(guest)} type="button">
                            Reset
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </article>

      {qrGuest ? (
        <div
          role="presentation"
          onClick={() => {
            setQrGuest(null)
            setQrSrc('')
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: 24, borderRadius: 16, textAlign: 'center', minWidth: 280 }}
          >
            <h3 style={{ marginTop: 0 }}>{qrGuest.name}</h3>
            {qrSrc ? (
              <img alt={`QR ${qrGuest.name}`} src={qrSrc} style={{ width: 256, height: 256 }} />
            ) : (
              <p>Memuat QR...</p>
            )}
            <p style={{ fontSize: 12, wordBreak: 'break-all' }}>{qrGuest.token}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {qrSrc ? (
                <a className="button secondary" download={`qr-${qrGuest.id}.png`} href={qrSrc}>
                  Unduh QR
                </a>
              ) : null}
              <button className="button primary" onClick={() => { setQrGuest(null); setQrSrc('') }} type="button">
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
