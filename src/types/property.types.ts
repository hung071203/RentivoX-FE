export interface Property {
  id: string
  landlordId: string
  name: string
  address: string
  ward: string | null
  district: string | null
  province: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePropertyPayload {
  name: string
  address: string
  ward?: string
  district?: string
  province?: string
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>

export interface GetPropertiesParams {
  page?: number
  limit?: number
  search?: string
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}
