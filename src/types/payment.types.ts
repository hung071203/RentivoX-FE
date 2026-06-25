import type { PaginatedResult } from './admin.types'

export type PaymentMethod = 'cash' | 'transfer' | 'other'
export type PaymentSource = 'manual' | 'automatic'

export interface PaymentInvoiceRoom {
  id: string
  roomNumber: string
  property?: {
    id: string
    name: string
  }
}

export interface PaymentInvoiceContract {
  id: string
  contractNumber: string | null
  room?: PaymentInvoiceRoom
}

export interface PaymentInvoiceInfo {
  id: string
  invoiceNumber: string
  period: string
  totalAmount: number
  status: string
  contract?: PaymentInvoiceContract
}

export interface PaymentRecorder {
  id: string
  fullName: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  source: PaymentSource
  referenceCode: string | null
  notes: string | null
  recordedById: string
  createdAt: string
  updatedAt: string
  invoice: PaymentInvoiceInfo
  recordedBy: PaymentRecorder
}

export interface CreatePaymentPayload {
  invoiceId: string
  amount: number
  paymentMethod: PaymentMethod
  notes?: string
}

export interface GetPaymentsParams {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  invoiceId?: string
  propertyId?: string
  paymentMethod?: PaymentMethod
  source?: PaymentSource
  referenceCode?: string
}

export type PaginatedPayments = PaginatedResult<Payment>
