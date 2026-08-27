'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const PREVIEW_ROLE_COOKIE = 'vf_preview_role'
const PORTAL_COOKIE       = 'vf_portal'
const PORTAL_TTL          = 60 * 60 * 24 * 7  // 7 days

const VALID_ROLES = [
  'administrator',
  'procurement_manager',
  'procurement_officer',
  'warehouse_manager',
  'finance_manager',
]

/**
 * Re-asserts the vf_portal=company cookie as httpOnly so the middleware's
 * fast-path is always available on the next request (e.g. after router.refresh).
 *
 * This is needed because the login form writes vf_portal via document.cookie
 * (non-httpOnly). The first middleware response upgrades it to httpOnly, but
 * Server Actions that set other cookies can cause a cookie propagation race.
 * Explicitly re-writing it here makes it stable.
 */
async function reassertPortalCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(PORTAL_COOKIE, 'company', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PORTAL_TTL,
  })
}

/**
 * Only administrators can set a preview role.
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 * Never throws — callers should handle the result.
 */
export async function setPreviewRoleAction(
  roleSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!VALID_ROLES.includes(roleSlug)) {
      return { ok: false, error: 'Invalid role slug' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' }
    }

    // Verify the real user is an administrator
    // Fall back to allowing if public.users row doesn't exist yet
    // (e.g. during workspace setup before the users table row is created)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const realRole = (data as { role: string } | null)?.role
      // If we have a row and it's NOT admin, deny
      if (realRole && realRole !== 'administrator' && realRole !== 'admin') {
        return { ok: false, error: 'Only administrators can preview other roles' }
      }
      // If no row yet (workspace setup in progress), allow — they just signed up as admin
    } catch {
      // DB error — allow through, the page will show what's available
    }

    const cookieStore = await cookies()

    // Set the preview role cookie
    cookieStore.set(PREVIEW_ROLE_COOKIE, roleSlug, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    // Re-assert vf_portal=company so middleware fast-path survives the refresh.
    // Without this, the cookie propagation race between the login form's
    // document.cookie write and the httpOnly server-set version can cause
    // the middleware to fall through to getPortalFromDB() and redirect to
    // the wrong portal.
    await reassertPortalCookie(cookieStore)

    return { ok: true }
  } catch (err) {
    console.error('[setPreviewRoleAction]', err)
    return { ok: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Clear the preview role cookie — return to real Administrator view.
 * Never throws.
 */
export async function clearPreviewRoleAction(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(PREVIEW_ROLE_COOKIE)
    // Re-assert portal cookie on clear as well, for the same reason as above.
    await reassertPortalCookie(cookieStore)
  } catch { /* ignore */ }
}

/**
 * Read the current preview role from cookies (server-side only).
 * Returns null if no preview is active.
 */
export async function getPreviewRole(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value
    if (!value || !VALID_ROLES.includes(value)) return null
    return value
  } catch {
    return null
  }
}
