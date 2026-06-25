export type UserRole = 'super_admin' | 'admin' | 'landlord' | 'tenant'
export type Gender = 'male' | 'female' | 'other'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  phone: string
  isActive: boolean
  dateOfBirth: string | null
  gender: Gender | null
  createdAt: string
  updatedAt: string
  // Chỉ có khi role === 'tenant'
  idCardNumber?: string | null
  idCardIssuedDate?: string | null
  idCardIssuedPlace?: string | null
  permanentAddress?: string | null
  idCardFrontUrl?: string | null
  idCardBackUrl?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export type AuthUser = Pick<User, 'id' | 'email' | 'fullName' | 'role'>

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}
