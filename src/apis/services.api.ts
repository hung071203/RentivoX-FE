import api from '@/lib/axios'
import type { Service, CreateServiceDto, UpdateServiceDto } from '@/types/service.types'

export const servicesApi = {
  getAll: (propertyId?: string) =>
    api.get<Service[]>('/services', { params: { property_id: propertyId } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Service>(`/services/${id}`).then((r) => r.data),

  create: (data: CreateServiceDto) =>
    api.post<Service>('/services', data).then((r) => r.data),

  update: (id: string, data: UpdateServiceDto) =>
    api.patch<Service>(`/services/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/services/${id}`).then((r) => r.data),
}
