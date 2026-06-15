import api from '@/lib/axios'
import type { MeterReading, CreateMeterReadingDto } from '@/types/invoice.types'

export const meterReadingsApi = {
  getAll: (contractServiceId?: string) =>
    api
      .get<MeterReading[]>('/meter-readings', { params: { contract_service_id: contractServiceId } })
      .then((r) => r.data),

  create: (data: CreateMeterReadingDto) =>
    api.post<MeterReading>('/meter-readings', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateMeterReadingDto>) =>
    api.patch<MeterReading>(`/meter-readings/${id}`, data).then((r) => r.data),
}
