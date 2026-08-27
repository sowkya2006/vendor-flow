import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTAL_TTL = 60 * 60 * 24 * 7 // 7 days

/**
 * GET /api/auth/check-vendor
 *
 * Called by the vendor login form after signInWithPassword succeeds.
 * Uses admin client to bypass RLS and check if the user has a vendor record.
 * Returns the portal type and sets the vf_portal cookie if vendor.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ portal: null, error: 'Not authenticated' }, { status: 401 })
    }

    // PRIORITY 1: Check user_metadata.is_vendor — set during vendor signup
    // This is the most reliable signal because it's set at account creation time
    if (user.user_metadata?.is_vendor === true) {
      const res = NextResponse.json({ portal: 'vendor' })
      res.cookies.set('vf_portal', 'vendor', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: PORTAL_TTL,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      res.cookies.delete('vf_ctx')
      return res
    }

    // PRIORITY 2: Check vendor tables via admin client (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any

    const [{ data: vc }, { data: vu }] = await Promise.all([
      adminDb.from('vendor_companies').select('id').eq('user_id', user.id).maybeSingle(),
      adminDb.from('vendor_users').select('id').eq('user_id', user.id).maybeSingle(),
    ])

    if (vc || vu) {
      const res = NextResponse.json({ portal: 'vendor' })
      res.cookies.set('vf_portal', 'vendor', {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: PORTAL_TTL,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
      res.cookies.delete('vf_ctx')
      return res
    }

    // PRIORITY 3: Check if company user
    const { data: companyRow } = await adminDb
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (companyRow?.company_id) {
      return NextResponse.json({ portal: 'company' })
    }

    return NextResponse.json({ portal: null })
  } catch (err) {
    console.error('[check-vendor]', err)
    return NextResponse.json({ portal: null, error: 'Internal error' }, { status: 500 })
  }
}
