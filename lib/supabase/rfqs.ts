import { createClient } from '@/lib/supabase/server'
import type {
  RFQ,
  RFQSummary,
  RFQFormData,
  RFQFilters,
} from '@/types/rfq'

const TABLE = 'rfqs'

// Database types stub workaround — same pattern as vendors.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (table: string) => any }
}

/**
 * Paginated, filtered list of RFQs scoped to a company.
 */
export async function getRFQs(companyId: string, filters: RFQFilters = {}) {
  const supabase = await db()
  const { search, status, priority, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from(TABLE)
    .select(
      `id, rfq_number, title, status, priority, due_date, created_at, updated_at,
       vendor:vendors(id, name, status)`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('title', `%${search}%`)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as RFQSummary[],
    total: (count ?? 0) as number,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

/**
 * Single RFQ by ID with vendor and line items, scoped to a company.
 */
export async function getRFQById(id: string, companyId: string): Promise<RFQ | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `*, vendor:vendors(id, name, email, status, category),
       items:rfq_items(*)`,
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as RFQ
}

/**
 * Insert a new RFQ and its line items.
 */
export async function createRFQ(
  companyId: string,
  createdBy: string,
  data: RFQFormData,
): Promise<RFQ> {
  const supabase = await db()

  const { data: rfq, error } = await supabase
    .from(TABLE)
    .insert({
      company_id: companyId,
      created_by: createdBy,
      title: data.title,
      description: data.description ?? null,
      vendor_id: data.vendor_id,
      due_date: data.due_date ?? null,
      priority: data.priority ?? 'medium',
      terms: data.terms ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error

  if (data.items && data.items.length > 0) {
    const items = data.items.map((item) => ({
      rfq_id: rfq.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price ?? null,
    }))
    const { error: itemsError } = await supabase.from('rfq_items').insert(items)
    if (itemsError) throw itemsError
  }

  return rfq as RFQ
}

/**
 * Partial update of an RFQ, scoped to a company.
 */
export async function updateRFQ(
  id: string,
  companyId: string,
  data: Partial<RFQFormData>,
): Promise<RFQ> {
  const supabase = await db()
  const { data: rfq, error } = await supabase
    .from(TABLE)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error
  return rfq as RFQ
}

/**
 * Delete an RFQ, scoped to a company.
 */
export async function deleteRFQ(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw error
}
