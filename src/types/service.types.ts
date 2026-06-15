export type ServiceType = 'metered' | 'fixed'

export interface Service {
  id: string
  property_id: string
  name: string
  type: ServiceType
  unit: string | null
  unit_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateServiceDto {
  property_id: string
  name: string
  type: ServiceType
  unit?: string
  unit_price: number
}

export type UpdateServiceDto = Partial<Omit<CreateServiceDto, 'property_id'>>

export interface ContractService {
  id: string
  contract_id: string
  service_id: string
  unit_price: number
  created_at: string
  service?: Service
}

export interface CreateContractServiceDto {
  service_id: string
  unit_price: number
}
