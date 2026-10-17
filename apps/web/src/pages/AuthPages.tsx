import { apiURL, authHeaders, readStoredAuth } from '../app/api'
import type { AuthRequestInput, AuthUser } from '../app/types'
import { LoadingPage, NotFoundPage } from '../components/common'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

export function AuthPage({
  authMessage,
  isAuthenticating,
  mode,
  onAuthenticate,
}: {
  authMessage: string
  isAuthenticating: boolean
  mode: 'login' | 'register'
  onAuthenticate: (mode: 'login' | 'register', input: AuthRequestInput) => Promise<boolean>
}) {
  const [form, setForm] = useState<AuthRequestInput>({
    displayName: '',
    email: '',
    password: '',
  })
  const isRegister = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await onAuthenticate(mode, form)
    if (ok) {
      window.location.href = '/dashboard/undangan'
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          <span>L</span>
          <strong>LinkUndang</strong>
        </a>
        <p className="eyebrow">{isRegister ? 'Daftar akun' : 'Masuk dashboard'}</p>
        <h1>{isRegister ? 'Buat undangan pertama kamu.' : 'Lanjutkan undangan yang sedang dikerjakan.'}</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Nama
              <input
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="Nama kamu"
                required
                type="text"
                value={form.displayName}
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="nama@email.com"
              required
              type="email"
              value={form.email}
            />
          </label>
          <label>
            Password
            <input
              minLength={8}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimal 8 karakter"
              required
              type="password"
              value={form.password}
            />
          </label>
          {!isRegister ? (
            <p className="auth-switch">
              <a href="/forgot-password">Lupa password?</a>
            </p>
          ) : null}
          <button className="button primary" disabled={isAuthenticating} type="submit">
            {isAuthenticating ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
          </button>
          {authMessage ? <p className="form-message">{authMessage}</p> : null}
        </form>
        <p className="auth-switch">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
          {' '}
          <a href={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Masuk' : 'Daftar gratis'}
          </a>
        </p>
      </section>
    </main>
  )
}

export function VerifyEmailPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [status, setStatus] = useState<'error' | 'loading' | 'missing' | 'success'>(token ? 'loading' : 'missing')

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    async function run() {
      try {
        const response = await fetch(apiURL('/api/auth/verify-email'), {
          body: JSON.stringify({ token }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!cancelled) {
          setStatus(response.ok ? 'success' : 'error')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'loading') {
    return <LoadingPage title="Memverifikasi email..." />
  }
  if (status === 'success') {
    return (
      <main className="auth-page">
        <section className="auth-card compact">
          <p className="eyebrow">Email terverifikasi</p>
          <h1>Email kamu berhasil diverifikasi.</h1>
          <p>Terima kasih! Akun LinkUndang kamu sekarang sudah aktif sepenuhnya.</p>
          <a className="button primary" href="/login">Masuk ke dashboard</a>
        </section>
      </main>
    )
  }
  return (
    <NotFoundPage
      description={status === 'missing'
        ? 'Link verifikasi tidak lengkap. Buka kembali tautan langsung dari email kamu.'
        : 'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Minta tautan baru dari dashboard.'}
      title={status === 'missing' ? 'Token verifikasi tidak ditemukan' : 'Verifikasi gagal'}
    />
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const response = await fetch(apiURL('/api/auth/forgot-password'), {
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null
      setMessage(data?.message ?? data?.error ?? 'Permintaan reset password diproses.')
    } catch {
      setMessage('Gagal mengirim permintaan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          <span>L</span>
          <strong>LinkUndang</strong>
        </a>
        <p className="eyebrow">Lupa password</p>
        <h1>Masukkan email untuk menerima tautan reset.</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              required
              type="email"
              value={email}
            />
          </label>
          <button className="button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Mengirim...' : 'Kirim tautan reset'}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
        <p className="auth-switch">
          <a href="/login">Kembali ke halaman masuk</a>
        </p>
      </section>
    </main>
  )
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const response = await fetch(apiURL('/api/auth/reset-password'), {
        body: JSON.stringify({ token, password }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null
      if (!response.ok) {
        setMessage(data?.error ?? 'Gagal reset password.')
        return
      }
      setIsDone(true)
      setMessage(data?.message ?? 'Password berhasil direset.')
    } catch {
      setMessage('Gagal reset password. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <NotFoundPage
        description="Buka kembali tautan reset password yang dikirim ke email kamu."
        title="Token reset tidak ditemukan"
      />
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          <span>L</span>
          <strong>LinkUndang</strong>
        </a>
        <p className="eyebrow">Reset password</p>
        <h1>{isDone ? 'Password berhasil direset.' : 'Buat password baru kamu.'}</h1>
        {isDone ? (
          <p className="auth-switch">
            <a className="button primary" href="/login">Masuk sekarang</a>
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Password Baru
              <input
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                required
                type="password"
                value={password}
              />
            </label>
            <button className="button primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Menyimpan...' : 'Simpan password baru'}
            </button>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        )}
      </section>
    </main>
  )
}

export function EmailVerificationBanner({ authUser }: { authUser: AuthUser | null }) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (!authUser || authUser.emailVerified !== false) {
    return null
  }

  async function resend() {
    setIsSending(true)
    setMessage('')
    try {
      const { token } = readStoredAuth()
      const response = await fetch(apiURL('/api/auth/resend-verification'), {
        headers: authHeaders(token),
        method: 'POST',
      })
      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null
      setMessage(response.ok ? (data?.message ?? 'Email verifikasi dikirim.') : (data?.error ?? 'Gagal mengirim email.'))
    } catch {
      setMessage('Gagal mengirim email. Coba lagi.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <aside className="tier-expiry-banner">
      <div>
        <strong>Email kamu belum diverifikasi</strong>
        <span>Verifikasi email untuk mengamankan akun dan menerima notifikasi undangan.</span>
      </div>
      <button disabled={isSending} onClick={resend} type="button">
        {isSending ? 'Mengirim...' : 'Kirim ulang email'}
      </button>
      {message ? <span>{message}</span> : null}
    </aside>
  )
}
