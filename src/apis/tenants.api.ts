import api from '@/lib/axios'
import type { Tenant, CreateTenantPayload, UpdateTenantPayload, GetTenantsParams } from '@/types/tenant.types'
import type { PaginatedResult } from '@/types/admin.types'

export const tenantsApi = {
  getAll: (params?: GetTenantsParams) =>
    api.get<PaginatedResult<Tenant>>('/landlord/tenants', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Tenant>(`/landlord/tenants/${id}`).then((r) => r.data),

  create: (data: CreateTenantPayload) =>
    api.post<Tenant>('/landlord/tenants', data).then((r) => r.data),

  update: (id: string, data: UpdateTenantPayload) =>
    api.patch<Tenant>(`/landlord/tenants/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/landlord/tenants/${id}`).then((r) => r.data),

  uploadIdCard: (id: string, side: 'front' | 'back', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<Tenant>(`/landlord/tenants/${id}/id-card/${side}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
