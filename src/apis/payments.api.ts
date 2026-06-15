import api from '@/lib/axios'
import type { Payment, CreatePaymentDto } from '@/types/payment.types'

export const paymentsApi = {
  getAll: (invoiceId?: string) =>
    api.get<Payment[]>('/payments', { params: { invoice_id: invoiceId } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Payment>(`/payments/${id}`).then((r) => r.data),

  create: (data: CreatePaymentDto) =>
    api.post<Payment>('/payments', data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/payments/${id}`).then((r) => r.data),
}
