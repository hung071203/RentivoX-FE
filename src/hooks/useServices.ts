import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { servicesApi } from '@/apis/services.api'
import { getErrorMessage } from '@/utils/error'
import type {
  CreateServicePayload,
  UpdateServicePayload,
  GetServicesParams,
} from '@/types/service.types'

export function useServices(params: GetServicesParams) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => servicesApi.getAll(params),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServicePayload) => servicesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Tạo dịch vụ thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      servicesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Cập nhật dịch vụ thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Xóa dịch vụ thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
