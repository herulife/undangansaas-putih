import { combineEventDate } from '../app/format'
import { useEffect, useState } from 'react'

export function CountdownTimer({
  className = 'clone-countdown',
  targetDate,
  targetTime = '',
}: {
  className?: string
  targetDate: string
  targetTime?: string
}) {
  const targetMs = combineEventDate(targetDate, targetTime, 0).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const reference = Number.isNaN(targetMs) ? now : targetMs
  const diff = Math.max(0, reference - now)
  const cells: Array<[string, number]> = [
    ['Hari', Math.floor(diff / 86_400_000)],
    ['Jam', Math.floor((diff % 86_400_000) / 3_600_000)],
    ['Menit', Math.floor((diff % 3_600_000) / 60_000)],
    ['Detik', Math.floor((diff % 60_000) / 1000)],
  ]

  return (
    <div className={className}>
      {cells.map(([label, value]) => (
        <b key={label}>
          {String(value).padStart(2, '0')}
          <small>{label}</small>
        </b>
      ))}
    </div>
  )
}
