import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/auth/check-vendor-profile
 * Returns whether the authenticated vendor has completed their company profile.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ hasProfile: false }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const [{ data: vc }, { data: vu }] = await Promise.all([
      admin.from('vendor_companies').select('id').eq('user_id', user.id).maybeSingle(),
      admin.from('vendor_users').select('id').eq('user_id', user.id).maybeSingle(),
    ])

    return NextResponse.json({ hasProfile: !!(vc || vu) })
  } catch {
    return NextResponse.json({ hasProfile: false })
  }
}
