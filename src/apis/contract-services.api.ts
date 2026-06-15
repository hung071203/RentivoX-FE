import api from '@/lib/axios'
import type { ContractService, CreateContractServiceDto } from '@/types/service.types'

export const contractServicesApi = {
  getByContract: (contractId: string) =>
    api.get<ContractService[]>(`/contract-services`, { params: { contract_id: contractId } }).then((r) => r.data),

  create: (contractId: string, data: CreateContractServiceDto) =>
    api.post<ContractService>(`/contracts/${contractId}/services`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/contract-services/${id}`).then((r) => r.data),
}
