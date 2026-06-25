'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

export default function TenantRoomPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.TENANT_CONTRACTS)
  }, [router])
  return null
}
