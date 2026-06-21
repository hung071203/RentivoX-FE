import api from '@/lib/axios'
import type {
  Contract,
  ContractAmendment,
  RoomOccupant,
  CreateContractPayload,
  CreateAmendmentPayload,
  AddOccupantPayload,
  TerminateContractPayload,
  GetContractsParams,
  PaginatedContracts,
} from '@/types/contract.types'

export const contractsApi = {
  getAll: (params?: GetContractsParams) =>
    api.get<PaginatedContracts>('/landlord/contracts', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Contract>(`/landlord/contracts/${id}`).then((r) => r.data),

  create: (data: CreateContractPayload) => {
    const fd = new FormData()
    if (data.file) fd.append('file', data.file)
    fd.append('roomId', data.roomId)
    fd.append('rentAmount', String(data.rentAmount))
    fd.append('depositAmount', String(data.depositAmount))
    fd.append('startDate', data.startDate)
    fd.append('endDate', data.endDate)
    if (data.notes) fd.append('notes', data.notes)
    fd.append('occupants', JSON.stringify(data.occupants))
    return api.post<Contract>('/landlord/contracts', fd).then((r) => r.data)
  },

  createAmendment: (id: string, data: CreateAmendmentPayload) => {
    const fd = new FormData()
    fd.append('file', data.file)
    fd.append('amendmentType', data.amendmentType)
    fd.append('effectiveDate', data.effectiveDate)
    if (data.newRentAmount !== undefined) fd.append('newRentAmount', String(data.newRentAmount))
    if (data.newEndDate) fd.append('newEndDate', data.newEndDate)
    if (data.notes) fd.append('notes', data.notes)
    if (data.serviceChanges?.length) fd.append('serviceChanges', JSON.stringify(data.serviceChanges))
    if (data.addOccupants?.length) fd.append('addOccupants', JSON.stringify(data.addOccupants))
    return api.post<ContractAmendment>(`/landlord/contracts/${id}/amendments`, fd).then((r) => r.data)
  },

  addOccupant: (id: string, data: AddOccupantPayload) =>
    api.post<RoomOccupant>(`/landlord/contracts/${id}/occupants`, data).then((r) => r.data),

  removeOccupant: (contractId: string, occupantId: string) =>
    api.delete(`/landlord/contracts/${contractId}/occupants/${occupantId}`).then((r) => r.data),

  terminate: (id: string, data: TerminateContractPayload) =>
    api.patch<Contract>(`/landlord/contracts/${id}/terminate`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/landlord/contracts/${id}`).then((r) => r.data),
}
