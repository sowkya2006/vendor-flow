import { createClient } from '@/lib/supabase/server'
import type {
  Vendor,
  VendorSummary,
  CreateVendorPayload,
  UpdateVendorPayload,
  VendorFilters,
} from '@/types/vendor'

const TABLE = 'vendors'

// The Database type stub has Tables: Record<string, never>, so Supabase's
// generated types resolve .from() to `never`. Cast to `any` here and re-assert
// return types at each call site. Remove once types are generated from Supabase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (table: string) => any }
}

/**
 * Paginated, filtered list of vendors scoped to a company.
 */
export async function getVendors(companyId: string, filters: VendorFilters = {}) {
  const supabase = await db()
  const { search, status, category, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from(TABLE)
    .select(
      'id, name, category, status, email, website, contract_value, contract_end_date, created_at',
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as VendorSummary[],
    total: (count ?? 0) as number,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

/**
 * Single vendor by ID, scoped to a company.
 */
export async function getVendorById(id: string, companyId: string): Promise<Vendor | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Vendor
}

/**
 * Insert a new vendor record.
 */
export async function createVendor(payload: CreateVendorPayload): Promise<Vendor> {
  const supabase = await db()
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single()
  if (error) throw error
  return data as Vendor
}

/**
 * Update an existing vendor. Only the supplied fields are changed.
 */
export async function updateVendor(
  { id, ...fields }: UpdateVendorPayload,
  companyId: string,
): Promise<Vendor> {
  const supabase = await db()
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error
  return data as Vendor
}

/**
 * Delete a vendor, scoped to a company.
 */
export async function deleteVendor(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}
