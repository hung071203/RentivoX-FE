export type RoomType = 'shared' | 'private'
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'

export interface Room {
  id: string
  property_id: string
  room_number: string
  floor: number
  room_type: RoomType
  area_m2: number
  base_price: number
  max_occupants: number
  has_private_wc: boolean
  has_kitchen: boolean
  has_ac: boolean
  status: RoomStatus
  notes: string
  created_at: string
  updated_at: string
}

export interface CreateRoomDto {
  property_id: string
  room_number: string
  floor: number
  room_type: RoomType
  area_m2: number
  base_price: number
  max_occupants: number
  has_private_wc?: boolean
  has_kitchen?: boolean
  has_ac?: boolean
  notes?: string
}

export type UpdateRoomDto = Partial<Omit<CreateRoomDto, 'property_id'>>
