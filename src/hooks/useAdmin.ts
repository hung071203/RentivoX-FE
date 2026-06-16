import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/apis/admin.api'
import { getErrorMessage } from '@/utils/error'
import type { GetUsersParams, CreateUserPayload, UpdateUserPayload } from '@/types/admin.types'

const USERS_KEY = 'admin-users'
const DASHBOARD_KEY = 'admin-dashboard'

export function useAdminUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => adminApi.getUsers(params),
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => adminApi.createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Tạo tài khoản thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Cập nhật thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useToggleActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleActive(id),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success(user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('Đã xóa tài khoản')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: [DASHBOARD_KEY],
    queryFn: adminApi.getDashboardStats,
  })
}
