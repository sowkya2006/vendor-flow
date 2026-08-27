import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTAL_TTL = 60 * 60 * 24 * 7

/**
 * GET /api/auth/finalize?portal=company|vendor
 *
 * Called by /auth/magic-callback after session is established client-side.
 * At this point the Supabase session cookies ARE available server-side
 * (the browser has them from the hash fragment exchange).
 *
 * This route:
 * 1. Reads the authenticated user server-side
 * 2. Determines correct destination (workspace/setup vs dashboard vs vendor flow)
 * 3. Sets vf_portal cookie as httpOnly
 * 4. Redirects to correct destination
 *
 * This is the authoritative routing decision for post-authentication.
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const portalParam = searchParams.get('portal') ?? 'company'

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Session not yet propagated to server cookies.
      // For company users, default to /workspace/setup (safe fallback).
      // For vendor users, default to /vendor/login with hint.
      console.warn('[finalize] No session found, using safe fallback')
      if (portalParam === 'vendor') {
        return NextResponse.redirect(`${origin}/vendor/login?hint=use_password`)
      }
      // Safe fallback for company — workspace/setup is always safe
      // because the setup page redirects to /dashboard if already complete
      const res = NextResponse.redirect(`${origin}/workspace/setup`)
      res.cookies.set('vf_portal', 'company', {
        httpOnly: true, sameSite: 'lax', maxAge: PORTAL_TTL, path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      res.cookies.delete('vf_ctx')
      return res
    }

    // Use admin client to bypass RLS for fresh accounts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // ── VENDOR PORTAL ────────────────────────────────────────────────────────
    if (portalParam === 'vendor' || user.user_metadata?.is_vendor === true) {
      const [{ data: vc }, { data: vu }] = await Promise.all([
        admin.from('vendor_companies').select('id').eq('user_id', user.id).maybeSingle(),
        admin.from('vendor_users').select('id').eq('user_id', user.id).maybeSingle(),
      ])

      const dest = (vc || vu) ? '/vendor/dashboard' : '/vendor/complete-profile'
      const res = NextResponse.redirect(`${origin}${dest}`)
      res.cookies.set('vf_portal', 'vendor', {
        httpOnly: true, sameSite: 'lax', maxAge: PORTAL_TTL, path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      res.cookies.delete('vf_ctx')
      return res
    }

    // ── COMPANY PORTAL ───────────────────────────────────────────────────────
    const { data: userRow } = await admin
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    const companyId = userRow?.company_id
    const role = userRow?.role ?? 'viewer'
    const isAdmin = role === 'administrator' || role === 'admin'

    // Determine destination — default to workspace/setup for safety
    // workspace/setup page itself will redirect to /dashboard if already complete
    let destination = '/workspace/setup'

    if (companyId) {
      if (!isAdmin) {
        // Non-admin employees go straight to dashboard
        destination = '/dashboard'
      } else {
        // Admin — check if setup is complete
        const { data: company } = await admin
          .from('companies')
          .select('setup_complete')
          .eq('id', companyId)
          .maybeSingle()

        if (company?.setup_complete === true) {
          destination = '/dashboard'
        }
        // setup_complete = false or null → stay on /workspace/setup
      }
    }
    // companyId = null → /workspace/setup (company will be created by trigger or setup wizard)

    const res = NextResponse.redirect(`${origin}${destination}`)
    res.cookies.set('vf_portal', 'company', {
      httpOnly: true, sameSite: 'lax', maxAge: PORTAL_TTL, path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    res.cookies.delete('vf_ctx')
    return res

  } catch (err) {
    console.error('[finalize]', err)
    const dest = portalParam === 'vendor' ? '/vendor/login' : '/company/login'
    return NextResponse.redirect(`${origin}${dest}`)
  }
}
