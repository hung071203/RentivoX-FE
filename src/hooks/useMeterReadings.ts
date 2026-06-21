import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meterReadingsApi } from '@/apis/meter-readings.api'
import { getErrorMessage } from '@/utils/error'
import type {
  GetMeterReadingsParams,
  CreateMeterReadingPayload,
  UpdateMeterReadingPayload,
} from '@/types/meter-reading.types'

export function useMeterReadings(params: GetMeterReadingsParams) {
  return useQuery({
    queryKey: ['meter-readings', params],
    queryFn: () => meterReadingsApi.getAll(params),
  })
}

export function useCreateMeterReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMeterReadingPayload) => meterReadingsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meter-readings'] })
      toast.success('Ghi chỉ số thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateMeterReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMeterReadingPayload }) =>
      meterReadingsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meter-readings'] })
      toast.success('Cập nhật chỉ số thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteMeterReading() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => meterReadingsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meter-readings'] })
      toast.success('Xóa bản ghi thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
