import { apiURL, authHeaders } from '../../app/api'
import type { CheckinResult } from '../../app/types'
import { useEffect, useState } from 'react'

type ScanStatus = 'auth' | 'loading' | 'done' | 'notfound' | 'forbidden' | 'error'

export function ScanCheckinPage({ token }: { token: string }) {
  const [status, setStatus] = useState<ScanStatus>(() =>
    window.localStorage.getItem('auth_token') ? 'loading' : 'auth',
  )
  const [result, setResult] = useState<CheckinResult | null>(null)

  useEffect(() => {
    document.title = 'Check-in Tamu'
    const auth = window.localStorage.getItem('auth_token') ?? ''
    if (!auth) {
      return
    }
    let active = true
    async function run() {
      try {
        const res = await fetch(apiURL('/api/checkin'), {
          method: 'POST',
          headers: authHeaders(auth, true),
          body: JSON.stringify({ token }),
        })
        if (!active) return
        if (res.ok) {
          setResult(await res.json() as CheckinResult)
          setStatus('done')
        } else if (res.status === 404) {
          setStatus('notfound')
        } else if (res.status === 403) {
          setStatus('forbidden')
        } else {
          setStatus('error')
        }
      } catch {
        if (active) setStatus('error')
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [token])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0b1220',
      color: '#fff',
      fontFamily: "'Poppins', system-ui, sans-serif",
      padding: 24,
      textAlign: 'center',
    }}>
      <div style={{
        background: '#151f36',
        borderRadius: 20,
        padding: '40px 32px',
        maxWidth: 420,
        width: '100%',
      }}>
        <p style={{ letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, fontSize: 12 }}>Check-in Tamu</p>
        {status === 'auth' ? (
          <>
            <h1 style={{ fontSize: 24 }}>Silakan login dulu</h1>
            <p style={{ opacity: 0.7 }}>Login sebagai pemilik undangan untuk memproses check-in ini.</p>
            <a className="button primary" href="/login">Masuk</a>
          </>
        ) : status === 'loading' ? (
          <h1 style={{ fontSize: 24 }}>Memproses check-in...</h1>
        ) : status === 'done' && result ? (
          <>
            <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '12px 0' }}>
              {result.alreadyCheckedIn ? 'Sudah check-in' : 'Check-in berhasil'}
            </h1>
            <p style={{ fontSize: 22, fontWeight: 600 }}>{result.guest.name}</p>
            <p style={{ opacity: 0.7 }}>
              {result.guest.checkedInAt ? new Date(result.guest.checkedInAt).toLocaleString('id-ID') : ''}
            </p>
            <a className="button secondary" href={`/dashboard/checkin/${result.slug}`}>Buka dashboard check-in</a>
          </>
        ) : status === 'notfound' ? (
          <h1 style={{ fontSize: 24 }}>Kode QR tidak dikenali</h1>
        ) : status === 'forbidden' ? (
          <h1 style={{ fontSize: 24 }}>Bukan undangan Anda</h1>
        ) : (
          <h1 style={{ fontSize: 24 }}>Gagal memproses check-in</h1>
        )}
      </div>
    </div>
  )
}
