import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { propertiesApi } from '@/apis/properties.api'
import { getErrorMessage } from '@/utils/error'
import type {
  CreatePropertyPayload,
  GetPropertiesParams,
  UpdatePropertyPayload,
} from '@/types/property.types'

const KEY = 'landlord-properties'

export function useProperties(params?: GetPropertiesParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => propertiesApi.getAll(params),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Tạo nhà trọ thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyPayload }) =>
      propertiesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Cập nhật nhà trọ thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Đã xóa nhà trọ')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
