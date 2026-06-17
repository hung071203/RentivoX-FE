import api from '@/lib/axios'
import type { LoginRequest, LoginResponse } from '@/types/auth.types'

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<{ message: string }>('/auth/reset-password', data).then((r) => r.data),
}
