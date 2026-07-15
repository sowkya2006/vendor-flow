import { createClient } from '@/lib/supabase/server'
import type {
  PurchaseRequest,
  PRSummary,
  PRFormData,
  PRFilters,
  PRStats,
} from '@/types/purchase-request'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (table: string) => any }
}

const PR_SUMMARY_SELECT = `
  id, pr_number, title, department, status, priority,
  required_date, budget_amount, currency, submitted_at, created_at, updated_at,
  requester:users!purchase_requests_requested_by_fkey ( id, full_name, email )
`

const PR_DETAIL_SELECT = `
  *,
  requester:users!purchase_requests_requested_by_fkey ( id, full_name, email ),
  approver:users!purchase_requests_approved_by_fkey ( id, full_name, email ),
  items:pr_items (
    *,
    product:products ( id, name, sku, unit )
  )
`

export async function getPurchaseRequests(
  companyId: string,
  filters: PRFilters = {},
): Promise<{ data: PRSummary[]; total: number; page: number; pageSize: number; hasNextPage: boolean }> {
  const supabase = await db()
  const { search, status, priority, department, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('purchase_requests')
    .select(PR_SUMMARY_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (department) query = query.eq('department', department)
  if (search) query = query.or(`title.ilike.%${search}%,pr_number.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as PRSummary[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

export async function getPRById(
  id: string,
  companyId: string,
): Promise<PurchaseRequest | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(PR_DETAIL_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as PurchaseRequest
}

export async function createPR(
  companyId: string,
  requestedBy: string,
  data: PRFormData,
): Promise<PurchaseRequest> {
  const supabase = await db()

  const { data: pr, error } = await supabase
    .from('purchase_requests')
    .insert({
      company_id: companyId,
      requested_by: requestedBy,
      title: data.title,
      description: data.description ?? null,
      department: data.department ?? null,
      priority: data.priority ?? 'medium',
      required_date: data.required_date ?? null,
      budget_amount: data.budget_amount ?? null,
      currency: data.currency ?? 'INR',
      notes: data.notes ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error

  if (data.items && data.items.length > 0) {
    const items = data.items.map((item) => ({
      pr_id: pr.id,
      product_id: item.product_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price ?? null,
      notes: item.notes ?? null,
    }))
    const { error: itemsErr } = await supabase.from('pr_items').insert(items)
    if (itemsErr) throw itemsErr
  }

  return pr as PurchaseRequest
}

export async function updatePR(
  id: string,
  companyId: string,
  data: Partial<PRFormData>,
): Promise<PurchaseRequest> {
  const supabase = await db()
  const { data: pr, error } = await supabase
    .from('purchase_requests')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error
  return pr as PurchaseRequest
}

export async function updatePRStatus(
  id: string,
  companyId: string,
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled',
  opts?: { approvedBy?: string; rejectionReason?: string },
): Promise<void> {
  const supabase = await db()
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'submitted') patch.submitted_at = new Date().toISOString()
  if (status === 'approved') {
    patch.approved_at = new Date().toISOString()
    if (opts?.approvedBy) patch.approved_by = opts.approvedBy
  }
  if (status === 'rejected' && opts?.rejectionReason) {
    patch.rejection_reason = opts.rejectionReason
  }
  const { error } = await supabase
    .from('purchase_requests')
    .update(patch)
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

export async function deletePR(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('purchase_requests')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
    .eq('status', 'draft')
  if (error) throw error
}

export async function getPRStats(companyId: string): Promise<PRStats> {
  const supabase = await db()

  const [total, draft, submitted, underReview, approved, rejected, converted, budget] = await Promise.all([
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'draft'),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'submitted'),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'under_review'),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'approved'),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'rejected'),
    supabase.from('purchase_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'converted'),
    supabase.from('purchase_requests').select('budget_amount').eq('company_id', companyId).not('budget_amount', 'is', null),
  ])

  const totalBudget = (budget.data ?? []).reduce(
    (s: number, r: { budget_amount: number }) => s + (r.budget_amount ?? 0),
    0,
  )

  return {
    total: total.count ?? 0,
    draft: draft.count ?? 0,
    submitted: submitted.count ?? 0,
    under_review: underReview.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    converted: converted.count ?? 0,
    total_budget: totalBudget,
  }
}
