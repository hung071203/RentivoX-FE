import type { Gender, UserRole } from './auth.types'

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  isActive?: boolean
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface CreateUserPayload {
  email: string
  fullName: string
  role: UserRole
  phone: string
  dateOfBirth?: string
  gender?: Gender
}

export interface UpdateUserPayload {
  fullName?: string
  email?: string
  phone?: string
  isResetPassword?: boolean
  dateOfBirth?: string
  gender?: Gender
}

export interface GetAdminPropertiesParams {
  page?: number
  limit?: number
  search?: string
  landlordId?: string
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface AdminProperty {
  id: string
  name: string
  address: string
  ward: string | null
  district: string | null
  province: string | null
  createdAt: string
  landlord: {
    id: string
    fullName: string
    email: string
  } | null
  rooms: {
    total: number
    available: number
    occupied: number
    maintenance: number
    reserved: number
  }
}

export interface TopLandlord {
  id: string
  fullName: string
  email: string
  totalProperties: number
  totalRooms: number
  occupiedRooms: number
}

export interface AdminDashboardStats {
  totalLandlords: number
  totalTenants: number
  totalProperties: number
  totalRooms: number
  occupiedRooms: number
  occupancyRate: number
  topLandlords: TopLandlord[]
}
