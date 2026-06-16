'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_HOME } from '@/constants/routes'

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return

    if (!user) {
      router.replace('/login')
    } else {
      router.replace(ROLE_HOME[user.role])
    }
  }, [user, _hasHydrated, router])

  return null
}
