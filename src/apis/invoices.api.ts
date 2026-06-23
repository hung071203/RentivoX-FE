import api from '@/lib/axios'
import type { Invoice, GetInvoicesParams, CreateInvoicePayload } from '@/types/invoice.types'
import type { PaginatedResult } from '@/types/admin.types'

export const invoicesApi = {
  getAll: (params?: GetInvoicesParams) =>
    api.get<PaginatedResult<Invoice>>('/landlord/invoices', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Invoice>(`/landlord/invoices/${id}`).then((r) => r.data),

  create: (payload: CreateInvoicePayload) =>
    api.post<Invoice>('/landlord/invoices', payload).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<Invoice>(`/landlord/invoices/${id}/cancel`).then((r) => r.data),
}
