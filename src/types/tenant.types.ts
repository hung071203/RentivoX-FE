export interface Tenant {
  id: string
  user_id: string | null
  landlord_id: string
  full_name: string
  phone: string
  email: string
  id_card_number: string
  id_card_issued_date: string
  id_card_issued_place: string
  date_of_birth: string
  permanent_address: string
  created_at: string
  updated_at: string
}

export interface CreateTenantDto {
  full_name: string
  phone: string
  email?: string
  id_card_number: string
  id_card_issued_date: string
  id_card_issued_place: string
  date_of_birth: string
  permanent_address: string
}

export type UpdateTenantDto = Partial<CreateTenantDto>
