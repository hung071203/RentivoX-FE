import api from '@/lib/axios'
import type {
  Payment,
  PaginatedPayments,
  CreatePaymentPayload,
  GetPaymentsParams,
} from '@/types/payment.types'

export const paymentsApi = {
  getAll: (params?: GetPaymentsParams) =>
    api
      .get<PaginatedPayments>('/landlord/payments', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Payment>(`/landlord/payments/${id}`).then((r) => r.data),

  create: (data: CreatePaymentPayload) =>
    api.post<Payment>('/landlord/payments', data).then((r) => r.data),

  exportExcel: (params: { propertyId?: string; paymentMethod?: string; source?: string; referenceCode?: string }) =>
    api.get('/landlord/payments/export', { params, responseType: 'blob' }).then((r) => r.data as Blob),
}
