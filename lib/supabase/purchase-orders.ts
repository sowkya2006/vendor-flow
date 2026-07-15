import { createClient } from '@/lib/supabase/server'
import type {
  PurchaseOrder,
  PurchaseOrderSummary,
  PurchaseOrderFormData,
  PurchaseOrderFilters,
} from '@/types/purchase-order'

const TABLE = 'purchase_orders'

// Database types stub workaround — same pattern as vendors.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (table: string) => any }
}

/**
 * Paginated, filtered list of POs scoped to a company.
 */
export async function getPurchaseOrders(
  companyId: string,
  filters: PurchaseOrderFilters = {},
) {
  const supabase = await db()
  const { search, status, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from(TABLE)
    .select(
      `id, po_number, status, total_amount, due_date, created_at, updated_at,
       vendor:vendors(id, name, status)`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('po_number', `%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as PurchaseOrderSummary[],
    total: (count ?? 0) as number,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

/**
 * Single PO by ID with vendor, line items, and quotation provenance.
 */
export async function getPurchaseOrderById(
  id: string,
  companyId: string,
): Promise<PurchaseOrder | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `*, vendor:vendors(id, name, email, status, category),
       items:purchase_order_items(*),
       quotation:quotations(id, quotation_number, rfq_id, grand_total,
         rfq:rfqs(id, rfq_number, title))`,
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as PurchaseOrder
}

/**
 * Insert a new PO from an approved quotation.
 * Validates that the quotation is approved and doesn't already have a PO.
 */
export async function createPurchaseOrder(
  companyId: string,
  createdBy: string,
  data: PurchaseOrderFormData,
): Promise<PurchaseOrder> {
  const supabase = await db()

  const quotationId = data.quotation_id && data.quotation_id !== '' ? data.quotation_id : null
  const rfqId = data.rfq_id && data.rfq_id !== '' ? data.rfq_id : null

  // Validate quotation if provided
  if (quotationId) {
    const { data: quotation } = await supabase
      .from('quotations')
      .select('id, status, vendor_id')
      .eq('id', quotationId)
      .eq('company_id', companyId)
      .single()

    if (!quotation) throw new Error('Quotation not found')
    if (quotation.status !== 'approved') {
      throw new Error('Purchase Order can only be created from an approved quotation')
    }

    // Check no existing PO for this quotation
    const { data: existingPO } = await supabase
      .from(TABLE)
      .select('id')
      .eq('quotation_id', quotationId)
      .maybeSingle()

    if (existingPO) {
      throw new Error('A Purchase Order already exists for this quotation')
    }
  }

  const { data: po, error } = await supabase
    .from(TABLE)
    .insert({
      company_id: companyId,
      created_by: createdBy,
      vendor_id: data.vendor_id,
      rfq_id: rfqId,
      quotation_id: quotationId,
      due_date: data.due_date && data.due_date !== '' ? data.due_date : null,
      shipping_address: data.shipping_address || null,
      billing_address: data.billing_address || null,
      payment_terms: data.payment_terms || null,
      notes: data.notes || null,
      status: 'draft',
      vendor_acceptance: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  if (data.items && data.items.length > 0) {
    const items = data.items.map((item) => ({
      purchase_order_id: po.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
    }))
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items)
    if (itemsError) throw itemsError
  }

  // Mark quotation as "po_created" so it disappears from the "Create PO" list
  if (quotationId) {
    await supabase
      .from('quotations')
      .update({ status: 'awarded', updated_at: new Date().toISOString() })
      .eq('id', quotationId)
  }

  return po as PurchaseOrder
}

/**
 * Partial update of a PO, scoped to a company.
 */
export async function updatePurchaseOrder(
  id: string,
  companyId: string,
  data: Partial<PurchaseOrderFormData>,
): Promise<PurchaseOrder> {
  const supabase = await db()

  // Coerce empty strings to null for all nullable columns
  const sanitized: Record<string, unknown> = { ...data }
  const nullableFields = ['rfq_id', 'due_date', 'shipping_address', 'billing_address', 'payment_terms', 'notes'] as const
  for (const field of nullableFields) {
    if (field in sanitized && (sanitized[field] === '' || sanitized[field] === undefined)) {
      sanitized[field] = null
    }
  }

  const { data: po, error } = await supabase
    .from(TABLE)
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  return po as PurchaseOrder
}

/**
 * Delete a PO, scoped to a company.
 */
export async function deletePurchaseOrder(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw error
}
