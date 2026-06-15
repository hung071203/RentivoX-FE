import axios from 'axios'
import { toast } from 'sonner'
import { getToken, removeToken } from '@/utils/auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes('/auth')
    if (err.response?.status === 401 && !isAuthRequest) {
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại')
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
