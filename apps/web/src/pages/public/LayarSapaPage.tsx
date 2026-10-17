import { apiURL } from '../../app/api'
import type { CheckinFeedItem } from '../../app/types'
import { useEffect, useState } from 'react'

type FeedStatus = 'loading' | 'ok' | 'forbidden' | 'notfound' | 'error'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function LayarSapaPage({ slug, screenKey }: { slug: string; screenKey: string }) {
  const [items, setItems] = useState<CheckinFeedItem[]>([])
  const [status, setStatus] = useState<FeedStatus>('loading')

  useEffect(() => {
    document.title = 'Layar Sapa'
    return () => {
      document.title = 'Link Undang'
    }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch(apiURL(`/api/v1/checkin/${slug}/feed?key=${encodeURIComponent(screenKey)}`))
        if (!active) return
        if (res.ok) {
          setItems(await res.json() as CheckinFeedItem[])
          setStatus('ok')
        } else if (res.status === 403) {
          setStatus('forbidden')
        } else if (res.status === 404) {
          setStatus('notfound')
        } else {
          setStatus('error')
        }
      } catch {
        if (active) setStatus('error')
      }
    }
    void load()
    const timer = window.setInterval(load, 4000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [slug, screenKey])

  const latest = items[0]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, #1b2a4a 0%, #0b1220 70%)',
      color: '#fff',
      fontFamily: "'Poppins', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      padding: '5vh 6vw',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes layar-pop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .layar-name { animation: layar-pop 0.7s ease-out; }
      `}</style>

      {status === 'forbidden' ? (
        <Center title="Link layar tidak valid" detail="Minta ulang link layar sapa dari dashboard." />
      ) : status === 'notfound' ? (
        <Center title="Undangan tidak ditemukan" detail="Periksa kembali slug undangan." />
      ) : status === 'error' ? (
        <Center title="Gagal memuat layar" detail="Coba muat ulang halaman ini." />
      ) : (
        <>
          <header style={{ textAlign: 'center', marginBottom: '4vh' }}>
            <p style={{ letterSpacing: 4, textTransform: 'uppercase', opacity: 0.6, margin: 0 }}>Selamat Datang</p>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', margin: '8px 0 0' }}>Layar Sapa Tamu</h1>
          </header>

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {latest ? (
              <>
                <p style={{ fontSize: 'clamp(16px, 1.5vw, 22px)', opacity: 0.7, margin: 0 }}>Tamu terbaru</p>
                <h2 className="layar-name" key={latest.createdAt} style={{
                  fontSize: 'clamp(40px, 8vw, 120px)',
                  margin: '12px 0',
                  textAlign: 'center',
                  background: 'linear-gradient(90deg,#f5d67b,#f0a868)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {latest.guestName}
                </h2>
                <p style={{ opacity: 0.6 }}>Check-in {formatTime(latest.createdAt)}</p>
              </>
            ) : status === 'loading' ? (
              <p style={{ fontSize: 24, opacity: 0.7 }}>Memuat...</p>
            ) : (
              <p style={{ fontSize: 'clamp(20px, 2.4vw, 36px)', opacity: 0.7, textAlign: 'center' }}>
                Menunggu tamu check-in...
              </p>
            )}
          </main>

          {items.length > 1 ? (
            <footer style={{ marginTop: '4vh' }}>
              <p style={{ opacity: 0.5, textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 }}>Tamu sebelumnya</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {items.slice(1, 13).map((item) => (
                  <span key={item.createdAt} style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 'clamp(14px, 1.4vw, 20px)',
                  }}>
                    {item.guestName}
                  </span>
                ))}
              </div>
            </footer>
          ) : null}
        </>
      )}
    </div>
  )
}

function Center({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0 }}>{title}</h1>
      <p style={{ opacity: 0.7 }}>{detail}</p>
    </div>
  )
}
