import api from '@/lib/axios'
import type { Contract, PaginatedContracts } from '@/types/contract.types'
import type { Invoice } from '@/types/invoice.types'
import type { Payment, PaginatedPayments } from '@/types/payment.types'
import type { PaginatedResult } from '@/types/admin.types'
import type { TenantDashboardStats, TenantRoomDetail } from '@/types/tenant-dashboard.types'
import type { ContractStatus } from '@/types/contract.types'
import type { InvoiceStatus } from '@/types/invoice.types'
import type { PaymentMethod } from '@/types/payment.types'

export interface GetTenantContractsParams {
  page?: number
  limit?: number
  status?: ContractStatus
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface GetTenantInvoicesParams {
  page?: number
  limit?: number
  status?: InvoiceStatus
  period?: string
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface GetTenantPaymentsParams {
  page?: number
  limit?: number
  paymentMethod?: PaymentMethod
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export const tenantApi = {
  getDashboard: () =>
    api.get<TenantDashboardStats>('/tenant/dashboard').then((r) => r.data),

  getRoom: () =>
    api.get<TenantRoomDetail>('/tenant/room').then((r) => r.data),

  getContracts: (params?: GetTenantContractsParams) =>
    api.get<PaginatedContracts>('/tenant/contracts', { params }).then((r) => r.data),

  getContractById: (id: string) =>
    api.get<Contract>(`/tenant/contracts/${id}`).then((r) => r.data),

  getInvoices: (params?: GetTenantInvoicesParams) =>
    api.get<PaginatedResult<Invoice>>('/tenant/invoices', { params }).then((r) => r.data),

  getInvoiceById: (id: string) =>
    api.get<Invoice>(`/tenant/invoices/${id}`).then((r) => r.data),

  getPayments: (params?: GetTenantPaymentsParams) =>
    api.get<PaginatedResult<Payment>>('/tenant/payments', { params }).then((r) => r.data),

  getPaymentById: (id: string) =>
    api.get<Payment>(`/tenant/payments/${id}`).then((r) => r.data),
}
