import type { AuthRequestInput, AuthState, AuthUser } from './types'
import { useEffect, useState } from 'react'

export const apiBase = import.meta.env.VITE_API_URL ?? (
  import.meta.env.DEV ? 'http://localhost:8088' : ''
)

export function apiURL(path: string) {
  return `${apiBase}${path}`
}

export function readStoredAuth(): AuthState {
  try {
    const token = window.localStorage.getItem('auth_token') ?? ''
    const user = window.localStorage.getItem('auth_user')
    return {
      token,
      user: user ? JSON.parse(user) as AuthUser : null,
    }
  } catch {
    return { token: '', user: null }
  }
}

export function storeAuth(next: AuthState) {
  if (next.token) {
    window.localStorage.setItem('auth_token', next.token)
  } else {
    window.localStorage.removeItem('auth_token')
  }
  if (next.user) {
    window.localStorage.setItem('auth_user', JSON.stringify(next.user))
  } else {
    window.localStorage.removeItem('auth_user')
  }
}

export function authHeaders(token: string, json = false) {
  const headers: Record<string, string> = {}
  if (json) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export function useAuthSession() {
  const [auth, setAuthState] = useState<AuthState>(() => readStoredAuth())
  const [authMessage, setAuthMessage] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  function setAuth(next: AuthState) {
    storeAuth(next)
    setAuthState(next)
    window.dispatchEvent(new Event('tier-gate:refresh'))
  }

  useEffect(() => {
    const current = readStoredAuth()
    if (!current.token) {
      return
    }
    let active = true
    fetch(apiURL('/api/auth/me'), { headers: authHeaders(current.token) })
      .then(async (response) => {
        if (!active) return
        if (response.status === 401) {
          setAuth({ token: '', user: null })
          return
        }
        if (response.ok) {
          const user = await response.json() as AuthUser
          setAuth({ token: current.token, user })
        }
      })
      .catch(() => {
        /* offline: keep the stored session */
      })
    return () => {
      active = false
    }
  }, [])

  async function authenticate(mode: 'login' | 'register', input: AuthRequestInput) {
    setIsAuthenticating(true)
    setAuthMessage('')
    try {
      const response = await fetch(apiURL(`/api/auth/${mode}`), {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Autentikasi gagal')
      }
      const payload = await response.json() as { token: string; user: AuthUser }
      setAuth({ token: payload.token, user: payload.user })
      setAuthMessage(mode === 'login' ? 'Login berhasil.' : 'Akun berhasil dibuat.')
      return true
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Autentikasi gagal')
      return false
    } finally {
      setIsAuthenticating(false)
    }
  }

  function logout() {
    const current = readStoredAuth()
    if (current.token) {
      void fetch(apiURL('/api/auth/logout'), {
        headers: authHeaders(current.token),
        method: 'POST',
      }).catch(() => {
        /* best-effort server-side revoke */
      })
    }
    setAuth({ token: '', user: null })
    window.location.href = '/'
  }

  return {
    auth,
    authMessage,
    authenticate,
    isAuthenticating,
    logout,
  }
}
