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

export interface InvoiceContractOwner {
  id: string
  fullName: string
  phone: string | null
  email: string | null
}

export interface InvoiceContract {
  id: string
  rentAmount: number
  startDate?: string
  endDate?: string
  owner?: InvoiceContractOwner
  room?: {
    id: string
    roomNumber: string
    property?: {
      id: string
      name: string
    }
  }
}

export interface PaymentProof {
  id: string
  invoiceId: string
  tenantId: string
  proofImageUrl: string
  note: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string | null
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
  // Computed — null nếu landlord chưa khai báo tài khoản ngân hàng
  qrCodeUrl?: string | null
  // Chỉ có trong response của GET /:id (cả landlord lẫn tenant)
  paymentProofs?: PaymentProof[]
}

export interface SubmitPaymentProofPayload {
  note?: string
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
