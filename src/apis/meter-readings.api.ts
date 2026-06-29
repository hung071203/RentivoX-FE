import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/admin.types'
import type {
  MeterReading,
  GetMeterReadingsParams,
  CreateMeterReadingPayload,
  UpdateMeterReadingPayload,
} from '@/types/meter-reading.types'

export const meterReadingsApi = {
  getAll(params: GetMeterReadingsParams) {
    return api.get<PaginatedResult<MeterReading>>('/landlord/meter-readings', { params }).then(r => r.data)
  },

  getOne(id: string) {
    return api.get<MeterReading>(`/landlord/meter-readings/${id}`).then(r => r.data)
  },

  create(payload: CreateMeterReadingPayload) {
    return api.post<MeterReading>('/landlord/meter-readings', payload).then(r => r.data)
  },

  update(id: string, payload: UpdateMeterReadingPayload) {
    return api.patch<MeterReading>(`/landlord/meter-readings/${id}`, payload).then(r => r.data)
  },

  remove(id: string) {
    return api.delete(`/landlord/meter-readings/${id}`)
  },

  downloadTemplate() {
    return api.get('/landlord/meter-readings/import/template', { responseType: 'blob' }).then((r) => r.data as Blob)
  },

  importExcel(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<{ success: number; errors: { row: number; message: string }[] }>(
        '/landlord/meter-readings/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data)
  },
}
