// ============================================================
// VendorFlow — Quotation Types
// ============================================================

import type { ID } from '@/types'

export type QuotationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'approved'
  | 'rejected'
  | 'expired'

export type DiscountType = 'percentage' | 'fixed'

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export interface QuotationItem {
  id: ID
  quotation_id: ID
  rfq_item_id: ID | null

  item_name: string
  description: string | null
  part_number: string | null
  unit: string

  quantity: number
  unit_price: number
  discount_pct: number
  discount_amount: number
  tax_pct: number
  tax_amount: number
  line_total: number

  delivery_days: number | null
  warranty_months: number | null
  remarks: string | null
  sort_order: number

  created_at: string
  updated_at: string
}

export interface QuotationDocument {
  id: ID
  quotation_id: ID
  company_id: ID

  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  document_type: string

  uploaded_by: ID | null
  created_at: string
}

export interface QuotationComment {
  id: ID
  quotation_id: ID
  company_id: ID

  comment: string
  is_internal: boolean

  created_by: ID | null
  created_at: string
  updated_at: string

  // join
  user?: {
    full_name: string | null
    email: string | null
  }
}

export interface QuotationHistory {
  id: ID
  quotation_id: ID
  company_id: ID

  action: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  notes: string | null

  performed_by: ID | null
  performed_at: string

  user?: {
    full_name: string | null
    email: string | null
  }
}

export interface Quotation {
  id: ID
  company_id: ID
  rfq_id: ID
  vendor_id: ID

  quotation_number: string
  status: QuotationStatus

  subtotal: number
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  tax_amount: number
  grand_total: number

  delivery_days: number | null
  lead_time_days: number | null
  warranty_months: number | null
  payment_terms: string | null
  validity_date: string | null

  notes: string | null
  rejection_reason: string | null

  submitted_at: string | null
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null

  created_by: ID | null
  updated_by: ID | null
  created_at: string
  updated_at: string

  // joins
  vendor?: {
    id: ID
    name: string
    email: string | null
    phone: string | null
    category: string | null
    status: string
  }
  rfq?: {
    id: ID
    rfq_number: string
    title: string
    due_date: string | null
  }
  items?: QuotationItem[]
  documents?: QuotationDocument[]
  comments?: QuotationComment[]
}

/** Lightweight row for list views */
export type QuotationSummary = Pick<
  Quotation,
  | 'id'
  | 'quotation_number'
  | 'status'
  | 'grand_total'
  | 'subtotal'
  | 'discount_amount'
  | 'tax_amount'
  | 'delivery_days'
  | 'warranty_months'
  | 'lead_time_days'
  | 'submitted_at'
  | 'created_at'
  | 'updated_at'
  | 'rfq_id'
  | 'vendor_id'
> & {
  vendor?: { id: ID; name: string; status: string; category: string | null }
  rfq?: { id: ID; title: string; rfq_number: string; due_date: string | null }
}

// ---------------------------------------------------------------------------
// Form / Input types
// ---------------------------------------------------------------------------

export interface QuotationItemFormData {
  id?: string
  rfq_item_id?: string | null
  item_name: string
  description?: string | null
  part_number?: string | null
  unit: string
  quantity: number
  unit_price: number
  discount_pct?: number
  tax_pct?: number
  delivery_days?: number | null
  warranty_months?: number | null
  remarks?: string | null
  sort_order?: number
}

export interface QuotationFormData {
  rfq_id: string
  vendor_id: string
  discount_type?: DiscountType
  discount_value?: number
  delivery_days?: number | null
  lead_time_days?: number | null
  warranty_months?: number | null
  payment_terms?: string | null
  validity_date?: string | null
  notes?: string | null
  items?: QuotationItemFormData[]
}

// ---------------------------------------------------------------------------
// Filters & Pagination
// ---------------------------------------------------------------------------

export interface QuotationFilters {
  search?: string
  status?: QuotationStatus | ''
  rfq_id?: string
  vendor_id?: string
  page?: number
  pageSize?: number
}

export interface QuotationListResult {
  data: QuotationSummary[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface QuotationComparisonRow {
  quotation: QuotationSummary
  vendor_name: string
  grand_total: number
  discount_amount: number
  tax_amount: number
  delivery_days: number | null
  warranty_months: number | null
  lead_time_days: number | null
  vendor_rating: number | null
  status: QuotationStatus
  is_lowest_price: boolean
  is_best_value: boolean
  is_recommended: boolean
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface QuotationStats {
  total: number
  pending_review: number
  approved: number
  rejected: number
  lowest_bid: number | null
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
}
