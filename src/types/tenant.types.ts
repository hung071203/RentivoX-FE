export type Gender = 'male' | 'female' | 'other'

export interface TenantUser {
  id: string
  isActive: boolean
}

export interface Tenant {
  id: string
  userId: string | null
  user?: TenantUser | null
  landlordId: string
  fullName: string
  phone: string | null
  email: string | null
  idCardNumber: string | null
  idCardIssuedDate: string | null
  idCardIssuedPlace: string | null
  dateOfBirth: string | null
  gender: Gender | null
  permanentAddress: string | null
  idCardFrontUrl: string | null
  idCardBackUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTenantPayload {
  fullName: string
  email?: string
  phone?: string
  idCardNumber?: string
  idCardIssuedDate?: string
  idCardIssuedPlace?: string
  dateOfBirth?: string
  gender?: Gender
  permanentAddress?: string
  createAccount?: boolean
}

export type UpdateTenantPayload = Partial<CreateTenantPayload>

export interface ScanIdCardResult {
  idCardNumber?: string
  fullName?: string
  dateOfBirth?: string
  gender?: Gender
  permanentAddress?: string
  idCardIssuedDate?: string
  idCardIssuedPlace?: string
}

export interface GetTenantsParams {
  page?: number
  limit?: number
  search?: string
  hasAccount?: boolean
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}
