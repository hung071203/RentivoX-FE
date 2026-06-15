import api from '@/lib/axios'
import type { Invoice } from '@/types/invoice.types'

export const invoicesApi = {
  getAll: (contractId?: string) =>
    api.get<Invoice[]>('/invoices', { params: { contract_id: contractId } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Invoice>(`/invoices/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch<Invoice>(`/invoices/${id}/status`, { status }).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<Invoice>(`/invoices/${id}/cancel`).then((r) => r.data),
}
