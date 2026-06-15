import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '@/apis/contracts.api'
import type { CreateContractDto, TerminateContractDto } from '@/types/contract.types'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: contractsApi.getAll,
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
    mutationFn: (data: CreateContractDto) => contractsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })
}

export function useTerminateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TerminateContractDto }) =>
      contractsApi.terminate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })
}
