import type { Gender } from './auth.types'

export interface UpdateProfilePayload {
  fullName?: string
  phone?: string
  dateOfBirth?: string | null
  gender?: Gender | null
}

export interface SendOtpEmailPayload {
  newEmail: string
}

export interface UpdateEmailPayload {
  newEmail: string
  otp: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
