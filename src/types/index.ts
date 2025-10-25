// src/types/index.ts
export interface Member {
  id: string
  company_name: string
  registration_number: string | null
  contact_email: string
  kyc_status: 'pending' | 'approved' | 'rejected'
  collateral_amount: number
  join_date: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  member_id: string | null
  email: string
  role: 'admin' | 'member'
  name: string | null
  last_login: string | null
  created_at: string
}

export interface Transaction {
  id: string
  from_member_id: string
  to_member_id: string
  amount_usd: number
  reference_number: string | null
  trade_date: string
  status: 'pending' | 'confirmed' | 'settled'
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}