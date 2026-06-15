export type ContractStatus = 'pending' | 'active' | 'expired' | 'terminated'

export interface Contract {
  id: string
  room_id: string
  tenant_id: string
  rent_amount: number
  deposit_amount: number
  start_date: string
  end_date: string
  status: ContractStatus
  terminated_date: string | null
  terminated_reason: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface CreateContractDto {
  room_id: string
  tenant_id: string
  rent_amount: number
  deposit_amount: number
  start_date: string
  end_date: string
  notes?: string
}

export interface TerminateContractDto {
  terminated_date: string
  terminated_reason: string
}
