import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/admin.types'
import type {
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  GetServicesParams,
} from '@/types/service.types'

export const servicesApi = {
  getAll(params: GetServicesParams) {
    return api.get<PaginatedResult<Service>>('/landlord/services', { params }).then(r => r.data)
  },

  getOne(id: string) {
    return api.get<Service>(`/landlord/services/${id}`).then(r => r.data)
  },

  create(payload: CreateServicePayload) {
    return api.post<Service>('/landlord/services', payload).then(r => r.data)
  },

  update(id: string, payload: UpdateServicePayload) {
    return api.patch<Service>(`/landlord/services/${id}`, payload).then(r => r.data)
  },

  remove(id: string) {
    return api.delete(`/landlord/services/${id}`)
  },
}
