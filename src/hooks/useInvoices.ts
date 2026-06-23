import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/apis/invoices.api'
import type { GetInvoicesParams, CreateInvoicePayload } from '@/types/invoice.types'

export function useInvoices(params?: GetInvoicesParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.getAll(params),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useCancelInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}
