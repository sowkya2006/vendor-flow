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
 * Single PO by ID with vendor and line items, scoped to a company.
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
       items:purchase_order_items(*)`,
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
 * Insert a new PO and its line items.
 */
export async function createPurchaseOrder(
  companyId: string,
  createdBy: string,
  data: PurchaseOrderFormData,
): Promise<PurchaseOrder> {
  const supabase = await db()

  // Coerce empty strings to null so FK columns don't receive ''
  const rfqId = data.rfq_id && data.rfq_id !== '' ? data.rfq_id : null

  const { data: po, error } = await supabase
    .from(TABLE)
    .insert({
      company_id: companyId,
      created_by: createdBy,
      vendor_id: data.vendor_id,
      rfq_id: rfqId,
      due_date: data.due_date && data.due_date !== '' ? data.due_date : null,
      shipping_address: data.shipping_address && data.shipping_address !== '' ? data.shipping_address : null,
      billing_address: data.billing_address && data.billing_address !== '' ? data.billing_address : null,
      payment_terms: data.payment_terms && data.payment_terms !== '' ? data.payment_terms : null,
      notes: data.notes && data.notes !== '' ? data.notes : null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error

  if (data.items && data.items.length > 0) {
    // Do NOT include total_price — it is a GENERATED ALWAYS column in Postgres
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
