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
  quotation_id: ID | null        // Direct link to the approved quotation
  status: POStatus
  total_amount: number | null
  due_date: string | null
  shipping_address: string | null
  billing_address: string | null
  payment_terms: string | null
  notes: string | null
  created_by: ID | null
  approved_by: ID | null
  approved_at: string | null
  vendor_acceptance: 'pending' | 'accepted' | 'rejected' | 'clarification_requested' | null
  vendor_accepted_at: string | null
  vendor_rejection_reason: string | null
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
  // Quotation + RFQ provenance (joined when needed)
  quotation?: {
    id: ID
    quotation_number: string
    rfq_id: ID | null
    grand_total: number | null
    rfq?: { id: ID; rfq_number: string; title: string }
  }
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
  quotation_id?: ID | null       // Source quotation (required for new POs)
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
