import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { roomsApi } from '@/apis/rooms.api'
import { getErrorMessage } from '@/utils/error'
import type { CreateRoomPayload, UpdateRoomPayload, GetRoomsParams } from '@/types/room.types'

export function useRooms(params?: GetRoomsParams) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: () => roomsApi.getAll(params),
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
    mutationFn: (data: CreateRoomPayload) => roomsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Tạo phòng thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomPayload }) =>
      roomsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Cập nhật phòng thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Xóa phòng thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
