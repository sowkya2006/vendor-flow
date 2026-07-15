import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Portal cookie — must match proxy.ts constants exactly
const PORTAL_COOKIE = 'vf_portal'
const PORTAL_TTL    = 60 * 60 * 24 * 7  // 7 days

function withPortalCookie(res: NextResponse, portal: 'company' | 'vendor'): NextResponse {
  res.cookies.set(PORTAL_COOKIE, portal, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   PORTAL_TTL,
    path:     '/',
  })
  // Always nuke the old stale cache cookie
  res.cookies.delete('vf_ctx')
  return res
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const inviteToken = searchParams.get('invite_token')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // ── PKCE code flow (Supabase invite + standard OAuth) ───────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this was an invite, apply the invitation and redirect to set password
      if (type === 'invite' || inviteToken) {
        // Apply the invitation in the background
        if (inviteToken) {
          await applyInvitation(supabase, inviteToken)
        } else {
          // Try to apply by email if no token in URL
          await applyInvitationByEmail(supabase)
        }
        // Always send invited users to set their password first
        return NextResponse.redirect(`${origin}/reset-password?invited=1`)
      }
      return await redirectAfterAuth(supabase, origin, next)
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // ── Token hash flow (email OTP / magic link via email) ──────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'email' | 'recovery' | 'invite' | 'signup' | 'magiclink' | 'sms' | 'phone_change' | 'email_change' })

    if (!error) {
      if (type === 'invite') {
        if (inviteToken) await applyInvitation(supabase, inviteToken)
        else await applyInvitationByEmail(supabase)
        return NextResponse.redirect(`${origin}/reset-password?invited=1`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return await redirectAfterAuth(supabase, origin, next)
    }

    console.error('[auth/callback] verifyOtp error:', error.message)
    // Specific error pages for expired links
    if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
      return NextResponse.redirect(`${origin}/invite/expired`)
    }
  }

  // ── Fallback — redirect to login with error ─────────────────────────────
  return NextResponse.redirect(`${origin}/company/login?error=auth_callback_failed`)
}

/** Apply invitation from a specific token */
async function applyInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  inviteToken: string,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: invitation } = await supabase
      .from('employee_invitations')
      .select('*')
      .eq('token', inviteToken)
      .is('accepted_at', null)
      .limit(1)
      .maybeSingle()

    if (!invitation) return
    await linkUserToInvitation(supabase, user, invitation)
  } catch (e) {
    console.error('[auth/callback] applyInvitation error:', e)
  }
}

/** Apply invitation by looking up the user's email */
async function applyInvitationByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    const { data: invitation } = await supabase
      .from('employee_invitations')
      .select('*')
      .eq('email', user.email)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!invitation) return
    await linkUserToInvitation(supabase, user, invitation)
  } catch (e) {
    console.error('[auth/callback] applyInvitationByEmail error:', e)
  }
}

/** Link authenticated user to their invitation record */
async function linkUserToInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  invitation: {
    id: string; company_id: string; role_slug: string
    department: string | null; designation: string | null; full_name: string | null
    token: string
  },
) {
  const { data: existingRow } = await supabase
    .from('users').select('id').eq('id', user.id).maybeSingle()

  const userData = {
    company_id: invitation.company_id,
    role: invitation.role_slug,
    department: invitation.department,
    designation: invitation.designation,
    full_name: invitation.full_name ?? (user.user_metadata?.full_name as string) ?? null,
    email: user.email,
    status: 'active',
    updated_at: new Date().toISOString(),
  }

  if (existingRow) {
    await supabase.from('users').update(userData).eq('id', user.id)
  } else {
    await supabase.from('users').insert({ id: user.id, ...userData })
  }

  await supabase
    .from('employee_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)
}

async function redirectAfterAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  origin: string,
  next: string,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${origin}/company/login?error=no_session`)
    }

    // ── PRIORITY 1: Company portal check ─────────────────────────────────────
    // Users table with company_id is the authoritative signal.
    // If found → company user, full stop, never check vendor tables.
    const { data: userRow } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    const companyId = (userRow as { company_id: string | null } | null)?.company_id

    if (companyId) {
      // Get user role to determine if workspace setup is needed
      const { data: fullUserRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      const role = (fullUserRow as { role: string } | null)?.role ?? 'viewer'
      const isAdmin = role === 'administrator' || role === 'admin'

      // Only administrators need to complete workspace setup.
      // Employees go straight to their dashboard.
      if (isAdmin) {
        const { data: company } = await supabase
          .from('companies')
          .select('setup_complete')
          .eq('id', companyId)
          .maybeSingle()

        if (!(company as { setup_complete: boolean } | null)?.setup_complete) {
          const res = NextResponse.redirect(`${origin}/workspace/setup`)
          return withPortalCookie(res, 'company')
        }
      }

      const dest = next && next !== '/' ? next : '/dashboard'
      const res = NextResponse.redirect(`${origin}${dest}`)
      return withPortalCookie(res, 'company')
    }

    // ── PRIORITY 2: Vendor portal check ──────────────────────────────────────
    const { data: vendorCompany } = await supabase
      .from('vendor_companies')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (vendorCompany) {
      const res = NextResponse.redirect(`${origin}/vendor/dashboard`)
      return withPortalCookie(res, 'vendor')
    }

    const { data: vendorUser } = await supabase
      .from('vendor_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (vendorUser) {
      const res = NextResponse.redirect(`${origin}/vendor/dashboard`)
      return withPortalCookie(res, 'vendor')
    }

    // ── PRIORITY 3: New user — send to workspace setup ────────────────────────
    const res = NextResponse.redirect(`${origin}/workspace/setup`)
    return withPortalCookie(res, 'company')

  } catch (err) {
    console.error('[auth/callback] redirectAfterAuth error:', err)
  }

  return NextResponse.redirect(`${origin}/company/login`)
}
