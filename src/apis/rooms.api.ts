import api from '@/lib/axios'
import type { Room, CreateRoomDto, UpdateRoomDto } from '@/types/room.types'

export const roomsApi = {
  getAll: (propertyId?: string) =>
    api.get<Room[]>('/rooms', { params: { property_id: propertyId } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Room>(`/rooms/${id}`).then((r) => r.data),

  create: (data: CreateRoomDto) =>
    api.post<Room>('/rooms', data).then((r) => r.data),

  update: (id: string, data: UpdateRoomDto) =>
    api.patch<Room>(`/rooms/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/rooms/${id}`).then((r) => r.data),
}
