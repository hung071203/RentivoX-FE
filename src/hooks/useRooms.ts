import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '@/apis/rooms.api'
import type { CreateRoomDto, UpdateRoomDto } from '@/types/room.types'

export function useRooms(propertyId?: string) {
  return useQuery({
    queryKey: ['rooms', { propertyId }],
    queryFn: () => roomsApi.getAll(propertyId),
  })
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoomDto) => roomsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomDto }) =>
      roomsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}
