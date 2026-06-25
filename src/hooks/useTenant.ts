import { useQuery } from '@tanstack/react-query'
import {
  tenantApi,
  type GetTenantContractsParams,
  type GetTenantInvoicesParams,
  type GetTenantPaymentsParams,
} from '@/apis/tenant.api'

export function useTenantDashboard() {
  return useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: () => tenantApi.getDashboard(),
  })
}

export function useTenantRoom(enabled = true) {
  return useQuery({
    queryKey: ['tenant-room'],
    queryFn: () => tenantApi.getRoom(),
    enabled,
    retry: false,
  })
}

export function useTenantContracts(params?: GetTenantContractsParams) {
  return useQuery({
    queryKey: ['tenant-contracts', params],
    queryFn: () => tenantApi.getContracts(params),
  })
}

export function useTenantContract(id: string) {
  return useQuery({
    queryKey: ['tenant-contracts', id],
    queryFn: () => tenantApi.getContractById(id),
    enabled: !!id,
  })
}

export function useTenantInvoices(params?: GetTenantInvoicesParams) {
  return useQuery({
    queryKey: ['tenant-invoices', params],
    queryFn: () => tenantApi.getInvoices(params),
  })
}

export function useTenantInvoice(id: string) {
  return useQuery({
    queryKey: ['tenant-invoices', id],
    queryFn: () => tenantApi.getInvoiceById(id),
    enabled: !!id,
  })
}

export function useTenantPayments(params?: GetTenantPaymentsParams) {
  return useQuery({
    queryKey: ['tenant-payments', params],
    queryFn: () => tenantApi.getPayments(params),
  })
}

export function useTenantPayment(id: string) {
  return useQuery({
    queryKey: ['tenant-payments', id],
    queryFn: () => tenantApi.getPaymentById(id),
    enabled: !!id,
  })
}
