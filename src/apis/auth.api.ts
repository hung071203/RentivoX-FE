import api from '@/lib/axios'
import type { LoginRequest, LoginResponse, User } from '@/types/auth.types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  me: () =>
    api.get<User>('/auth/me').then((r) => r.data),
}
