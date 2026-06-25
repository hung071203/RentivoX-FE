import type { PaymentMethod } from './payment.types'
import type { RoomType } from './room.types'

export interface TenantDashboardPayment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  invoice: {
    invoiceNumber: string
    period: string
  }
}

export interface TenantDashboardStats {
  currentRoom: {
    id: string
    roomNumber: string
    property: { id: string; name: string }
  } | null
  activeContract: {
    id: string
    contractNumber: string | null
    rentAmount: number
    startDate: string
    endDate: string
  } | null
  unpaidInvoiceCount: number
  totalUnpaidAmount: number
  nearestDueDate: string | null
  recentPayments: TenantDashboardPayment[]
}

export interface TenantRoomService {
  id: string
  service: {
    id: string
    name: string
    type: 'metered' | 'fixed'
    unit: string | null
  }
  unitPrice: number
}

export interface TenantRoomOccupant {
  id: string
  tenant: {
    id: string
    fullName: string
    phone: string | null
  }
  isOwner: boolean
  movedInDate: string
}

export interface TenantRoomDetail {
  id: string
  roomNumber: string
  floor: number | null
  roomType: RoomType
  areaM2: number | null
  hasPrivateWc: boolean
  hasKitchen: boolean
  hasAc: boolean
  status: string
  notes: string | null
  property: {
    id: string
    name: string
    address: string
    ward: string
    district: string
    province: string
  }
  contract: {
    id: string
    contractNumber: string | null
    startDate: string
    endDate: string
    rentAmount: number
    depositAmount: number
  }
  services: TenantRoomService[]
  occupants: TenantRoomOccupant[]
}
