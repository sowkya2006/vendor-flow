'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * applyInvitationServerAction
 *
 * Called from /auth/confirm after the Supabase invite email link is clicked.
 * Uses the admin client (service role) to bypass RLS when writing the
 * employee's company_id + role to public.users.
 */
export async function applyInvitationServerAction(): Promise<{
  ok: boolean
  role?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user?.email) {
      return { ok: false, error: 'Not authenticated' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any

    // Find pending invitation by email
    const { data: invitation, error: invErr } = await adminDb
      .from('employee_invitations')
      .select('id, company_id, role_slug, department, designation, full_name, token')
      .eq('email', user.email)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (invErr) {
      console.error('[applyInvitation] query error:', invErr)
      return { ok: false, error: 'Could not find invitation' }
    }

    if (!invitation) {
      // No pending invite — check if already linked
      const { data: existingUser } = await adminDb
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUser?.company_id) {
        return { ok: true, role: existingUser.role }
      }

      return { ok: false, error: 'No pending invitation found for this email' }
    }

    // Upsert the user row — links them to the company with their role
    const { error: upsertErr } = await adminDb
      .from('users')
      .upsert({
        id:          user.id,
        company_id:  invitation.company_id,
        role:        invitation.role_slug,
        department:  invitation.department ?? null,
        designation: invitation.designation ?? null,
        full_name:   invitation.full_name
                      ?? (user.user_metadata?.full_name as string | undefined)
                      ?? user.email.split('@')[0],
        email:       user.email,
        status:      'active',
        portal_type: 'company',
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'id' })

    if (upsertErr) {
      console.error('[applyInvitation] upsert error:', upsertErr)
      return { ok: false, error: 'Failed to link account: ' + upsertErr.message }
    }

    // Mark invitation accepted
    await adminDb
      .from('employee_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    console.log(`[applyInvitation] Linked ${user.email} → company ${invitation.company_id} as ${invitation.role_slug}`)
    return { ok: true, role: invitation.role_slug }

  } catch (err) {
    console.error('[applyInvitation] unexpected error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * completeInvitationAction
 *
 * Called from AcceptInviteForm (/invite/[token] page) after the employee
 * signs up with email + password.
 * Finds the invitation by token, links the user to company + role,
 * and marks it accepted.
 */
export async function completeInvitationAction(token: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Not authenticated')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any

  // Look up invitation by token (not by email — they may have different email cases)
  const { data: invitation, error: invErr } = await adminDb
    .from('employee_invitations')
    .select('id, company_id, role_slug, department, designation, full_name, email')
    .eq('token', token)
    .is('accepted_at', null)
    .limit(1)
    .maybeSingle()

  if (invErr) throw new Error('Could not find invitation: ' + invErr.message)
  if (!invitation) throw new Error('Invitation not found or already accepted')

  // Upsert user row — links them to the company
  const { error: upsertErr } = await adminDb
    .from('users')
    .upsert({
      id:          user.id,
      company_id:  invitation.company_id,
      role:        invitation.role_slug,
      department:  invitation.department ?? null,
      designation: invitation.designation ?? null,
      full_name:   invitation.full_name
                    ?? (user.user_metadata?.full_name as string | undefined)
                    ?? invitation.email.split('@')[0],
      email:       user.email ?? invitation.email,
      status:      'active',
      portal_type: 'company',
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'id' })

  if (upsertErr) throw new Error('Failed to link account: ' + upsertErr.message)

  // Mark invitation accepted
  await adminDb
    .from('employee_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  console.log(`[completeInvitation] Linked ${user.email} → company ${invitation.company_id} as ${invitation.role_slug}`)
}
