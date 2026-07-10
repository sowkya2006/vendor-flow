import { createClient } from '@/lib/supabase/server'
import type {
  Quotation,
  QuotationSummary,
  QuotationFormData,
  QuotationFilters,
  QuotationListResult,
  QuotationStats,
  QuotationItemFormData,
} from '@/types/quotation'

const TABLE = 'quotations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (table: string) => any; rpc: (fn: string, args?: any) => any }
}

// ---------------------------------------------------------------------------
// getQuotations — paginated, filtered list
// ---------------------------------------------------------------------------
export async function getQuotations(
  companyId: string,
  filters: QuotationFilters = {},
): Promise<QuotationListResult> {
  const supabase = await db()
  const { search, status, rfq_id, vendor_id, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from(TABLE)
    .select(
      `id, quotation_number, status, grand_total, subtotal, discount_amount, tax_amount,
       delivery_days, warranty_months, lead_time_days, submitted_at, created_at, updated_at,
       rfq_id, vendor_id,
       vendor:vendors ( id, name, status, category ),
       rfq:rfqs ( id, title, rfq_number, due_date )`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (rfq_id) query = query.eq('rfq_id', rfq_id)
  if (vendor_id) query = query.eq('vendor_id', vendor_id)
  if (search) {
    query = query.or(`quotation_number.ilike.%${search}%,notes.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as QuotationSummary[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ---------------------------------------------------------------------------
// getQuotationById — single with all relations
// ---------------------------------------------------------------------------
export async function getQuotationById(
  id: string,
  companyId: string,
): Promise<Quotation | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `*,
       vendor:vendors ( id, name, email, phone, category, status ),
       rfq:rfqs ( id, title, rfq_number, due_date ),
       items:quotation_items (*),
       documents:quotation_documents (*),
       comments:quotation_comments (*)`,
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Quotation
}

// ---------------------------------------------------------------------------
// createQuotation
// ---------------------------------------------------------------------------
export async function createQuotation(
  companyId: string,
  createdBy: string,
  data: QuotationFormData,
): Promise<Quotation> {
  const supabase = await db()

  // Generate quotation number
  const { data: quotNumber, error: numErr } = await supabase.rpc(
    'generate_quotation_number',
    { p_company_id: companyId },
  )
  if (numErr) throw numErr

  const { items, ...fields } = data

  const { data: quotation, error } = await supabase
    .from(TABLE)
    .insert({
      company_id: companyId,
      quotation_number: quotNumber as string,
      status: 'draft',
      created_by: createdBy,
      updated_by: createdBy,
      rfq_id: fields.rfq_id,
      vendor_id: fields.vendor_id,
      discount_type: fields.discount_type ?? 'percentage',
      discount_value: fields.discount_value ?? 0,
      delivery_days: fields.delivery_days ?? null,
      lead_time_days: fields.lead_time_days ?? null,
      warranty_months: fields.warranty_months ?? null,
      payment_terms: fields.payment_terms ?? null,
      validity_date: fields.validity_date ?? null,
      notes: fields.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error

  if (items && items.length > 0) {
    await upsertQuotationItems(quotation.id, items, supabase)
  }

  return quotation as Quotation
}

// ---------------------------------------------------------------------------
// updateQuotation
// ---------------------------------------------------------------------------
export async function updateQuotation(
  id: string,
  companyId: string,
  data: Partial<QuotationFormData>,
  updatedBy?: string,
): Promise<Quotation> {
  const supabase = await db()
  const { items, ...fields } = data

  const nullable = [
    'delivery_days', 'lead_time_days', 'warranty_months',
    'payment_terms', 'validity_date', 'notes',
  ] as const
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: Record<string, any> = { ...fields }
  for (const key of nullable) {
    if (key in sanitized && (sanitized[key] === '' || sanitized[key] === undefined)) {
      sanitized[key] = null
    }
  }
  if (updatedBy) sanitized.updated_by = updatedBy

  const { data: quotation, error } = await supabase
    .from(TABLE)
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error

  if (items !== undefined) {
    // Delete existing items and re-insert
    const { error: delErr } = await supabase
      .from('quotation_items')
      .delete()
      .eq('quotation_id', id)
    if (delErr) throw delErr

    if (items.length > 0) {
      await upsertQuotationItems(id, items, supabase)
    }
  }

  return quotation as Quotation
}

// ---------------------------------------------------------------------------
// deleteQuotation
// ---------------------------------------------------------------------------
export async function deleteQuotation(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// submitQuotation  draft → submitted
// ---------------------------------------------------------------------------
export async function submitQuotation(
  id: string,
  companyId: string,
  userId: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .eq('status', 'draft')
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'submitted', { status: 'draft' }, { status: 'submitted' })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// approveQuotation  * → approved
// ---------------------------------------------------------------------------
export async function approveQuotation(
  id: string,
  companyId: string,
  userId: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'approved', null, { status: 'approved' })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// rejectQuotation  * → rejected
// ---------------------------------------------------------------------------
export async function rejectQuotation(
  id: string,
  companyId: string,
  userId: string,
  reason: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'rejected',
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'rejected', null, { status: 'rejected', rejection_reason: reason })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// shortlistQuotation  * → shortlisted
// ---------------------------------------------------------------------------
export async function shortlistQuotation(
  id: string,
  companyId: string,
  userId: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'shortlisted',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'shortlisted', null, { status: 'shortlisted' })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// reopenQuotation  rejected/expired → under_review
// ---------------------------------------------------------------------------
export async function reopenQuotation(
  id: string,
  companyId: string,
  userId: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'under_review',
      rejection_reason: null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'reopened', null, { status: 'under_review' })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// markUnderReview  submitted → under_review
// ---------------------------------------------------------------------------
export async function markUnderReview(
  id: string,
  companyId: string,
  userId: string,
): Promise<Quotation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'under_review',
      reviewed_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  await logHistory(supabase, id, companyId, userId, 'under_review', null, { status: 'under_review' })
  return data as Quotation
}

// ---------------------------------------------------------------------------
// compareQuotations — returns all quotations for an RFQ with enriched data
// ---------------------------------------------------------------------------
export async function compareQuotations(
  rfqId: string,
  companyId: string,
): Promise<QuotationSummary[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `id, quotation_number, status, grand_total, subtotal, discount_amount, tax_amount,
       delivery_days, warranty_months, lead_time_days, submitted_at, created_at, updated_at,
       rfq_id, vendor_id,
       vendor:vendors ( id, name, status, category ),
       rfq:rfqs ( id, title, rfq_number, due_date )`,
    )
    .eq('rfq_id', rfqId)
    .eq('company_id', companyId)
    .in('status', ['submitted', 'under_review', 'shortlisted', 'approved', 'rejected'])
    .order('grand_total', { ascending: true })

  if (error) throw error
  return (data ?? []) as QuotationSummary[]
}

// ---------------------------------------------------------------------------
// getQuotationStats
// ---------------------------------------------------------------------------
export async function getQuotationStats(companyId: string): Promise<QuotationStats> {
  const supabase = await db()

  const [all, pendingReview, approved, rejected, lowestBid] = await Promise.all([
    supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['submitted', 'under_review']),
    supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'approved'),
    supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'rejected'),
    supabase.from(TABLE).select('grand_total').eq('company_id', companyId).in('status', ['submitted', 'under_review', 'shortlisted', 'approved']).order('grand_total', { ascending: true }).limit(1),
  ])

  return {
    total: all.count ?? 0,
    pending_review: pendingReview.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    lowest_bid: lowestBid.data?.[0]?.grand_total ?? null,
  }
}

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------
export async function addQuotationComment(
  quotationId: string,
  companyId: string,
  userId: string,
  comment: string,
  isInternal = false,
) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('quotation_comments')
    .insert({
      quotation_id: quotationId,
      company_id: companyId,
      comment,
      is_internal: isInternal,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function upsertQuotationItems(
  quotationId: string,
  items: QuotationItemFormData[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  const rows = items.map((item, idx) => ({
    quotation_id: quotationId,
    rfq_item_id: item.rfq_item_id ?? null,
    item_name: item.item_name,
    description: item.description ?? null,
    part_number: item.part_number ?? null,
    unit: item.unit || 'unit',
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_pct: item.discount_pct ?? 0,
    tax_pct: item.tax_pct ?? 0,
    delivery_days: item.delivery_days ?? null,
    warranty_months: item.warranty_months ?? null,
    remarks: item.remarks ?? null,
    sort_order: item.sort_order ?? idx,
  }))

  const { error } = await supabase.from('quotation_items').insert(rows)
  if (error) throw error
}

async function logHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  quotationId: string,
  companyId: string,
  userId: string,
  action: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
) {
  await supabase.from('quotation_history').insert({
    quotation_id: quotationId,
    company_id: companyId,
    action,
    old_values: oldValues,
    new_values: newValues,
    performed_by: userId,
  })
}
