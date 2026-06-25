import { useQuery } from '@tanstack/react-query'
import { landlordApi } from '@/apis/landlord.api'

export function useLandlordDashboard() {
  return useQuery({
    queryKey: ['landlord-dashboard'],
    queryFn: () => landlordApi.getDashboard(),
  })
}
