'use server'

import { cookies } from 'next/headers'

interface AuthData {
  patientID: number
  accessToken: string
  accessExpires?: string
  refreshToken?: string
  refreshExpires?: string
}

export async function getServerAuthData(): Promise<AuthData | null> {
  const cookiesStore = await cookies();
  const session = cookiesStore.get('session')?.value;
  return session ? JSON.parse(session) : null;
}

export async function serverLogout() {
  const cookiesStore = await cookies();
  cookiesStore.delete('session');
  cookiesStore.delete('access_token');
}

export async function syncAuthData() {
  if (typeof window !== 'undefined') {
    const serverData = await fetch('/api/auth/check').then(res => res.json());
    if (serverData?.status === 'success') {
      localStorage.setItem('auth', JSON.stringify(serverData.data));
    }
  }
}
