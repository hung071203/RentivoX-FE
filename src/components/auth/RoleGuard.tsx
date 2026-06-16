'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_HOME } from '@/constants/routes'
import type { UserRole } from '@/types/auth.types'

interface RoleGuardProps {
  role: UserRole
  children: React.ReactNode
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return

    if (!user) {
      router.replace('/login')
      return
    }
    if (user.role !== role) {
      router.replace(ROLE_HOME[user.role])
      return
    }
    setReady(true)
  }, [user, role, router, _hasHydrated])

  if (!ready) return null
  return <>{children}</>
}
