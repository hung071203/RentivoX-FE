import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import roomServicesApi from '@/apis/room-services.api';
import { CreateRoomServicePayload, UpdateRoomServicePayload } from '@/types/room-service.types';
import { getErrorMessage } from '@/utils/error';

export function useRoomServices(roomId: string | null) {
  return useQuery({
    queryKey: ['room-services', roomId],
    queryFn: () => roomServicesApi.getAll(roomId!),
    enabled: !!roomId,
  });
}

export function useCreateRoomService(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomServicePayload) => roomServicesApi.create(roomId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-services', roomId] });
      toast.success('Đã thêm dịch vụ vào phòng');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateRoomService(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomServicePayload }) =>
      roomServicesApi.update(roomId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-services', roomId] });
      toast.success('Đã cập nhật đơn giá');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteRoomService(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomServicesApi.remove(roomId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room-services', roomId] });
      toast.success('Đã xóa dịch vụ khỏi phòng');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
