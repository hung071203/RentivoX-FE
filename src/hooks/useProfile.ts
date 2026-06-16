'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { profileApi } from '@/apis/profile.api'
import { useAuthStore } from '@/stores/auth.store'
import { getErrorMessage } from '@/utils/error'
import type { UpdateProfilePayload, UpdateEmailPayload, UpdatePasswordPayload } from '@/types/profile.types'

export function useGetProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: profileApi.getProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => profileApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      setAuth({ id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role })
      toast.success('Cập nhật thông tin thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateEmail() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (data: UpdateEmailPayload) => profileApi.updateEmail(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      setAuth({ id: updated.id, email: updated.email, fullName: updated.fullName, role: updated.role })
      toast.success('Cập nhật email thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordPayload) => profileApi.updatePassword(data),
    onSuccess: () => toast.success('Đổi mật khẩu thành công'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
