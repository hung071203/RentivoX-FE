'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { ROLE_HOME } from '@/constants/routes'
import type { UserRole } from '@/types/auth.types'

interface RoleGuardProps {
  roles: UserRole | UserRole[]
  children: React.ReactNode
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const allowed = Array.isArray(roles) ? roles : [roles]

  useEffect(() => {
    if (!_hasHydrated) return

    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowed.includes(user.role)) {
      router.replace(ROLE_HOME[user.role])
      return
    }
    setReady(true)
  }, [user, roles, router, _hasHydrated])

  if (!ready) return null
  return <>{children}</>
}
