import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/logout
 *
 * The single logout endpoint for both Company and Vendor portals.
 *
 * 1. Signs the user out of Supabase (invalidates the JWT server-side)
 * 2. Clears ALL portal and session cookies
 * 3. Redirects to the landing page (/)
 *
 * This ensures that after logout, visiting / always shows the portal
 * selection screen — never auto-redirects to vendor or company dashboard.
 */
export async function GET(request: Request) {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  const { origin } = new URL(request.url)
  const res = NextResponse.redirect(`${origin}/`)

  // Clear ALL portal-related cookies
  const cookiesToClear = [
    'vf_portal',        // portal type cookie (company | vendor)
    'vf_ctx',           // legacy cache cookie
    'vf_preview_role',  // admin role preview cookie
  ]

  for (const name of cookiesToClear) {
    res.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge:   0,
      path:     '/',
    })
  }

  return res
}
