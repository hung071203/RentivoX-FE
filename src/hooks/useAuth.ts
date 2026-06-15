'use client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi } from '@/apis/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { setToken, removeToken } from '@/utils/auth'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setToken(data.access_token)
      setAuth(data.user)
      router.push('/properties')
    },
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    staleTime: Infinity,
  })
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
