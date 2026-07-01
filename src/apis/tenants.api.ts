import api from '@/lib/axios'
import type { Tenant, CreateTenantPayload, UpdateTenantPayload, GetTenantsParams, ScanIdCardResult } from '@/types/tenant.types'
import type { PaginatedResult } from '@/types/admin.types'

export const tenantsApi = {
  getAll: (params?: GetTenantsParams) =>
    api.get<PaginatedResult<Tenant>>('/landlord/tenants', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Tenant>(`/landlord/tenants/${id}`).then((r) => r.data),

  scanIdCard: (front: File, back: File) => {
    const fd = new FormData()
    fd.append('front', front)
    fd.append('back', back)
    return api.post<ScanIdCardResult>('/landlord/tenants/scan-id-card', fd).then((r) => r.data)
  },

  create: (data: CreateTenantPayload, files?: { idCardFront?: File; idCardBack?: File }) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
    })
    if (files?.idCardFront) fd.append('idCardFront', files.idCardFront)
    if (files?.idCardBack) fd.append('idCardBack', files.idCardBack)
    return api.post<Tenant>('/landlord/tenants', fd).then((r) => r.data)
  },

  update: (id: string, data: UpdateTenantPayload) =>
    api.patch<Tenant>(`/landlord/tenants/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/landlord/tenants/${id}`).then((r) => r.data),

  toggleActive: (id: string) =>
    api.patch<Tenant>(`/landlord/tenants/${id}/toggle-active`).then((r) => r.data),

  exportExcel: (params: { search?: string; hasAccount?: boolean }) =>
    api.get('/landlord/tenants/export', { params, responseType: 'blob' }).then((r) => r.data as Blob),

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
