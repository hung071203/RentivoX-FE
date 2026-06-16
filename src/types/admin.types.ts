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

export interface AdminDashboardStats {
  users: {
    total: number
    landlords: number
    tenants: number
  }
  properties: {
    total: number
  }
  rooms: {
    total: number
    available: number
    occupied: number
  }
  contracts: {
    active: number
  }
  revenueThisMonth: {
    total: number
    invoiceCount: number
  }
}
