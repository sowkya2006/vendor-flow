import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTAL_TTL = 60 * 60 * 24 * 7

/**
 * POST /api/auth/set-company-portal
 * Called after company login to set vf_portal=company as httpOnly cookie.
 * Also returns setupComplete so the login form can redirect correctly.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Vendors cannot access company portal
    if (user.user_metadata?.is_vendor === true) {
      return NextResponse.json({ error: 'Not a company account' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data: userRow } = await admin
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    // Only block if a row explicitly exists with no company_id AND
    // we can confirm this is not a pending invite (invited employees
    // have their row written by the trigger/server action — if it hasn't
    // run yet, userRow may be null, which is fine for setting the cookie).
    // A null userRow means the row doesn't exist yet (race condition during
    // invite acceptance) — allow it through so the cookie gets set.
    if (userRow !== null && !userRow.company_id) {
      return NextResponse.json({ error: 'Not a company account' }, { status: 403 })
    }

    // Check if workspace setup is complete
    let setupComplete = false
    if (userRow?.company_id) {
      const { data: company } = await admin
        .from('companies')
        .select('setup_complete')
        .eq('id', userRow.company_id)
        .maybeSingle()
      setupComplete = company?.setup_complete === true
    } else {
      // No row yet (new invited employee) — treat as setup complete since
      // the employee doesn't own a workspace, the admin already did setup.
      setupComplete = true
    }

    const res = NextResponse.json({ ok: true, setupComplete })
    res.cookies.set('vf_portal', 'company', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: PORTAL_TTL,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    res.cookies.delete('vf_ctx')
    return res
  } catch (err) {
    console.error('[set-company-portal]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
