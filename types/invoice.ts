// =============================================================================
// VendorFlow — Invoice & Payment Types
// =============================================================================

import type { ID } from '@/types'

// ── Status / Method enums ─────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'card'

// ── Labels ────────────────────────────────────────────────────────────────────

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  cash: 'Cash',
  card: 'Card',
}

// ── Invoice Item ──────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: ID
  invoice_id: ID
  product_id: ID | null
  description: string
  quantity: number
  unit_price: number
  tax_percentage: number
  line_total: number
  created_at: string
  // join
  product?: { id: ID; name: string; sku: string; unit: string } | null
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export interface Invoice {
  id: ID
  company_id: ID
  purchase_order_id: ID | null
  grn_id: ID | null
  vendor_id: ID
  invoice_number: string
  invoice_date: string
  due_date: string | null
  status: InvoiceStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  currency: string
  notes: string | null
  created_by: ID | null
  created_at: string
  updated_at: string
  // joins
  vendor?: { id: ID; name: string; email: string | null; status: string }
  purchase_order?: { id: ID; po_number: string } | null
  items?: InvoiceItem[]
  payments?: Payment[]
}

/** Lightweight row for list views */
export type InvoiceSummary = Pick<
  Invoice,
  | 'id'
  | 'invoice_number'
  | 'invoice_date'
  | 'due_date'
  | 'status'
  | 'total_amount'
  | 'paid_amount'
  | 'remaining_amount'
  | 'currency'
  | 'created_at'
> & {
  vendor?: { id: ID; name: string }
  purchase_order?: { id: ID; po_number: string } | null
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface Payment {
  id: ID
  invoice_id: ID
  company_id: ID
  vendor_id: ID
  payment_reference: string
  payment_date: string
  payment_method: PaymentMethod
  amount: number
  notes: string | null
  created_by: ID | null
  created_at: string
  // joins
  vendor?: { id: ID; name: string }
  invoice?: { id: ID; invoice_number: string; total_amount: number }
  created_by_user?: { id: ID; full_name: string | null; email: string | null }
}

// ── Form data ─────────────────────────────────────────────────────────────────

export interface InvoiceItemFormData {
  product_id?: string | null
  description: string
  quantity: number
  unit_price: number
  tax_percentage: number
}

export interface InvoiceFormData {
  purchase_order_id?: string | null
  vendor_id: string
  invoice_date: string
  due_date?: string | null
  discount_amount?: number
  currency?: string
  notes?: string | null
  items: InvoiceItemFormData[]
}

export interface PaymentFormData {
  invoice_id: string
  payment_date: string
  payment_method: PaymentMethod
  amount: number
  notes?: string | null
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus | ''
  vendor_id?: string
  overdue?: boolean
  page?: number
  pageSize?: number
}

export interface PaymentFilters {
  vendor_id?: string
  invoice_id?: string
  payment_method?: PaymentMethod | ''
  from_date?: string
  to_date?: string
  page?: number
  pageSize?: number
}

// ── Dashboard / Stats ─────────────────────────────────────────────────────────

export interface InvoiceStats {
  total_invoices: number
  pending_approval: number      // submitted
  outstanding_amount: number    // sum of remaining_amount for approved/partially_paid
  paid_this_month: number       // sum of payments this calendar month
  overdue_count: number         // past due_date, not paid/cancelled
  todays_payments: number       // payments made today
}

// ── Vendor balance ────────────────────────────────────────────────────────────

export interface VendorBalance {
  vendor_id: ID
  vendor_name: string
  total_invoiced: number
  total_paid: number
  outstanding: number
  overdue_amount: number
  invoice_count: number
  oldest_due_date: string | null
}

// ── Aging report ──────────────────────────────────────────────────────────────

export interface AgingBucket {
  label: string
  count: number
  amount: number
}

export interface AgingReport {
  current: AgingBucket     // not yet due
  days_1_30: AgingBucket
  days_31_60: AgingBucket
  days_61_90: AgingBucket
  over_90: AgingBucket
}

// ── List results ──────────────────────────────────────────────────────────────

export interface InvoiceListResult {
  data: InvoiceSummary[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export interface PaymentListResult {
  data: Payment[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}
