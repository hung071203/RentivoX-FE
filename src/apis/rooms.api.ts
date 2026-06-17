import api from '@/lib/axios'
import type { Room, CreateRoomPayload, UpdateRoomPayload, GetRoomsParams } from '@/types/room.types'
import type { PaginatedResult } from '@/types/admin.types'

export const roomsApi = {
  getAll: (params?: GetRoomsParams) =>
    api
      .get<PaginatedResult<Room>>('/landlord/rooms', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Room>(`/landlord/rooms/${id}`).then((r) => r.data),

  create: (data: CreateRoomPayload) =>
    api.post<Room>('/landlord/rooms', data).then((r) => r.data),

  update: (id: string, data: UpdateRoomPayload) =>
    api.patch<Room>(`/landlord/rooms/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/landlord/rooms/${id}`).then((r) => r.data),
}
