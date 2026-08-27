/**
 * vendor-registration.ts
 * Server-side data layer for vendor self-registration and collaboration.
 */
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (t: string) => any; rpc: (fn: string, args?: any) => any }

// Default: auth-scoped (respects RLS via session cookie)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as AnyClient
}

// Service-role client — bypasses RLS; use only in server actions where the
// auth cookie may not yet be attached (e.g. immediately after signUp/signIn)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serviceDb(): AnyClient {
  return createAdminClient() as unknown as AnyClient
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorCompany {
  id: string
  user_id: string
  company_name: string
  contact_name: string | null
  email: string
  phone: string | null
  website: string | null
  address: string | null
  industry: string | null
  gst_number: string | null
  description: string | null
  logo_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface CollaborationRequest {
  id: string
  vendor_user_id: string
  vendor_company_id: string
  company_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  message: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  vendor_company?: VendorCompany
  company?: { id: string; name: string; workspace_name: string | null }
}

export interface PublicCompany {
  id: string
  name: string
  workspace_name: string | null
  industry: string | null
  address: string | null
  phone: string | null
  setup_complete: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR SELF-REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

export async function getVendorCompanyByUserId(
  userId: string,
  { useServiceRole = false }: { useServiceRole?: boolean } = {},
): Promise<VendorCompany | null> {
  // Use service role when the caller can't guarantee the session cookie is set
  // (e.g. immediately after sign-in in the same request).
  const supabase = useServiceRole ? serviceDb() : await db()
  const { data } = await supabase.from('vendor_companies').select('*').eq('user_id', userId).maybeSingle()
  return data as VendorCompany | null
}

export interface RegisterVendorInput {
  company_name: string
  contact_name?: string | null
  email: string
  phone?: string | null
  website?: string | null
  address?: string | null
  industry?: string | null
  gst_number?: string | null
  description?: string | null
}

export async function registerVendorCompany(
  userId: string,
  input: RegisterVendorInput,
  { useServiceRole = false }: { useServiceRole?: boolean } = {},
): Promise<VendorCompany> {
  const supabase = useServiceRole ? serviceDb() : await db()
  const { data, error } = await supabase
    .from('vendor_companies')
    .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) {
    // Always throw a proper Error object with a string message
    const msg = typeof error === 'object' && error !== null
      ? (error as { message?: string }).message ?? JSON.stringify(error)
      : String(error)
    throw new Error(msg)
  }
  return data as VendorCompany
}

export async function updateVendorCompany(userId: string, input: Partial<RegisterVendorInput>): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('vendor_companies')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER COMPANIES (vendor browses all registered companies)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPublicCompanies(page = 1, pageSize = 20): Promise<{ data: PublicCompany[]; total: number }> {
  const supabase = await db()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // This query reads all companies with setup_complete = true.
  // The RLS policy "companies_vendor_discovery" allows any authenticated
  // user to read completed company profiles (for vendor discovery).
  const { data, error, count } = await supabase
    .from('companies')
    .select('id, name, workspace_name, industry, address, phone, setup_complete', { count: 'exact' })
    .eq('setup_complete', true)
    .order('name')
    .range(from, to)

  if (error) {
    // If RLS blocks it (e.g. migration not yet applied), return empty
    console.warn('[vendor-registration] getPublicCompanies RLS error:', error.message)
    return { data: [], total: 0 }
  }
  return { data: (data ?? []) as PublicCompany[], total: count ?? 0 }
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendCollaborationRequest(
  vendorUserId: string,
  vendorCompanyId: string,
  companyId: string,
  message?: string,
): Promise<CollaborationRequest> {
  // Use service role to bypass potential RLS timing issues in server actions
  const supabase = serviceDb()
  const { data, error } = await supabase
    .from('collaboration_requests')
    .upsert({
      vendor_user_id: vendorUserId,
      vendor_company_id: vendorCompanyId,
      company_id: companyId,
      status: 'pending',
      message: message ?? null,
    }, { onConflict: 'vendor_company_id,company_id' })
    .select()
    .single()
  if (error) throw error
  return data as CollaborationRequest
}

export async function withdrawCollaborationRequest(vendorUserId: string, requestId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('collaboration_requests')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('vendor_user_id', vendorUserId)
    .eq('status', 'pending')
  if (error) throw error
}

export async function getVendorCollaborationRequests(vendorUserId: string): Promise<CollaborationRequest[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('collaboration_requests')
    .select('*, company:companies(id, name, workspace_name)')
    .eq('vendor_user_id', vendorUserId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as CollaborationRequest[]
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY SIDE — review incoming requests
// ─────────────────────────────────────────────────────────────────────────────

export async function getIncomingCollaborationRequests(
  companyId: string,
  status?: string,
): Promise<CollaborationRequest[]> {
  const supabase = await db()
  let query = supabase
    .from('collaboration_requests')
    .select('*, vendor_company:vendor_companies(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CollaborationRequest[]
}

export async function acceptCollaborationRequest(
  requestId: string,
  reviewedBy: string,
): Promise<string | null> {
  const supabase = await db()
  const { data, error } = await supabase.rpc('accept_collaboration_request', {
    p_request_id: requestId,
    p_reviewed_by: reviewedBy,
  })
  if (error) throw error
  return data as string | null
}

export async function rejectCollaborationRequest(
  requestId: string,
  reviewedBy: string,
  reason?: string,
): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('collaboration_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason ?? null,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
  if (error) throw error
}
