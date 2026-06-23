export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled'

export interface InvoiceItemService {
  id: string
  name: string
  type: string
  unit: string | null
}

export interface InvoiceItemContractService {
  id: string
  serviceId: string
  service?: InvoiceItemService
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  contractServiceId: string | null
  contractService?: InvoiceItemContractService
  quantity: number
  unitPrice: number
  amount: number
  createdAt: string
}

export interface InvoiceContract {
  id: string
  rentAmount: number
  room?: {
    id: string
    roomNumber: string
    property?: {
      id: string
      name: string
    }
  }
}

export interface Invoice {
  id: string
  contractId: string
  contract?: InvoiceContract
  period: string
  totalAmount: number
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items?: InvoiceItem[]
}

export interface GetInvoicesParams {
  page?: number
  limit?: number
  propertyId?: string
  roomId?: string
  contractId?: string
  status?: InvoiceStatus
  period?: string // "YYYY-MM"
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface CreateInvoicePayload {
  contractId: string
  period: string // "YYYY-MM"
  notes?: string
}
