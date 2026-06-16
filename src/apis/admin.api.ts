import api from '@/lib/axios'
import type { User } from '@/types/auth.types'
import type { PaginatedResult, GetUsersParams, AdminDashboardStats, CreateUserPayload, UpdateUserPayload } from '@/types/admin.types'

export const adminApi = {
  // Users
  getUsers: (params?: GetUsersParams) =>
    api.get<PaginatedResult<User>>('/admin/users', { params }).then(r => r.data),

  getUser: (id: string) =>
    api.get<User>(`/admin/users/${id}`).then(r => r.data),

  createUser: (payload: CreateUserPayload) =>
    api.post<User>('/admin/users', payload).then(r => r.data),

  updateUser: (id: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/admin/users/${id}`, payload).then(r => r.data),

  toggleActive: (id: string) =>
    api.patch<User>(`/admin/users/${id}/toggle-active`).then(r => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),

  // Dashboard
  getDashboardStats: () =>
    api.get<AdminDashboardStats>('/admin/dashboard').then(r => r.data),
}
