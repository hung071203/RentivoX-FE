import api from '@/lib/axios'
import type { Tenant, CreateTenantDto, UpdateTenantDto } from '@/types/tenant.types'

export const tenantsApi = {
  getAll: () =>
    api.get<Tenant[]>('/tenants').then((r) => r.data),

  getById: (id: string) =>
    api.get<Tenant>(`/tenants/${id}`).then((r) => r.data),

  create: (data: CreateTenantDto) =>
    api.post<Tenant>('/tenants', data).then((r) => r.data),

  update: (id: string, data: UpdateTenantDto) =>
    api.patch<Tenant>(`/tenants/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tenants/${id}`).then((r) => r.data),
}
