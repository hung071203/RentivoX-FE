import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/apis/payments.api'
import type { CreatePaymentDto } from '@/types/payment.types'

export function usePayments(invoiceId?: string) {
  return useQuery({
    queryKey: ['payments', { invoiceId }],
    queryFn: () => paymentsApi.getAll(invoiceId),
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentDto) => paymentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  })
}
