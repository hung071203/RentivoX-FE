import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/admin.types'
import type {
  Vehicle,
  CreateVehiclePayload,
  UpdateVehiclePayload,
  GetVehiclesParams,
} from '@/types/vehicle.types'

function toFormData(data: CreateVehiclePayload | UpdateVehiclePayload, image?: File) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
  })
  if (image) fd.append('image', image)
  return fd
}

export const vehiclesApi = {
  getAll(params: GetVehiclesParams) {
    return api.get<PaginatedResult<Vehicle>>('/landlord/vehicles', { params }).then(r => r.data)
  },

  getOne(id: string) {
    return api.get<Vehicle>(`/landlord/vehicles/${id}`).then(r => r.data)
  },

  create(data: CreateVehiclePayload, image: File) {
    return api.post<Vehicle>('/landlord/vehicles', toFormData(data, image)).then(r => r.data)
  },

  update(id: string, data: UpdateVehiclePayload, image?: File) {
    return api.patch<Vehicle>(`/landlord/vehicles/${id}`, toFormData(data, image)).then(r => r.data)
  },

  remove(id: string) {
    return api.delete(`/landlord/vehicles/${id}`)
  },
}
