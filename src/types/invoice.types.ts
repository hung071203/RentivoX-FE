export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  contract_service_id: string | null
  quantity: number
  unit_price: number
  amount: number
  created_at: string
}

export interface Invoice {
  id: string
  contract_id: string
  period: string
  total_amount: number
  status: InvoiceStatus
  due_date: string
  paid_at: string | null
  notes: string
  created_at: string
  updated_at: string
  items?: InvoiceItem[]
}

export interface MeterReading {
  id: string
  contract_service_id: string
  period: string
  value_start: number
  value_end: number
  recorded_at: string
  recorded_by: string
  created_at: string
}

export interface CreateMeterReadingDto {
  contract_service_id: string
  period: string
  value_start: number
  value_end: number
}
