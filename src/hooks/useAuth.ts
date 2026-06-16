'use client'
import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/apis/auth.api'
import { profileApi } from '@/apis/profile.api'
import { useAuthStore } from '@/stores/auth.store'
import { setToken, removeToken } from '@/utils/auth'
import { getErrorMessage } from '@/utils/error'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setToken(data.accessToken)
      setAuth(data.user)
      router.push('/properties')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useMe() {
  const { setAuth } = useAuthStore()

  const query = useQuery({
    queryKey: ['me'],
    queryFn: profileApi.getProfile,
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (query.data) {
      setAuth({ id: query.data.id, email: query.data.email, fullName: query.data.fullName, role: query.data.role })
    }
  }, [query.data])

  return query
}

export function useLogout() {
  const { logout } = useAuthStore()
  const router = useRouter()

  return () => {
    removeToken()
    logout()
    router.push('/login')
  }
}
