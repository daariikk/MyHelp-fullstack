'use client'

import { useRouter } from 'next/navigation'

export default function AdminLogout() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    router.push('/polyclinic/admin/auth')
  }

  return (
    <button onClick={handleLogout} className="logout-button">
      Выйти
    </button>
  )
}