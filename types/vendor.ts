// ============================================================
// VendorFlow — Vendor Types
// ============================================================

import type { ID } from '@/types'

export type VendorStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type VendorCategory =
  | 'software'
  | 'hardware'
  | 'services'
  | 'consulting'
  | 'logistics'
  | 'marketing'
  | 'finance'
  | 'legal'
  | 'other'

export interface Vendor {
  id: ID
  company_id: ID
  name: string
  category: VendorCategory
  status: VendorStatus
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  contract_start_date: string | null // ISO date string
  contract_end_date: string | null   // ISO date string
  contract_value: number | null
  created_at: string
  updated_at: string
  created_by: ID | null
}

export type CreateVendorPayload = Omit<Vendor, 'id' | 'created_at' | 'updated_at'>

export type UpdateVendorPayload = Partial<
  Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by'>
> & { id: ID }

export type VendorSummary = Pick<
  Vendor,
  | 'id'
  | 'name'
  | 'category'
  | 'status'
  | 'email'
  | 'website'
  | 'contract_value'
  | 'contract_end_date'
  | 'created_at'
>

export interface VendorFilters {
  search?: string
  status?: VendorStatus | ''
  category?: VendorCategory | ''
  page?: number
  pageSize?: number
}

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  suspended: 'Suspended',
}

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  software: 'Software',
  hardware: 'Hardware',
  services: 'Services',
  consulting: 'Consulting',
  logistics: 'Logistics',
  marketing: 'Marketing',
  finance: 'Finance',
  legal: 'Legal',
  other: 'Other',
}
