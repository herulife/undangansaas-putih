import { useEffect, useState } from 'react'
import { apiURL, authHeaders } from '../../app/api'
import type { MediaAsset } from '../../app/types'

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function MediaLibraryPanel() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [usedBytes, setUsedBytes] = useState(0)
  const [limitBytes, setLimitBytes] = useState(0)
  const [message, setMessage] = useState('Memuat media...')

  function load() {
    const token = window.localStorage.getItem('auth_token') ?? ''
    fetch(apiURL('/api/media'), { headers: authHeaders(token) })
      .then(async (response) => {
        if (!response.ok) {
          setMessage('Gagal memuat media.')
          return
        }
        const data = await response.json() as { assets: MediaAsset[]; usedBytes: number; storageLimitBytes: number }
        setAssets(data.assets)
        setUsedBytes(data.usedBytes)
        setLimitBytes(data.storageLimitBytes)
        setMessage(data.assets.length === 0 ? 'Belum ada media. Unggah dari editor.' : '')
      })
      .catch(() => setMessage('Gagal memuat media.'))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    const token = window.localStorage.getItem('auth_token') ?? ''
    const response = await fetch(apiURL(`/api/media/${id}`), {
      headers: authHeaders(token),
      method: 'DELETE',
    })
    if (response.ok) {
      load()
    }
  }

  const percent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0

  return (
    <section className="table-card">
      <div className="table-head">
        <h2>Media Library</h2>
        <span>{formatBytes(usedBytes)} / {limitBytes > 0 ? formatBytes(limitBytes) : 'unlimited'}</span>
      </div>
      {limitBytes > 0 ? (
        <div style={{ height: '8px', background: '#eee', borderRadius: '4px', margin: '12px 0' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: '#1f4f3a', borderRadius: '4px' }} />
        </div>
      ) : null}
      {message ? (
        <p className="empty-state">{message}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {assets.map((asset) => (
            <div key={asset.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px' }}>
              {asset.mediaType === 'images' ? (
                <img alt={asset.fileName} src={asset.url} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
              ) : (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f1e7', borderRadius: '6px' }}>Audio</div>
              )}
              <p style={{ fontSize: '12px', margin: '8px 0 4px', wordBreak: 'break-all' }}>{asset.fileName}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#888' }}>{formatBytes(asset.sizeBytes)}</span>
                <button className="button secondary" onClick={() => void handleDelete(asset.id)} type="button">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
