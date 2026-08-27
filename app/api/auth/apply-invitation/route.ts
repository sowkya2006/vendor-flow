import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/apply-invitation?token=xxx
 *
 * Called after an invited employee sets their password.
 * Links the authenticated user to their company using the invite token.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing invite token' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Find the invitation
    const { data: inv } = await admin
      .from('employee_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle()

    if (!inv) {
      // Already accepted or not found — check if user is already linked
      const { data: existingUser } = await admin
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUser?.company_id) {
        // Already linked — this is fine
        return NextResponse.json({ ok: true, alreadyLinked: true })
      }
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 })
    }

    // Link user to company
    const { error: upsertError } = await admin.from('users').upsert({
      id:          user.id,
      company_id:  inv.company_id,
      role:        inv.role_slug,
      full_name:   inv.full_name ?? (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? null,
      email:       user.email,
      department:  inv.department ?? null,
      designation: inv.designation ?? null,
      status:      'active',
      portal_type: 'company',
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertError) {
      console.error('[apply-invitation] upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // Mark invitation as accepted
    await admin
      .from('employee_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', inv.id)

    console.log(`[apply-invitation] Linked ${user.email} → company ${inv.company_id} as ${inv.role_slug}`)
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[apply-invitation]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
