import type { Property } from './property.types'

export type RoomType = 'shared' | 'private'
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'

export interface Room {
  id: string
  propertyId: string
  property?: Pick<Property, 'id' | 'name'>
  roomNumber: string
  floor: number | null
  roomType: RoomType
  areaM2: number | null
  basePrice: number
  maxOccupants: number | null
  hasPrivateWc: boolean
  hasKitchen: boolean
  hasAc: boolean
  status: RoomStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRoomPayload {
  propertyId: string
  roomNumber: string
  floor?: number | null
  roomType: RoomType
  areaM2?: number | null
  basePrice: number
  maxOccupants: number
  hasPrivateWc?: boolean
  hasKitchen?: boolean
  hasAc?: boolean
  notes?: string
}

export interface UpdateRoomPayload {
  roomNumber?: string
  floor?: number | null
  roomType?: RoomType
  areaM2?: number | null
  basePrice?: number
  maxOccupants?: number | null
  hasPrivateWc?: boolean
  hasKitchen?: boolean
  hasAc?: boolean
  notes?: string
  status?: RoomStatus
}

export interface GetRoomsParams {
  page?: number
  limit?: number
  search?: string
  propertyId?: string
  status?: RoomStatus
  roomType?: RoomType
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}
