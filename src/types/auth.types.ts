export type UserRole = 'admin' | 'landlord' | 'tenant'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}
