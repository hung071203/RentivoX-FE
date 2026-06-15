import api from '@/lib/axios'
import type { Property, CreatePropertyDto, UpdatePropertyDto } from '@/types/property.types'

export const propertiesApi = {
  getAll: () =>
    api.get<Property[]>('/properties').then((r) => r.data),

  getById: (id: string) =>
    api.get<Property>(`/properties/${id}`).then((r) => r.data),

  create: (data: CreatePropertyDto) =>
    api.post<Property>('/properties', data).then((r) => r.data),

  update: (id: string, data: UpdatePropertyDto) =>
    api.patch<Property>(`/properties/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/properties/${id}`).then((r) => r.data),
}
