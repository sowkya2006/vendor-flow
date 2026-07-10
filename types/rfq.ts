// ============================================================
// VendorFlow — RFQ Types
// ============================================================

import type { ID } from '@/types'

export type RFQStatus = 'draft' | 'sent' | 'under_review' | 'awarded' | 'cancelled'
export type RFQPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface RFQItem {
  id: ID
  rfq_id: ID
  description: string
  quantity: number
  unit: string
  estimated_unit_price: number | null
  created_at: string
}

export interface RFQ {
  id: ID
  company_id: ID
  rfq_number: string
  title: string
  description: string | null
  vendor_id: ID
  status: RFQStatus
  priority: RFQPriority
  due_date: string | null   // ISO date string
  terms: string | null
  created_by: ID | null
  created_at: string
  updated_at: string
  // Joined relations
  vendor?: {
    id: ID
    name: string
    email: string | null
    status: string
    category: string | null
  }
  items?: RFQItem[]
}

/** Lightweight row returned by the list query */
export type RFQSummary = Pick<
  RFQ,
  | 'id'
  | 'rfq_number'
  | 'title'
  | 'status'
  | 'priority'
  | 'due_date'
  | 'created_at'
  | 'updated_at'
> & {
  vendor?: { id: ID; name: string; status: string }
}

export interface RFQFilters {
  search?: string
  status?: RFQStatus | ''
  priority?: RFQPriority | ''
  page?: number
  pageSize?: number
}

export interface RFQItemFormData {
  description: string
  quantity: number
  unit: string
  estimated_unit_price?: number | null
}

export interface RFQFormData {
  title: string
  description?: string | null
  vendor_id: ID
  due_date?: string | null
  priority: RFQPriority
  terms?: string | null
  items?: RFQItemFormData[]
}

export const RFQ_STATUS_LABELS: Record<RFQStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  under_review: 'Under Review',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
}

export const RFQ_PRIORITY_LABELS: Record<RFQPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
