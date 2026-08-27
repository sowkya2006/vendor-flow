import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/accept-invite
 *
 * Handles employee invitation acceptance:
 * 1. Validates the invite token
 * 2. Creates the auth user with email pre-confirmed (no email verification needed)
 * 3. Links the user to their company with the correct role
 * 4. Marks the invitation as accepted
 *
 * Uses admin client throughout — employee has no session yet.
 */
export async function POST(req: Request) {
  try {
    const { token, email, password, fullName } = await req.json()

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Step 1: Validate invitation
    const { data: invitation, error: invErr } = await admin
      .from('employee_invitations')
      .select('id, company_id, role_slug, department, designation, full_name, email')
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle()

    if (invErr || !invitation) {
      return NextResponse.json({ error: 'Invitation not found or already accepted' }, { status: 404 })
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 400 })
    }

    // Step 2: Check if user already exists
    const { data: listData } = await admin.auth.admin.listUsers()
    const existingUser = (listData?.users ?? []).find(
      (u: { email: string }) => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      // User exists — update their password and confirm email
      const { error: updateErr } = await admin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || invitation.full_name || email.split('@')[0],
        },
      })
      if (updateErr) {
        return NextResponse.json({ error: 'Failed to update account: ' + updateErr.message }, { status: 500 })
      }
      userId = existingUser.id
    } else {
      // Create new user with email pre-confirmed
      const { data: authData, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // no email verification needed for invites
        user_metadata: {
          full_name: fullName || invitation.full_name || email.split('@')[0],
        },
      })
      if (createErr) {
        return NextResponse.json({ error: 'Failed to create account: ' + createErr.message }, { status: 500 })
      }
      userId = authData.user.id
    }

    // Step 3: Link user to company with correct role
    const { error: upsertErr } = await admin.from('users').upsert({
      id:          userId,
      company_id:  invitation.company_id,
      role:        invitation.role_slug,
      department:  invitation.department ?? null,
      designation: invitation.designation ?? null,
      full_name:   fullName || invitation.full_name || email.split('@')[0],
      email,
      status:      'active',
      portal_type: 'company',
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertErr) {
      return NextResponse.json({ error: 'Failed to link account: ' + upsertErr.message }, { status: 500 })
    }

    // Step 4: Mark invitation accepted
    await admin
      .from('employee_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    console.log(`[accept-invite] Linked ${email} → company ${invitation.company_id} as ${invitation.role_slug}`)
    return NextResponse.json({ ok: true })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[accept-invite]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
