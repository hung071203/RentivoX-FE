import api from '@/lib/axios'
import type { Contract, CreateContractDto, TerminateContractDto } from '@/types/contract.types'

export const contractsApi = {
  getAll: () =>
    api.get<Contract[]>('/contracts').then((r) => r.data),

  getById: (id: string) =>
    api.get<Contract>(`/contracts/${id}`).then((r) => r.data),

  create: (data: CreateContractDto) =>
    api.post<Contract>('/contracts', data).then((r) => r.data),

  terminate: (id: string, data: TerminateContractDto) =>
    api.patch<Contract>(`/contracts/${id}/terminate`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/contracts/${id}`).then((r) => r.data),
}
