'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/components/ApiClient'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="logout" onClick={logout}>
      <span>Logout</span>
      <span>↗</span>
    </button>
  )
}
