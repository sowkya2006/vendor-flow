import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const PREVIEW_ROLE_COOKIE = 'vf_preview_role'
const VALID_ROLES = [
  'administrator', 'procurement_manager', 'procurement_officer',
  'warehouse_manager', 'finance_manager',
]

// ─────────────────────────────────────────────────────────────────────────────
// getUser — cached per-request, throws if unauthenticated
// ─────────────────────────────────────────────────────────────────────────────
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user
})

// ─────────────────────────────────────────────────────────────────────────────
// getCompanyId — cached per-request
// ─────────────────────────────────────────────────────────────────────────────
export const getCompanyId = cache(async (): Promise<string> => {
  const user = await getUser()

  // NOTE: Do NOT use user_metadata.company_id as a shortcut.
  // Metadata can be stale (set at signup time, never updated).
  // Always read from the database to get the current company_id.

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const userRow = data as { company_id: string } | null

  if (error || !userRow?.company_id) {
    // Could not load company_id. Two possible reasons:
    //   1. Transient DB/RLS error — safe to throw, middleware will catch
    //   2. Vendor user who reached a company-portal server action
    //
    // NEVER redirect to /vendor/login here. That would send company users
    // to the wrong portal on any transient DB error. Throw instead so the
    // caller (server action / layout) can handle it gracefully, and the
    // middleware will redirect to /company/login if the session is invalid.
    throw new Error('Company record not found. Please sign in again.')
  }

  return userRow!.company_id
})

// ─────────────────────────────────────────────────────────────────────────────
// getRealRole — always returns the actual DB role, ignoring preview
// Used internally and for admin checks only
// ─────────────────────────────────────────────────────────────────────────────
export const getRealRole = cache(async (): Promise<string> => {
  const user = await getUser()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return (data as { role: string } | null)?.role ?? 'viewer'
})

// ─────────────────────────────────────────────────────────────────────────────
// getUserRole — returns effective role:
//   • If admin has set a preview cookie → returns preview role
//   • Otherwise → returns the real DB role
//
// This means ALL permission checks (guards, canCreate, etc.) automatically
// use the correct role when admin is in preview mode.
// ─────────────────────────────────────────────────────────────────────────────
export const getUserRole = cache(async (): Promise<string> => {
  try {
    const realRole = await getRealRole()

    // Only administrators can have a preview role active
    if (realRole !== 'administrator' && realRole !== 'admin') return realRole

    // Check for preview cookie
    try {
      const cookieStore = await cookies()
      const previewRole = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value
      if (previewRole && VALID_ROLES.includes(previewRole)) {
        return previewRole
      }
    } catch {
      // cookies() may throw outside of a request context — fall through
    }

    return realRole
  } catch {
    // If anything fails (session expired, etc.) return a safe default
    return 'viewer'
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// getUserProfile — full profile row for the REAL logged-in user
// ─────────────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  role: string
  department: string | null
  designation: string | null
  status: string
}

export const getUserProfile = cache(async (): Promise<UserProfile> => {
  const user = await getUser()
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('users')
    .select('id, company_id, full_name, email, role, department, designation, status')
    .eq('id', user.id)
    .single()
  if (error || !data) throw new Error('Could not load user profile')
  return data as UserProfile
})

// ─────────────────────────────────────────────────────────────────────────────
// getEffectiveProfile — preview-aware profile
//
// • In normal mode: returns the real logged-in user's profile
// • In preview mode: returns the profile of the previewed-role employee
//   (falls back to admin profile if no employee with that role exists)
//
// Used by Settings page so the admin sees the correct profile when previewing.
// ─────────────────────────────────────────────────────────────────────────────
export const getEffectiveProfile = cache(async (): Promise<UserProfile & { isPreview: boolean }> => {
  const realProfile = await getUserProfile()
  const effectiveRole = await getUserRole()

  // Not in preview mode — return real profile
  if (effectiveRole === realProfile.role || effectiveRole === 'administrator' || effectiveRole === 'admin') {
    return { ...realProfile, isPreview: false }
  }

  // In preview mode — find an employee with the previewed role
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('users')
    .select('id, company_id, full_name, email, role, department, designation, status')
    .eq('company_id', realProfile.company_id)
    .eq('role', effectiveRole)
    .eq('status', 'active')
    .neq('id', realProfile.id) // not the admin themselves
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (data) {
    return { ...(data as UserProfile), isPreview: true }
  }

  // No employee with that role found — show the real admin profile but
  // override the role display so it reads correctly in the settings UI.
  // Also clear personal details so it's obvious this is a preview placeholder.
  return {
    ...realProfile,
    role: effectiveRole,
    full_name: `[Preview: ${effectiveRole.replace(/_/g, ' ')}]`,
    email: realProfile.email,
    department: null,
    designation: null,
    isPreview: true,
  }
})
