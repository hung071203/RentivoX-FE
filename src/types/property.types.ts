export interface Property {
  id: string
  landlord_id: string
  name: string
  address: string
  ward: string
  district: string
  province: string
  created_at: string
  updated_at: string
}

export interface CreatePropertyDto {
  name: string
  address: string
  ward: string
  district: string
  province: string
}

export type UpdatePropertyDto = Partial<CreatePropertyDto>
