'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const PREVIEW_ROLE_COOKIE = 'vf_preview_role'

const VALID_ROLES = [
  'administrator',
  'procurement_manager',
  'procurement_officer',
  'warehouse_manager',
  'finance_manager',
]

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const realRole = (data as { role: string } | null)?.role
    if (realRole !== 'administrator' && realRole !== 'admin') {
      return { ok: false, error: 'Only administrators can preview other roles' }
    }

    const cookieStore = await cookies()
    cookieStore.set(PREVIEW_ROLE_COOKIE, roleSlug, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

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
