import type { Gender } from './auth.types'

export interface UpdateProfilePayload {
  fullName?: string
  phone?: string
  dateOfBirth?: string | null
  gender?: Gender | null
}

export interface UpdateEmailPayload {
  email: string
  currentPassword: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
