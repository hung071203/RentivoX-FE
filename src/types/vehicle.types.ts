export type VehicleType = 'motorbike' | 'car' | 'bicycle' | 'other'

export interface VehicleProperty {
  id: string
  name: string
}

export interface VehicleTenant {
  id: string
  fullName: string
  phone?: string | null
}

export interface Vehicle {
  id: string
  tenantId: string
  propertyId: string
  plateNumber: string
  vehicleType: VehicleType
  imageUrl: string
  brand?: string | null
  color?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  property?: VehicleProperty
  tenant?: VehicleTenant
}

export interface CreateVehiclePayload {
  tenantId: string
  propertyId: string
  plateNumber: string
  vehicleType: VehicleType
  brand?: string
  color?: string
  notes?: string
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>

export interface GetVehiclesParams {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  propertyId?: string
  tenantId?: string
  search?: string
}
