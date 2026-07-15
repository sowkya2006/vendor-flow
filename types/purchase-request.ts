// ============================================================
// VendorFlow — Purchase Request Types
// ============================================================

import type { ID } from '@/types'

export type PRStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'converted'

export type PRPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface PRItem {
  id: ID
  pr_id: ID
  product_id: ID | null
  description: string
  quantity: number
  unit: string
  estimated_unit_price: number | null
  notes: string | null
  created_at: string
  product?: { id: ID; name: string; sku: string; unit: string } | null
}

export interface PurchaseRequest {
  id: ID
  company_id: ID
  pr_number: string
  title: string
  description: string | null
  department: string | null
  status: PRStatus
  priority: PRPriority
  required_date: string | null
  budget_amount: number | null
  currency: string
  notes: string | null
  rejection_reason: string | null
  requested_by: ID | null
  approved_by: ID | null
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // Joins
  requester?: {
    id: ID
    full_name: string | null
    email: string | null
  }
  approver?: {
    id: ID
    full_name: string | null
    email: string | null
  } | null
  items?: PRItem[]
}

export type PRSummary = Pick<
  PurchaseRequest,
  | 'id'
  | 'pr_number'
  | 'title'
  | 'department'
  | 'status'
  | 'priority'
  | 'required_date'
  | 'budget_amount'
  | 'currency'
  | 'submitted_at'
  | 'created_at'
  | 'updated_at'
> & {
  requester?: { id: ID; full_name: string | null; email: string | null }
  item_count?: number
}

export interface PRFilters {
  search?: string
  status?: PRStatus | ''
  priority?: PRPriority | ''
  department?: string
  page?: number
  pageSize?: number
}

export interface PRItemFormData {
  product_id?: string | null
  description: string
  quantity: number
  unit: string
  estimated_unit_price?: number | null
  notes?: string | null
}

export interface PRFormData {
  title: string
  description?: string | null
  department?: string | null
  priority: PRPriority
  required_date?: string | null
  budget_amount?: number | null
  currency?: string
  notes?: string | null
  items?: PRItemFormData[]
}

export const PR_STATUS_LABELS: Record<PRStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  converted: 'Converted to RFQ',
}

export const PR_PRIORITY_LABELS: Record<PRPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const DEPARTMENTS = [
  'Engineering',
  'Operations',
  'Finance',
  'HR',
  'Marketing',
  'Sales',
  'IT',
  'Procurement',
  'Legal',
  'Management',
  'Other',
] as const

export type Department = (typeof DEPARTMENTS)[number]

export interface PRStats {
  total: number
  draft: number
  submitted: number
  under_review: number
  approved: number
  rejected: number
  converted: number
  total_budget: number
}
