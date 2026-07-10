/**
 * vendor-portal.ts
 * All Supabase queries for the Vendor Portal.
 * These run as the authenticated vendor user — RLS enforces data isolation.
 */
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type {
  VendorUser,
  VendorPortalProfile,
  VendorDashboardStats,
  VendorPortalRfq,
  VendorPortalQuotation,
  VendorPortalPO,
  VendorPortalInvoice,
  VendorPortalPayment,
  VendorNotification,
} from '@/types/vendor-portal'
import type {
  VendorProfileInput,
  VendorUserProfileInput,
  CreateVendorQuotationInput,
  UpdateVendorQuotationInput,
  CreateVendorInvoiceInput,
} from '@/lib/validations/vendor-portal'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (t: string) => any }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH / SESSION
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the vendor_user row for the currently authenticated user, or null. */
export const getVendorUser = cache(async (): Promise<VendorUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await db()
  const { data, error } = await client
    .from('vendor_users')
    .select('*, vendor:vendors(*)')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data as VendorUser
})

/** Throws if not authenticated as a vendor user. */
export async function requireVendorUser(): Promise<VendorUser> {
  const vu = await getVendorUser()
  if (!vu) throw new Error('Not authenticated as a vendor user')
  return vu
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorDashboardStats(vendorId: string): Promise<VendorDashboardStats> {
  const supabase = await db()

  const [rfqs, quotations, approvedQuotations, pos, invoices, unreadNotifs] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'approved'),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('invoices').select('id, status, remaining_amount, paid_amount').eq('vendor_id', vendorId).limit(2000),
    supabase.from('vendor_notifications').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('read', false),
  ])

  const invRows = invoices.data ?? []
  const totalInvoices = invRows.length
  const paidInvoices = invRows.filter((i: { status: string }) => i.status === 'paid').length
  const outstanding = invRows
    .filter((i: { status: string }) => ['approved', 'partially_paid'].includes(i.status))
    .reduce((s: number, i: { remaining_amount: number }) => s + (i.remaining_amount ?? 0), 0)
  const paymentsReceived = invRows
    .reduce((s: number, i: { paid_amount: number }) => s + (i.paid_amount ?? 0), 0)

  return {
    assigned_rfqs: rfqs.count ?? 0,
    submitted_quotations: quotations.count ?? 0,
    approved_quotations: approvedQuotations.count ?? 0,
    purchase_orders: pos.count ?? 0,
    total_invoices: totalInvoices,
    paid_invoices: paidInvoices,
    outstanding_amount: outstanding,
    payments_received: paymentsReceived,
    pending_approvals: 0,
    unread_notifications: unreadNotifs.count ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorProfile(vendorId: string): Promise<VendorPortalProfile | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, company_id, name, legal_name, email, phone, website, address, category, status, tax_id, registration_number, description, notes, currency, payment_terms, created_at, updated_at')
    .eq('id', vendorId)
    .single()
  if (error) return null
  return data as VendorPortalProfile
}

export async function updateVendorProfile(vendorId: string, input: VendorProfileInput): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('vendors')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
  if (error) throw error
}

export async function updateVendorUserProfile(userId: string, input: VendorUserProfileInput): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('vendor_users')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// RFQs
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorRfqs(
  vendorId: string,
  filters: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorPortalRfq[]; total: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { search, status, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('rfqs')
    .select('id, rfq_number, title, status, priority, due_date, description, created_at', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as VendorPortalRfq[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

export async function getVendorRfqById(id: string, vendorId: string): Promise<VendorPortalRfq | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('rfqs')
    .select('*, items:rfq_items(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .single()
  if (error) return null
  return data as VendorPortalRfq
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorQuotations(
  vendorId: string,
  filters: { search?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorPortalQuotation[]; total: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { status, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('quotations')
    .select('id, quotation_number, rfq_id, status, valid_until, currency, subtotal, tax_amount, discount_amount, total_amount, notes, created_at, updated_at, rfq:rfqs(id, rfq_number, title)', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as VendorPortalQuotation[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

export async function getVendorQuotationById(id: string, vendorId: string): Promise<VendorPortalQuotation | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('quotations')
    .select('*, rfq:rfqs(id, rfq_number, title), items:quotation_items(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .single()
  if (error) return null
  return data as VendorPortalQuotation
}

export async function createVendorQuotation(
  vendorId: string,
  companyId: string,
  input: CreateVendorQuotationInput,
): Promise<VendorPortalQuotation> {
  const supabase = await db()

  const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = input.items.reduce((s, i) => s + i.quantity * i.unit_price * (i.tax_percentage / 100), 0)
  const totalAmount = subtotal + taxAmount - (input.discount_amount ?? 0)

  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      vendor_id: vendorId,
      company_id: companyId,
      rfq_id: input.rfq_id ?? null,
      quotation_number: '',
      valid_until: input.valid_until ?? null,
      currency: input.currency ?? 'INR',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: input.discount_amount ?? 0,
      total_amount: totalAmount,
      notes: input.notes ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error

  const itemRows = input.items.map((item) => ({
    quotation_id: quotation.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit ?? null,
    unit_price: item.unit_price,
    tax_percentage: item.tax_percentage ?? 0,
    notes: item.notes ?? null,
  }))
  const { error: itemsErr } = await supabase.from('quotation_items').insert(itemRows)
  if (itemsErr) throw itemsErr

  const created = await getVendorQuotationById(quotation.id, vendorId)
  return created as VendorPortalQuotation
}

export async function updateVendorQuotation(
  id: string,
  vendorId: string,
  input: UpdateVendorQuotationInput,
): Promise<void> {
  const supabase = await db()
  const { items, ...fields } = input

  if (items !== undefined) {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const taxAmount = items.reduce((s, i) => s + i.quantity * i.unit_price * (i.tax_percentage / 100), 0)
    const totalAmount = subtotal + taxAmount - (fields.discount_amount ?? 0)

    const { error } = await supabase
      .from('quotations')
      .update({ ...fields, subtotal, tax_amount: taxAmount, total_amount: totalAmount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('vendor_id', vendorId)
    if (error) throw error

    await supabase.from('quotation_items').delete().eq('quotation_id', id)
    const itemRows = items.map((item) => ({
      quotation_id: id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? null,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage ?? 0,
      notes: item.notes ?? null,
    }))
    const { error: itemsErr } = await supabase.from('quotation_items').insert(itemRows)
    if (itemsErr) throw itemsErr
  } else {
    const { error } = await supabase
      .from('quotations')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('vendor_id', vendorId)
    if (error) throw error
  }
}

export async function withdrawVendorQuotation(id: string, vendorId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('quotations')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .in('status', ['draft', 'submitted'])
  if (error) throw error
}

export async function submitVendorQuotation(id: string, vendorId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('quotations')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .eq('status', 'draft')
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorPurchaseOrders(
  vendorId: string,
  filters: { status?: string; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorPortalPO[]; total: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { status, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount, currency, due_date, expected_delivery_date, notes, created_at, rfq:rfqs(id, rfq_number)', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as VendorPortalPO[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

export async function getVendorPurchaseOrderById(id: string, vendorId: string): Promise<VendorPortalPO | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, rfq:rfqs(id, rfq_number), items:purchase_order_items(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .single()
  if (error) return null
  return data as VendorPortalPO
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorInvoices(
  vendorId: string,
  filters: { status?: string; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorPortalInvoice[]; total: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { status, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, due_date, status, total_amount, paid_amount, remaining_amount, currency, notes, created_at, purchase_order:purchase_orders(id, po_number)', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data ?? []) as VendorPortalInvoice[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

export async function getVendorInvoiceById(id: string, vendorId: string): Promise<VendorPortalInvoice | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, purchase_order:purchase_orders(id, po_number), items:invoice_items(*), payments(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .single()
  if (error) return null
  return data as VendorPortalInvoice
}

export async function createVendorInvoice(
  vendorId: string,
  companyId: string,
  userId: string,
  input: CreateVendorInvoiceInput,
): Promise<VendorPortalInvoice> {
  const supabase = await db()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      vendor_id: vendorId,
      company_id: companyId,
      created_by: userId,
      invoice_number: '',
      purchase_order_id: input.purchase_order_id ?? null,
      invoice_date: input.invoice_date,
      due_date: input.due_date ?? null,
      currency: input.currency ?? 'INR',
      discount_amount: input.discount_amount ?? 0,
      notes: input.notes ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error

  const itemRows = input.items.map((item) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_percentage: item.tax_percentage ?? 0,
  }))
  const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows)
  if (itemsErr) throw itemsErr

  const created = await getVendorInvoiceById(invoice.id, vendorId)
  return created as VendorPortalInvoice
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorPayments(
  vendorId: string,
  filters: { page?: number; pageSize?: number } = {},
): Promise<{ data: VendorPortalPayment[]; total: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('payments')
    .select('id, payment_reference, payment_date, payment_method, amount, notes, created_at, invoice:invoices(id, invoice_number)', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('payment_date', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data ?? []) as VendorPortalPayment[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorNotifications(
  vendorId: string,
  filters: { unread?: boolean; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorNotification[]; total: number; unread: number }> {
  const supabase = await db()
  const { unread, page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('vendor_notifications')
    .select('*', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (unread) query = query.eq('read', false)

  const { data, error, count } = await query
  if (error) throw error

  const { count: unreadCount } = await supabase
    .from('vendor_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('read', false)

  return { data: (data ?? []) as VendorNotification[], total: count ?? 0, unread: unreadCount ?? 0 }
}

export async function markNotificationRead(id: string, vendorId: string): Promise<void> {
  const supabase = await db()
  await supabase.from('vendor_notifications').update({ read: true }).eq('id', id).eq('vendor_id', vendorId)
}

export async function markAllNotificationsRead(vendorId: string): Promise<void> {
  const supabase = await db()
  await supabase.from('vendor_notifications').update({ read: true }).eq('vendor_id', vendorId).eq('read', false)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get vendor's POs for invoice creation dropdown
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorPOsForInvoice(vendorId: string): Promise<Array<{ id: string; po_number: string }>> {
  const supabase = await db()
  const { data } = await supabase
    .from('purchase_orders')
    .select('id, po_number')
    .eq('vendor_id', vendorId)
    .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as Array<{ id: string; po_number: string }>
}

export async function getVendorRFQsForQuotation(vendorId: string): Promise<Array<{ id: string; rfq_number: string; title: string }>> {
  const supabase = await db()
  const { data } = await supabase
    .from('rfqs')
    .select('id, rfq_number, title')
    .eq('vendor_id', vendorId)
    .in('status', ['sent', 'under_review'])
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as Array<{ id: string; rfq_number: string; title: string }>
}
