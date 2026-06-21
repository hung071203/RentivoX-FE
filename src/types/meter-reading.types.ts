export interface MeterReading {
  id: string
  roomId: string
  serviceId: string
  room: {
    id: string
    roomNumber: string
    roomType: 'shared' | 'private'
    propertyId: string
    property: { id: string; name: string }
  }
  service: {
    id: string
    name: string
    unit: string | null
    unitPrice: number
  }
  period: string
  valueStart: number
  valueEnd: number
  consumption: number
  contractCount: number
  unitPrice: number
  amountPerContract: number
  totalAmount: number
  recordedAt: string | null
  recordedById: string
  recordedBy: { id: string; fullName: string } | null
  createdAt: string
  updatedAt: string
}

export interface GetMeterReadingsParams {
  page?: number
  limit?: number
  propertyId?: string
  roomId?: string
  period?: string
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface CreateMeterReadingPayload {
  roomId: string
  serviceId: string
  period: string
  valueStart: number
  valueEnd: number
}

export interface UpdateMeterReadingPayload {
  valueStart?: number
  valueEnd?: number
}
