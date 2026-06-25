import api from '@/lib/axios'
import type { LandlordDashboardStats } from '@/types/landlord-dashboard.types'

export const landlordApi = {
  getDashboard: () =>
    api.get<LandlordDashboardStats>('/landlord/dashboard').then((r) => r.data),
}
