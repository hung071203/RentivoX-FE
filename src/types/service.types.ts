import type { Property } from './property.types'

export type ServiceType = 'metered' | 'fixed'

export interface Service {
  id: string
  propertyId: string
  property?: Pick<Property, 'id' | 'name'>
  name: string
  type: ServiceType
  unit: string | null
  unitPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServicePayload {
  propertyId: string
  name: string
  type: ServiceType
  unit?: string
  unitPrice: number
}

export interface UpdateServicePayload {
  name?: string
  type?: ServiceType
  unit?: string
  unitPrice?: number
  isActive?: boolean
}

export interface GetServicesParams {
  page?: number
  limit?: number
  propertyId?: string
  roomId?: string
  type?: ServiceType
  isActive?: boolean
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}
