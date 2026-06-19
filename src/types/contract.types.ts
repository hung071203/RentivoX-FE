import type { Tenant } from './tenant.types'
import type { Service } from './service.types'

export type ContractStatus = 'active' | 'expired' | 'terminated'
export type AmendmentType = 'renewal' | 'price_adjustment' | 'general'
export type DocumentType = 'contract' | 'amendment' | 'other'

export interface RoomRef {
  id: string
  roomNumber: string
  roomType?: 'shared' | 'private'
  property?: { id: string; name: string }
}

export interface RoomOccupant {
  id: string
  contractId: string
  tenantId: string
  tenant?: Pick<Tenant, 'id' | 'fullName' | 'phone'>
  isOwner: boolean
  movedInDate: string
  movedOutDate: string | null
  createdAt: string
}

export interface ContractServiceItem {
  id: string
  contractId: string
  serviceId: string
  service?: Pick<Service, 'id' | 'name' | 'type' | 'unit'>
  unitPrice: number
  createdAt: string
}

export interface ContractDocument {
  id: string
  contractId: string
  type: DocumentType
  fileName: string
  fileUrl: string
  uploadedById: string
  createdAt: string
}

export interface ContractAmendmentServiceItem {
  id: string
  amendmentId: string
  contractServiceId: string
  newUnitPrice: number
}

export interface ContractAmendment {
  id: string
  contractId: string
  documentId: string
  document?: ContractDocument
  amendmentType: AmendmentType
  effectiveDate: string
  isApplied: boolean
  newRentAmount: number | null
  newEndDate: string | null
  notes: string | null
  createdAt: string
  amendmentServices?: ContractAmendmentServiceItem[]
}

export interface Contract {
  id: string
  roomId: string
  room?: RoomRef
  rentAmount: number
  depositAmount: number
  startDate: string
  endDate: string
  status: ContractStatus
  terminatedDate: string | null
  terminatedReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  // loaded only in findOne
  occupants?: RoomOccupant[]
  services?: ContractServiceItem[]
  documents?: ContractDocument[]
  amendments?: ContractAmendment[]
}

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface OccupantInput {
  tenantId: string
  isOwner: boolean
  movedInDate: string
}

export interface ContractServiceInput {
  serviceId: string
  unitPrice: number
}

export interface CreateContractPayload {
  roomId: string
  rentAmount: number
  depositAmount: number
  startDate: string
  endDate: string
  notes?: string
  occupants: OccupantInput[]
  services?: ContractServiceInput[]
  file: File
}

export interface AmendmentServiceChange {
  contractServiceId?: string
  serviceId?: string
  newUnitPrice: number
}

export interface CreateAmendmentPayload {
  amendmentType: AmendmentType
  effectiveDate: string
  newRentAmount?: number
  newEndDate?: string
  notes?: string
  serviceChanges?: AmendmentServiceChange[]
  addOccupants?: OccupantInput[]
  file: File
}

export interface AddOccupantPayload {
  tenantId: string
  movedInDate: string
}

export interface TerminateContractPayload {
  terminatedDate: string
  terminatedReason?: string
}

export interface GetContractsParams {
  page?: number
  limit?: number
  search?: string
  propertyId?: string
  roomId?: string
  status?: ContractStatus
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface PaginatedContracts {
  items: Contract[]
  total: number
  page: number
  limit: number
  totalPages: number
}
