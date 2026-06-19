import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contractsApi } from '@/apis/contracts.api'
import { getErrorMessage } from '@/utils/error'
import type {
  CreateContractPayload,
  CreateAmendmentPayload,
  AddOccupantPayload,
  TerminateContractPayload,
  GetContractsParams,
} from '@/types/contract.types'

export function useContracts(params?: GetContractsParams) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: () => contractsApi.getAll(params),
  })
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: () => contractsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContractPayload) => contractsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Tạo hợp đồng thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateAmendment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAmendmentPayload }) =>
      contractsApi.createAmendment(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['contracts', id] })
      qc.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Tạo phụ lục thành công')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAddOccupant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddOccupantPayload }) =>
      contractsApi.addOccupant(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['contracts', id] })
      toast.success('Đã thêm người ở')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRemoveOccupant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, occupantId }: { contractId: string; occupantId: string }) =>
      contractsApi.removeOccupant(contractId, occupantId),
    onSuccess: (_res, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contracts', contractId] })
      toast.success('Đã xóa người ở')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useTerminateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TerminateContractPayload }) =>
      contractsApi.terminate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Đã chấm dứt hợp đồng')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contractsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Đã xóa hợp đồng')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
