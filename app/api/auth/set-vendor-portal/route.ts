import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTAL_TTL = 60 * 60 * 24 * 7 // 7 days

/**
 * POST /api/auth/set-vendor-portal
 *
 * Called by /vendor/verify-complete after email confirmation.
 * Verifies the user has a vendor_companies or vendor_users record,
 * then sets the vf_portal=vendor cookie (httpOnly) on the response.
 *
 * This is needed because JS cannot set httpOnly cookies — the cookie
 * must be set by a server response so the middleware fast-path works.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify this is actually a vendor user using admin client (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any

    const [{ data: vc }, { data: vu }] = await Promise.all([
      adminDb.from('vendor_companies').select('id').eq('user_id', user.id).maybeSingle(),
      adminDb.from('vendor_users').select('id').eq('user_id', user.id).maybeSingle(),
    ])

    if (!vc && !vu) {
      return NextResponse.json({ error: 'No vendor record found' }, { status: 403 })
    }

    // Set the portal cookie as httpOnly
    const res = NextResponse.json({ ok: true })
    res.cookies.set('vf_portal', 'vendor', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: PORTAL_TTL,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    res.cookies.delete('vf_ctx')
    return res

  } catch (err) {
    console.error('[set-vendor-portal]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
