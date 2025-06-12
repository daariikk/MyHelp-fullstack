'use client'

interface AuthData {
  patientID: number
  accessToken: string
  refreshToken?: string
}

export function getClientAuthData(): AuthData | null {
  if (typeof window !== 'undefined') {
    try {
      const auth = localStorage.getItem('auth')
      return auth ? JSON.parse(auth) : null
    } catch {
      return null
    }
  }
  return null
}

export function clientLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth')
    sessionStorage.removeItem('auth')
    fetch('/api/auth/logout', { method: 'POST' })
  }
}