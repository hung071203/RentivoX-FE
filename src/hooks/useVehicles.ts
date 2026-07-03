import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { vehiclesApi } from '@/apis/vehicles.api'
import { getErrorMessage } from '@/utils/error'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  GetVehiclesParams,
} from '@/types/vehicle.types'

export function useVehicles(params: GetVehiclesParams) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehiclesApi.getAll(params),
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, image }: { data: CreateVehiclePayload; image: File }) =>
      vehiclesApi.create(data, image),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Đã thêm phương tiện')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, image }: { id: string; data: UpdateVehiclePayload; image?: File }) =>
      vehiclesApi.update(id, data, image),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Đã cập nhật phương tiện')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Đã xóa phương tiện')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
