import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tenantsApi } from '@/apis/tenants.api'
import { getErrorMessage } from '@/utils/error'
import type { CreateTenantPayload, UpdateTenantPayload, GetTenantsParams } from '@/types/tenant.types'

export function useTenants(params?: GetTenantsParams) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => tenantsApi.getAll(params),
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTenantPayload) => tenantsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tạo khách thuê thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantPayload }) =>
      tenantsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Cập nhật thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Xóa khách thuê thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUploadTenantIdCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, side, file }: { id: string; side: 'front' | 'back'; file: File }) =>
      tenantsApi.uploadIdCard(id, side, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tải ảnh CCCD thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
