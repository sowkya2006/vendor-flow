// =============================================================================
// VendorFlow — Vendor Portal Types
// =============================================================================

export interface VendorUser {
  id: string
  user_id: string
  vendor_id: string
  company_id: string
  role: 'admin' | 'member' | 'viewer'
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  // joins
  vendor?: VendorPortalProfile
}

export interface VendorPortalProfile {
  id: string
  company_id: string
  name: string
  legal_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  category: string | null
  status: string
  tax_id: string | null
  registration_number: string | null
  description: string | null
  notes: string | null
  currency: string | null
  payment_terms: string | null
  created_at: string
  updated_at: string
}

export interface VendorNotification {
  id: string
  vendor_id: string
  company_id: string
  type: VendorNotificationType
  title: string
  message: string
  read: boolean
  link: string | null
  reference_id: string | null
  created_at: string
}

export type VendorNotificationType =
  | 'new_rfq'
  | 'quotation_accepted'
  | 'quotation_rejected'
  | 'po_issued'
  | 'invoice_approved'
  | 'payment_recorded'
  | 'approval_returned'
  | 'general'

export const VENDOR_NOTIFICATION_LABELS: Record<VendorNotificationType, string> = {
  new_rfq: 'New RFQ',
  quotation_accepted: 'Quotation Accepted',
  quotation_rejected: 'Quotation Rejected',
  po_issued: 'PO Issued',
  invoice_approved: 'Invoice Approved',
  payment_recorded: 'Payment Recorded',
  approval_returned: 'Approval Returned',
  general: 'Notification',
}

export interface VendorDashboardStats {
  assigned_rfqs: number
  submitted_quotations: number
  approved_quotations: number
  purchase_orders: number
  total_invoices: number
  paid_invoices: number
  outstanding_amount: number
  payments_received: number
  pending_approvals: number
  unread_notifications: number
}

export interface VendorPortalRfq {
  id: string
  rfq_number: string
  title: string
  status: string
  priority: string | null
  due_date: string | null
  description: string | null
  created_at: string
  items?: VendorPortalRfqItem[]
}

export interface VendorPortalRfqItem {
  id: string
  description: string
  quantity: number
  unit: string | null
  estimated_unit_price: number | null
}

export interface VendorPortalQuotation {
  id: string
  quotation_number: string
  rfq_id: string | null
  status: string
  valid_until: string | null
  currency: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  rfq?: { id: string; rfq_number: string; title: string } | null
  items?: VendorPortalQuotationItem[]
}

export interface VendorPortalQuotationItem {
  id: string
  description: string
  quantity: number
  unit: string | null
  unit_price: number
  tax_percentage: number
  line_total: number
  notes: string | null
}

export interface VendorPortalPO {
  id: string
  po_number: string
  status: string
  total_amount: number | null
  currency: string
  due_date: string | null
  expected_delivery_date: string | null
  notes: string | null
  created_at: string
  rfq?: { id: string; rfq_number: string } | null
}

export interface VendorPortalInvoice {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  status: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  currency: string
  notes: string | null
  created_at: string
  purchase_order?: { id: string; po_number: string } | null
  items?: VendorPortalInvoiceItem[]
  payments?: VendorPortalPayment[]
}

export interface VendorPortalInvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_percentage: number
  line_total: number
}

export interface VendorPortalPayment {
  id: string
  payment_reference: string
  payment_date: string
  payment_method: string
  amount: number
  notes: string | null
  created_at: string
}
