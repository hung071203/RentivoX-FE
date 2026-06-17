import api from '@/lib/axios'
import type { User } from '@/types/auth.types'
import type {
  UpdateProfilePayload,
  SendOtpEmailPayload,
  UpdateEmailPayload,
  UpdatePasswordPayload,
} from '@/types/profile.types'

export const profileApi = {
  getProfile: () =>
    api.get<User>('/profile').then((r) => r.data),

  updateProfile: (data: UpdateProfilePayload) =>
    api.patch<User>('/profile', data).then((r) => r.data),

  sendOtpForEmailChange: (data: SendOtpEmailPayload) =>
    api.post<{ message: string }>('/profile/email/send-otp', data).then((r) => r.data),

  updateEmail: (data: UpdateEmailPayload) =>
    api.patch<User>('/profile/email', data).then((r) => r.data),

  updatePassword: (data: UpdatePasswordPayload) =>
    api.patch('/profile/password', data).then((r) => r.data),
}
