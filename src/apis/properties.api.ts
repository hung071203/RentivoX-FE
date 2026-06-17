import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/admin.types'
import type {
  CreatePropertyPayload,
  GetPropertiesParams,
  Property,
  UpdatePropertyPayload,
} from '@/types/property.types'

export const propertiesApi = {
  getAll: (params?: GetPropertiesParams) =>
    api
      .get<PaginatedResult<Property>>('/landlord/properties', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Property>(`/landlord/properties/${id}`).then((r) => r.data),

  create: (data: CreatePropertyPayload) =>
    api.post<Property>('/landlord/properties', data).then((r) => r.data),

  update: (id: string, data: UpdatePropertyPayload) =>
    api
      .patch<Property>(`/landlord/properties/${id}`, data)
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/landlord/properties/${id}`).then((r) => r.data),
}
