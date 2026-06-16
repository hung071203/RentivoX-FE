export type UserRole = 'super_admin' | 'admin' | 'landlord' | 'tenant'

export interface User {
  id: string
  email: string
  role: UserRole
  fullName: string
  phone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
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
