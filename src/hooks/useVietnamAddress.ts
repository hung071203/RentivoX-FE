import { useQuery } from '@tanstack/react-query'

const BASE = 'https://provinces.open-api.vn/api/v2'

export interface VnProvince {
  name: string
  code: number
  division_type: string
  codename: string
  phone_code: number
}

export interface VnWard {
  name: string
  code: number
  division_type: string
  codename: string
  province_code: number
}

export interface VnProvinceWithWards extends VnProvince {
  wards: VnWard[]
}

async function fetchProvinces(): Promise<VnProvince[]> {
  const r = await fetch(`${BASE}/`)
  if (!r.ok) throw new Error('Không thể tải danh sách tỉnh/thành phố')
  return r.json()
}

// v2: tỉnh/thành có wards trực tiếp (không còn cấp quận/huyện)
async function fetchWardsByProvince(provinceCode: number): Promise<VnProvinceWithWards> {
  const r = await fetch(`${BASE}/p/${provinceCode}?depth=2`)
  if (!r.ok) throw new Error('Không thể tải danh sách phường/xã')
  return r.json()
}

export function useVnProvinces() {
  return useQuery({
    queryKey: ['vn-provinces'],
    queryFn: fetchProvinces,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useVnWards(provinceCode: number | null) {
  return useQuery({
    queryKey: ['vn-wards', provinceCode],
    queryFn: () => fetchWardsByProvince(provinceCode!),
    enabled: provinceCode !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
