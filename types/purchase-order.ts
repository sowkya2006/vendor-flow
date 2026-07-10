// ============================================================
// VendorFlow — Purchase Order Types
// ============================================================

import type { ID } from '@/types'

export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface PurchaseOrderItem {
  id: ID
  purchase_order_id: ID
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number | null
  created_at: string
}

export interface PurchaseOrder {
  id: ID
  company_id: ID
  po_number: string
  vendor_id: ID
  rfq_id: ID | null
  status: POStatus
  total_amount: number | null
  due_date: string | null       // ISO date string
  shipping_address: string | null
  billing_address: string | null
  payment_terms: string | null
  notes: string | null
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
  items?: PurchaseOrderItem[]
}

/** Lightweight row returned by the list query */
export type PurchaseOrderSummary = Pick<
  PurchaseOrder,
  | 'id'
  | 'po_number'
  | 'status'
  | 'total_amount'
  | 'due_date'
  | 'created_at'
  | 'updated_at'
> & {
  vendor?: { id: ID; name: string; status: string }
}

export interface PurchaseOrderFilters {
  search?: string
  status?: POStatus | ''
  page?: number
  pageSize?: number
}

export interface PurchaseOrderItemFormData {
  description: string
  quantity: number
  unit: string
  unit_price: number
}

export interface PurchaseOrderFormData {
  vendor_id: ID
  rfq_id?: ID | null
  due_date?: string | null
  shipping_address?: string | null
  billing_address?: string | null
  payment_terms?: string | null
  notes?: string | null
  items?: PurchaseOrderItemFormData[]
}

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
