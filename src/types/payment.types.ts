export type PaymentMethod = 'cash' | 'transfer' | 'other'

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_code: string | null
  notes: string
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentDto {
  invoice_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  reference_code?: string
  notes?: string
}
