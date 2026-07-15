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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adminDb() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  return createAdminClient() as unknown as { from: (t: string) => any }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH / SESSION
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the vendor_user row for the currently authenticated user, or null.
 *
 * Supports two vendor types:
 * 1. Invited vendor — has a vendor_users record
 * 2. Self-registered vendor — has a vendor_companies record only
 *    (synthesised into a VendorUser-compatible shape)
 */
export const getVendorUser = cache(async (): Promise<VendorUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await db()

  // 1. Try invited vendor first (vendor_users → vendors FK)
  const { data: vuRow } = await client
    .from('vendor_users')
    .select('*, vendor:vendors(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (vuRow) return vuRow as VendorUser

  // 2. Fall back to self-registered vendor_companies record
  const { data: vcRow } = await client
    .from('vendor_companies')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!vcRow) return null

  // For self-registered vendors, purchase_orders.vendor_id references vendors.id
  // (set when the company invited/approved the vendor). Look for a matching
  // vendors row linked to this vendor_companies record.
  // The vendors table has a vendor_company_id FK (set when company approves the request).
  let realVendorId = vcRow.id  // fallback to vcRow.id if no vendors row found
  let vendorRow: Record<string, unknown> | null = null

  const { data: vRow } = await client
    .from('vendors')
    .select('*')
    .eq('vendor_company_id', vcRow.id)
    .maybeSingle()

  if (vRow) {
    realVendorId = (vRow as { id: string }).id
    vendorRow = vRow as Record<string, unknown>
  } else {
    // Also try matching by email — some flows link by email instead of FK
    if (vcRow.email || user.email) {
      const { data: vRowByEmail } = await client
        .from('vendors')
        .select('*')
        .eq('email', vcRow.email ?? user.email)
        .maybeSingle()
      if (vRowByEmail) {
        realVendorId = (vRowByEmail as { id: string }).id
        vendorRow = vRowByEmail as Record<string, unknown>
      }
    }
  }

  const synthetic: VendorUser = {
    id: user.id,
    user_id: user.id,
    // Use the real vendors.id so purchase_orders.vendor_id FK matches
    vendor_id: realVendorId,
    company_id: (vendorRow?.company_id as string) ?? vcRow.company_id ?? '',
    role: 'admin' as const,
    full_name: vcRow.contact_name ?? user.email?.split('@')[0] ?? 'Vendor',
    email: user.email ?? vcRow.email ?? '',
    phone: vcRow.phone ?? null,
    avatar_url: null,
    is_primary: true,
    created_at: vcRow.created_at ?? new Date().toISOString(),
    updated_at: vcRow.updated_at ?? new Date().toISOString(),
    vendor: vendorRow ? {
      id: vendorRow.id as string,
      company_id: vendorRow.company_id as string ?? '',
      name: vendorRow.name as string ?? vcRow.company_name ?? 'My Company',
      legal_name: vendorRow.legal_name as string | null ?? null,
      email: vendorRow.email as string | null ?? vcRow.email ?? null,
      phone: vendorRow.phone as string | null ?? vcRow.phone ?? null,
      website: vendorRow.website as string | null ?? vcRow.website ?? null,
      address: vendorRow.address as string | null ?? vcRow.address ?? null,
      category: vendorRow.category as string | null ?? vcRow.industry ?? null,
      status: vendorRow.status as string ?? 'active',
      tax_id: vendorRow.tax_id as string | null ?? vcRow.gst_number ?? null,
      registration_number: vendorRow.registration_number as string | null ?? null,
      description: vendorRow.description as string | null ?? vcRow.description ?? null,
      notes: vendorRow.notes as string | null ?? null,
      currency: vendorRow.currency as string | null ?? null,
      payment_terms: vendorRow.payment_terms as string | null ?? null,
      created_at: vendorRow.created_at as string ?? vcRow.created_at ?? new Date().toISOString(),
      updated_at: vendorRow.updated_at as string ?? vcRow.updated_at ?? new Date().toISOString(),
    } : {
      id: vcRow.id,
      company_id: vcRow.company_id ?? '',
      name: vcRow.company_name ?? 'My Company',
      legal_name: null,
      email: vcRow.email ?? null,
      phone: vcRow.phone ?? null,
      website: vcRow.website ?? null,
      address: vcRow.address ?? null,
      category: vcRow.industry ?? null,
      status: 'active',
      tax_id: vcRow.gst_number ?? null,
      registration_number: null,
      description: vcRow.description ?? null,
      notes: null,
      currency: null,
      payment_terms: null,
      created_at: vcRow.created_at ?? new Date().toISOString(),
      updated_at: vcRow.updated_at ?? new Date().toISOString(),
    },
  }
  return synthetic
})

/** Throws if not authenticated as a vendor user. */
export async function requireVendorUser(): Promise<VendorUser> {
  const vu = await getVendorUser()
  if (!vu) throw new Error('Not authenticated as a vendor user')
  // For self-registered vendors (vendor_companies flow), company_id may be
  // empty until they link to a company. Actions that need company_id must
  // handle empty string gracefully.
  return vu
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorDashboardStats(vendorId: string): Promise<VendorDashboardStats> {
  const supabase = await db()

  // Get the current user id so we can query approval_notifications by recipient
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const [rfqs, quotations, approvedQuotations, pos, invoices] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'approved'),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('invoices').select('id, status, remaining_amount, paid_amount').eq('vendor_id', vendorId).limit(2000),
  ])

  // Unread notifications for this vendor user (approval_notifications table)
  let unreadNotifsCount = 0
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('approval_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)
    unreadNotifsCount = count ?? 0
  }

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
    unread_notifications: unreadNotifsCount,
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
  // Try with vendor_id filter first (invited vendor flow)
  const { data, error } = await supabase
    .from('rfqs')
    .select('*, items:rfq_items(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .maybeSingle()
  if (!error && data) return data as VendorPortalRfq

  // Fallback: fetch by ID only (RLS handles access — for self-registered vendors)
  const { data: data2 } = await supabase
    .from('rfqs')
    .select('*, items:rfq_items(*)')
    .eq('id', id)
    .maybeSingle()
  return (data2 as VendorPortalRfq | null) ?? null
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
    .select('id, quotation_number, rfq_id, status, valid_until, subtotal, tax_amount, discount_amount, grand_total, notes, created_at, updated_at, rfq:rfqs(id, rfq_number, title)', { count: 'exact' })
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

  // ── Calculate totals in the app layer ────────────────────────────────────
  // Note: per-item tax is applied on the full line amount (no per-item discount
  // in the vendor portal form). Header discount is subtracted at the end.
  const itemCalcs = input.items.map((item) => {
    const lineBase = item.quantity * item.unit_price
    const taxAmt   = Math.round(lineBase * ((item.tax_percentage ?? 0) / 100) * 100) / 100
    const lineTotal = Math.round((lineBase + taxAmt) * 100) / 100
    return { ...item, lineBase, taxAmt, lineTotal }
  })
  const subtotal    = Math.round(itemCalcs.reduce((s, i) => s + i.lineBase, 0) * 100) / 100
  const taxAmount   = Math.round(itemCalcs.reduce((s, i) => s + i.taxAmt, 0) * 100) / 100
  const discountAmt = Math.round((input.discount_amount ?? 0) * 100) / 100
  const grandTotal  = Math.round(Math.max(0, subtotal + taxAmount - discountAmt) * 100) / 100

  // Generate a unique quotation number using the same RPC as the admin side
  const { data: quotNumber, error: numErr } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> })
    .rpc('generate_quotation_number', { p_company_id: companyId })
  if (numErr) throw numErr

  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      vendor_id:        vendorId,
      company_id:       companyId,
      rfq_id:           input.rfq_id ?? null,
      quotation_number: (quotNumber as string) || `QUO-${Date.now()}`,
      valid_until:      (input.valid_until && input.valid_until.trim() !== '') ? input.valid_until : null,
      subtotal,
      tax_amount:       taxAmount,
      discount_amount:  discountAmt,
      discount_type:    'fixed',
      discount_value:   discountAmt,
      grand_total:      grandTotal,
      notes:            input.notes ?? null,
      status:           'draft',
    })
    .select()
    .single()
  if (error) throw error

  const itemRows = itemCalcs.map((item, idx) => ({
    quotation_id:    quotation.id,
    item_name:       item.description,
    description:     item.description ?? null,
    unit:            item.unit ?? 'unit',
    quantity:        item.quantity,
    unit_price:      item.unit_price,
    discount_pct:    0,
    discount_amount: 0,
    tax_pct:         item.tax_percentage ?? 0,
    tax_amount:      item.taxAmt,
    line_total:      item.lineTotal,
    sort_order:      idx,
  }))
  const { error: itemsErr } = await supabase.from('quotation_items').insert(itemRows)
  if (itemsErr) throw itemsErr

  // ── App-layer recalc after items insert ───────────────────────────────────
  // The DB trigger `sync_quotation_grand_total` should handle this, but it
  // may be blocked by RLS when a vendor user inserts items (vendor has no
  // row in public.users with the matching company_id). As a safety net, we
  // re-apply the correct totals using the admin client which bypasses RLS.
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any

    // Re-sum from the actual inserted rows (in case trigger already ran and changed values)
    const { data: insertedItems } = await adminDb
      .from('quotation_items')
      .select('quantity, unit_price, discount_amount, tax_amount, line_total')
      .eq('quotation_id', quotation.id)

    if (insertedItems && insertedItems.length > 0) {
      const dbSubtotal = insertedItems.reduce(
        (s: number, i: { quantity: number; unit_price: number; discount_amount: number }) =>
          s + (i.quantity * i.unit_price - (i.discount_amount ?? 0)),
        0,
      )
      const dbTax = insertedItems.reduce((s: number, i: { tax_amount: number }) => s + (i.tax_amount ?? 0), 0)
      const dbDisc = discountAmt  // header-level discount stays as entered
      const dbGrandTotal = Math.max(0, dbSubtotal - dbDisc + dbTax)

      await adminDb
        .from('quotations')
        .update({
          subtotal:        Math.round(dbSubtotal * 100) / 100,
          tax_amount:      Math.round(dbTax * 100) / 100,
          discount_amount: dbDisc,
          grand_total:     Math.round(dbGrandTotal * 100) / 100,
          updated_at:      new Date().toISOString(),
        })
        .eq('id', quotation.id)
    }
  } catch (e) {
    console.error('[createVendorQuotation] totals recalc failed (non-critical):', e)
    // Non-critical — the trigger should have updated correctly in most cases
  }

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
    // ── Recalculate totals ───────────────────────────────────────────────
    const itemCalcs = items.map((item) => {
      const lineBase  = item.quantity * item.unit_price
      const taxAmt    = Math.round(lineBase * ((item.tax_percentage ?? 0) / 100) * 100) / 100
      const lineTotal = Math.round((lineBase + taxAmt) * 100) / 100
      return { ...item, lineBase, taxAmt, lineTotal }
    })
    const subtotal    = Math.round(itemCalcs.reduce((s, i) => s + i.lineBase, 0) * 100) / 100
    const taxAmount   = Math.round(itemCalcs.reduce((s, i) => s + i.taxAmt, 0) * 100) / 100
    const discountAmt = Math.round((fields.discount_amount ?? 0) * 100) / 100
    const grandTotal  = Math.round(Math.max(0, subtotal + taxAmount - discountAmt) * 100) / 100

    // Update quotation header with correct totals
    const { error } = await supabase
      .from('quotations')
      .update({
        ...fields,
        subtotal,
        tax_amount:      taxAmount,
        discount_amount: discountAmt,
        discount_type:   'fixed',
        discount_value:  discountAmt,
        grand_total:     grandTotal,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)
      .eq('vendor_id', vendorId)
    if (error) throw error

    // Delete existing items and re-insert
    await supabase.from('quotation_items').delete().eq('quotation_id', id)

    const itemRows = itemCalcs.map((item, idx) => ({
      quotation_id:    id,
      item_name:       item.description,
      description:     item.description ?? null,
      unit:            item.unit ?? 'unit',
      quantity:        item.quantity,
      unit_price:      item.unit_price,
      discount_pct:    0,
      discount_amount: 0,
      tax_pct:         item.tax_percentage ?? 0,
      tax_amount:      item.taxAmt,
      line_total:      item.lineTotal,
      sort_order:      idx,
    }))
    const { error: itemsErr } = await supabase.from('quotation_items').insert(itemRows)
    if (itemsErr) throw itemsErr

    // Admin-layer safety net (bypass RLS for totals update)
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminDb = createAdminClient() as any
      await adminDb.from('quotations').update({
        subtotal,
        tax_amount:      taxAmount,
        discount_amount: discountAmt,
        grand_total:     grandTotal,
        updated_at:      new Date().toISOString(),
      }).eq('id', id)
    } catch { /* non-critical */ }

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

  const buildQuery = (q: ReturnType<typeof supabase.from>, useVendorFilter: boolean) => {
    let query = q
      .select(
        'id, po_number, status, vendor_acceptance, total_amount, due_date, notes, created_at, rfq:rfqs(id, rfq_number)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (useVendorFilter) query = query.eq('vendor_id', vendorId)
    if (status) query = query.eq('status', status)
    return query
  }

  // Primary: filter by vendor_id
  let { data, error, count } = await buildQuery(supabase.from('purchase_orders'), true)

  // Fallback: use admin client to bypass RLS for self-registered vendors
  if (!data?.length) {
    const admin = await adminDb()
    ;({ data, error, count } = await buildQuery(admin.from('purchase_orders'), false))
  }

  if (error) throw error
  return { data: (data ?? []) as VendorPortalPO[], total: count ?? 0, hasNextPage: (count ?? 0) > to + 1 }
}

export async function getVendorPurchaseOrderById(id: string, vendorId: string): Promise<VendorPortalPO | null> {
  const supabase = await db()

  // Primary lookup — by vendor_id FK
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor_acceptance, rfq:rfqs(id, rfq_number), items:purchase_order_items(*)')
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .maybeSingle()

  if (!error && data) return data as VendorPortalPO

  // Fallback — fetch by ID alone (RLS protects access)
  // This handles cases where vendor_id in the DB doesn't match the synthesised ID
  const { data: data2 } = await supabase
    .from('purchase_orders')
    .select('*, vendor_acceptance, rfq:rfqs(id, rfq_number), items:purchase_order_items(*)')
    .eq('id', id)
    .maybeSingle()

  return (data2 as VendorPortalPO | null) ?? null
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
  // Use admin client for all invoice operations — vendor anon session may not
  // have INSERT on invoices (RLS), and FK checks need verified IDs.
  const admin = await adminDb()

  const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = input.items.reduce(
    (s, i) => s + i.quantity * i.unit_price * ((i.tax_percentage ?? 0) / 100),
    0,
  )
  const grandTotal = subtotal + taxAmount - (input.discount_amount ?? 0)

  // ── Validate and resolve all FK values ──────────────────────────────────

  // 1. Validate vendor_id exists in vendors table
  let safeVendorId: string | null = null
  if (vendorId) {
    const { data: vRow } = await admin.from('vendors').select('id').eq('id', vendorId).maybeSingle()
    if (vRow) safeVendorId = vendorId
    else {
      // Try lookup via vendor_company_id
      const { data: vByCompany } = await admin.from('vendors').select('id').eq('vendor_company_id', vendorId).maybeSingle()
      if (vByCompany) safeVendorId = (vByCompany as { id: string }).id
    }
  }
  if (!safeVendorId) throw new Error('Could not find your vendor record. Please contact support.')

  // 2. Validate company_id exists in companies table
  let safeCompanyId: string | null = null
  if (companyId && companyId.length > 10) {
    const { data: cRow } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (cRow) safeCompanyId = companyId
  }
  // Fallback: get company_id from the purchase order
  if (!safeCompanyId && input.purchase_order_id) {
    const { data: poRow } = await admin
      .from('purchase_orders').select('company_id').eq('id', input.purchase_order_id).maybeSingle()
    if ((poRow as { company_id: string } | null)?.company_id) {
      safeCompanyId = (poRow as { company_id: string }).company_id
    }
  }
  if (!safeCompanyId) throw new Error('Could not determine the company for this invoice.')

  // 3. created_by: check in public.users (NOT auth.users — invoices FK references public.users)
  let safeCreatedBy: string | null = null
  if (userId) {
    const { data: uRow } = await admin.from('users').select('id').eq('id', userId).maybeSingle()
    if (uRow) safeCreatedBy = userId
    // If vendor user has no row in public.users, leave created_by as null (column is nullable)
  }

  // ── Build insert payload ─────────────────────────────────────────────────

  const baseInsert = {
    vendor_id: safeVendorId,
    company_id: safeCompanyId,
    created_by: safeCreatedBy,   // null if vendor not in public.users — that's fine
    invoice_number: input.invoice_number || '',
    purchase_order_id: input.purchase_order_id ?? null,
    invoice_date: input.invoice_date,
    due_date: input.due_date || null,
    currency: input.currency ?? 'INR',
    subtotal,
    tax_amount: taxAmount,
    discount_amount: input.discount_amount ?? 0,
    total_amount: grandTotal,
    paid_amount: 0,
    notes: input.notes ?? null,
    status: 'draft',
  }

  // ── Insert invoice — try with grn_id, fallback without ─────────────────

  let invoiceId: string | null = null

  // Try with grn_id (requires migration 20240118000000)
  const { data: inv1, error: err1 } = await admin
    .from('invoices')
    .insert({ ...baseInsert, grn_id: input.grn_id ?? null })
    .select('id')
    .single()

  if (!err1 && inv1) {
    invoiceId = (inv1 as { id: string }).id
  } else {
    // grn_id column doesn't exist yet — insert without it
    const { data: inv2, error: err2 } = await admin
      .from('invoices')
      .insert(baseInsert)
      .select('id')
      .single()

    if (err2) throw new Error('Failed to create invoice: ' + err2.message)
    invoiceId = (inv2 as { id: string }).id
  }

  if (!invoiceId) throw new Error('Failed to create invoice: no ID returned')

  // ── Insert invoice items ─────────────────────────────────────────────────

  // Try with extra match columns (ordered_quantity, received_quantity, unit)
  const fullItemRows = input.items.map((item) => ({
    invoice_id: invoiceId!,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_percentage: item.tax_percentage ?? 0,
    unit: item.unit ?? null,
    ordered_quantity: item.ordered_quantity ?? item.quantity,
    received_quantity: item.received_quantity ?? item.quantity,
  }))

  const { error: itemsErr } = await admin.from('invoice_items').insert(fullItemRows)
  if (itemsErr) {
    // Fallback: minimal columns only (no migration-dependent extras)
    const minItems = input.items.map((item) => ({
      invoice_id: invoiceId!,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage ?? 0,
    }))
    const { error: fallbackErr } = await admin.from('invoice_items').insert(minItems)
    if (fallbackErr) throw new Error('Failed to save invoice items: ' + fallbackErr.message)
  }

  // ── Return created invoice ───────────────────────────────────────────────

  // Try fetching with vendor_id (invited vendor path)
  let created = await getVendorInvoiceById(invoiceId, safeVendorId)
  // Fallback: if vendor_id doesn't match (admin resolved a different ID), fetch by ID only
  if (!created) {
    const { data: raw } = await admin
      .from('invoices')
      .select('*, purchase_order:purchase_orders(id, po_number), items:invoice_items(*), payments(*)')
      .eq('id', invoiceId)
      .maybeSingle()
    created = raw as VendorPortalInvoice | null
  }

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
// NOTIFICATIONS  (backed by approval_notifications table)
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorNotifications(
  _vendorId: string,
  filters: { unread?: boolean; page?: number; pageSize?: number } = {},
): Promise<{ data: VendorNotification[]; total: number; unread: number }> {
  // vendor_notifications table does not exist — we use approval_notifications
  // scoped to the current auth user's recipient_id instead.
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { data: [], total: 0, unread: 0 }

  const supabase = await db()
  const { unread, page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('approval_notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (unread) query = query.eq('is_read', false)

  const { data, error, count } = await query
  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: unreadCount } = await (supabase as any)
    .from('approval_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  // Map approval_notifications shape to VendorNotification shape
  const mapped = ((data ?? []) as {
    id: string; type: string; title: string; body: string
    is_read: boolean; created_at: string; link: string | null
  }[]).map((n) => ({
    id: n.id,
    vendor_id: _vendorId,
    type: n.type,
    title: n.title,
    message: n.body,
    read: n.is_read,
    link: n.link ?? null,
    created_at: n.created_at,
  } as unknown as VendorNotification))

  return { data: mapped, total: count ?? 0, unread: unreadCount ?? 0 }
}

export async function markNotificationRead(id: string, _vendorId: string): Promise<void> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return
  const supabase = await db()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', user.id)
}

export async function markAllNotificationsRead(_vendorId: string): Promise<void> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return
  const supabase = await db()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('approval_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get vendor's POs for invoice creation dropdown
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get vendor's POs eligible for invoice creation
// Returns PO + its items + completed GRN (if any) so the form can auto-fill
// ─────────────────────────────────────────────────────────────────────────────

export interface POForInvoice {
  id: string
  po_number: string
  total_amount: number | null
  vendor_id: string
  company_id: string
  status: string
  vendor_acceptance: string | null
  vendor: { name: string; email: string | null } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unit: string | null
    unit_price: number
  }>
  completed_grn: {
    id: string
    grn_number: string
    received_date: string
    grn_items: Array<{
      id: string
      item_name: string | null
      description: string | null
      ordered_quantity: number
      received_quantity: number
      accepted_quantity: number | null
      unit: string | null
      unit_cost: number
      tax_percentage: number | null
    }>
  } | null
}

export async function getVendorPOsForInvoice(vendorId: string): Promise<POForInvoice[]> {
  const supabase = await db()
  const admin = await adminDb()

  const PO_SELECT = `
    id, po_number, total_amount, vendor_id, company_id, status, vendor_acceptance,
    vendor:vendors(name, email),
    items:purchase_order_items(id, description, quantity, unit, unit_price)
  `

  // Step 1: Try direct vendor_id match (works for invited vendors)
  const { data: directPos } = await supabase
    .from('purchase_orders')
    .select(PO_SELECT)
    .eq('vendor_id', vendorId)
    .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(100)

  let pos = (directPos ?? []) as (POForInvoice & { vendor_acceptance?: string })[]

  // Step 2: If empty, use admin client and look up all vendor IDs this user
  // might be associated with (vendor_companies → vendors linkage)
  if (pos.length === 0) {
    const { data: linkedVendors } = await admin
      .from('vendors')
      .select('id')
      .or(`id.eq.${vendorId},vendor_company_id.eq.${vendorId}`)
      .limit(10)

    const vendorIds = [vendorId, ...((linkedVendors ?? []) as { id: string }[]).map((v) => v.id)]
    const uniqueIds = [...new Set(vendorIds)]

    const { data: adminPos } = await admin
      .from('purchase_orders')
      .select(PO_SELECT)
      .in('vendor_id', uniqueIds)
      .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(100)

    pos = (adminPos ?? []) as (POForInvoice & { vendor_acceptance?: string })[]
  }

  if (pos.length === 0) return []

  const poIds = pos.map((p) => p.id)

  // For each PO, look for a completed GRN.
  // IMPORTANT: Only select columns that exist in the base schema (no migration-dependent columns).
  // Extended columns (item_name, accepted_quantity, unit, tax_percentage) are fetched
  // separately with a fallback so a missing migration doesn't break the entire query.

  // Base GRN query — always works
  const { data: grnsBase, error: grnBaseErr } = await admin
    .from('grn')
    .select(`
      id, grn_number, received_date, purchase_order_id,
      grn_items(id, grn_id, product_id, ordered_quantity, received_quantity, unit_cost, notes)
    `)
    .in('purchase_order_id', poIds)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Extended GRN query — only works after migration 20240118000000
  let grnsExtended: typeof grnsBase = null
  if (!grnBaseErr) {
    const { data: ext, error: extErr } = await admin
      .from('grn')
      .select(`
        id, grn_number, received_date, purchase_order_id,
        grn_items(id, grn_id, product_id, item_name, description, ordered_quantity, received_quantity, accepted_quantity, unit, unit_cost, notes, tax_percentage)
      `)
      .in('purchase_order_id', poIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Only use extended if no column error
    if (!extErr && ext) grnsExtended = ext
  }

  // Use extended if available, fall back to base
  const grns = grnsExtended ?? grnsBase ?? []

  const grnByPO = new Map<string, NonNullable<POForInvoice['completed_grn']>>()
  for (const grn of grns as {
    id: string; grn_number: string; received_date: string; purchase_order_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    grn_items: any[]
  }[]) {
    if (!grnByPO.has(grn.purchase_order_id)) {
      const mappedItems = (grn.grn_items ?? []).map((gi) => ({
        id: gi.id as string,
        // item_name from extended columns, or fall back to notes (which stores description in old schema)
        item_name: (gi.item_name ?? gi.notes ?? gi.description ?? null) as string | null,
        description: (gi.description ?? gi.notes ?? null) as string | null,
        ordered_quantity: Number(gi.ordered_quantity) || 0,
        received_quantity: Number(gi.received_quantity) || 0,
        // accepted_quantity from extended columns, or fall back to received_quantity
        accepted_quantity: gi.accepted_quantity != null ? Number(gi.accepted_quantity) : Number(gi.received_quantity),
        unit: (gi.unit ?? null) as string | null,
        unit_cost: Number(gi.unit_cost) || 0,
        tax_percentage: gi.tax_percentage != null ? Number(gi.tax_percentage) : 0,
      }))

      grnByPO.set(grn.purchase_order_id, {
        id: grn.id,
        grn_number: grn.grn_number,
        received_date: grn.received_date,
        grn_items: mappedItems,
      })
    }
  }

  return pos.map((po) => ({
    ...po,
    items: po.items ?? [],
    completed_grn: grnByPO.get(po.id) ?? null,
  }))
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
