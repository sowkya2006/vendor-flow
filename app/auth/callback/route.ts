import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const PORTAL_COOKIE = 'vf_portal'
const PORTAL_TTL    = 60 * 60 * 24 * 7 // 7 days

function withPortalCookie(res: NextResponse, portal: 'company' | 'vendor'): NextResponse {
  res.cookies.set(PORTAL_COOKIE, portal, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: PORTAL_TTL,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  res.cookies.delete('vf_ctx')
  return res
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const token_hash  = searchParams.get('token_hash')
  const type        = searchParams.get('type')
  const inviteToken = searchParams.get('invite_token')
  const isVendor    = searchParams.get('vendor') === '1'
  const next        = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // ── PKCE code exchange ───────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return handlePostAuth(supabase, origin, { type, inviteToken, isVendor, next })
    }
    console.error('[callback] PKCE error:', error.message)

    // Check if there's already a valid session (link opened in different tab)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return handlePostAuth(supabase, origin, { type, inviteToken, isVendor, next })
    }

    // Distinguish invite links from signup confirmation links
    // Invite links: type=invite or invite_token present — show password setup page
    // Signup links: show friendly resend page
    const isInviteLink = type === 'invite' || !!inviteToken

    if (isInviteLink) {
      // Invite PKCE mismatch — employee needs to set password via reset flow
      // Send them to reset-password with a hint, OR redirect to company login
      // with a message to use the "forgot password" flow
      return NextResponse.redirect(
        `${origin}/company/login?error=invite_expired&hint=Your+invite+link+has+expired.+Please+ask+your+admin+to+resend+the+invitation.`
      )
    }

    const emailParam = searchParams.get('email') ?? ''
    return NextResponse.redirect(
      `${origin}/verify-email?expired=1${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`
    )
  }

  // ── OTP / token hash flow ───────────────────────────────────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    })
    if (!error) {
      return handlePostAuth(supabase, origin, { type, inviteToken, isVendor, next })
    }
    console.error('[callback] OTP error:', error.message)
    if (type === 'invite') {
      // Invite link expired — show specific message, not generic "confirmation expired"
      return NextResponse.redirect(
        `${origin}/company/login?error=invite_expired&hint=Your+invite+link+has+expired.+Ask+your+admin+to+resend+the+invitation.`
      )
    }
    if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
      const emailParam = searchParams.get('email') ?? ''
      return NextResponse.redirect(`${origin}/verify-email?expired=1${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`)
    }
  }

  // ── Final fallback — check for existing session ─────────────────────────
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (user) {
    return handlePostAuth(supabase, origin, { type: null, inviteToken: null, isVendor, next })
  }

  // No session and no valid code — show helpful page
  const emailParam = searchParams.get('email') ?? ''
  return NextResponse.redirect(`${origin}/verify-email?expired=1${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`)
}

async function handlePostAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  origin: string,
  opts: { type: string | null; inviteToken: string | null; isVendor: boolean; next: string },
): Promise<NextResponse> {
  const { type, inviteToken, isVendor, next } = opts

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/company/login?error=no_session`)

  // ── Employee invitation ──────────────────────────────────────────────────
  if (type === 'invite' || inviteToken) {
    if (inviteToken) await applyInvitation(inviteToken, user, origin)
    else await applyInvitationByEmail(user.email, user, origin)
    const res = NextResponse.redirect(`${origin}/reset-password?invited=1`)
    return withPortalCookie(res, 'company')
  }

  // ── Password recovery ────────────────────────────────────────────────────
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // ── Vendor flow ──────────────────────────────────────────────────────────
  if (isVendor || user.user_metadata?.is_vendor === true) {
    return handleVendorAuth(user.id, origin)
  }

  // ── Company flow ─────────────────────────────────────────────────────────
  return handleCompanyAuth(supabase, user.id, origin, next)
}

async function handleVendorAuth(userId: string, origin: string): Promise<NextResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const [{ data: vc }, { data: vu }] = await Promise.all([
      admin.from('vendor_companies').select('id').eq('user_id', userId).maybeSingle(),
      admin.from('vendor_users').select('id').eq('user_id', userId).maybeSingle(),
    ])
    const dest = (vc || vu) ? '/vendor/dashboard' : '/vendor/complete-profile'
    const res = NextResponse.redirect(`${origin}${dest}`)
    return withPortalCookie(res, 'vendor')
  } catch {
    return NextResponse.redirect(`${origin}/vendor/login`)
  }
}

async function handleCompanyAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  origin: string,
  next: string,
): Promise<NextResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Check if user has a company row
    const { data: userRow } = await admin
      .from('users')
      .select('company_id, role')
      .eq('id', userId)
      .maybeSingle()

    const companyId = userRow?.company_id

    if (companyId) {
      const role = userRow?.role ?? 'viewer'
      const isAdmin = role === 'administrator' || role === 'admin'
      if (isAdmin) {
        const { data: company } = await admin
          .from('companies')
          .select('setup_complete')
          .eq('id', companyId)
          .maybeSingle()
        if (!company?.setup_complete) {
          const res = NextResponse.redirect(`${origin}/workspace/setup`)
          return withPortalCookie(res, 'company')
        }
      }
      const dest = next && next !== '/' && !next.startsWith('/vendor') ? next : '/dashboard'
      const res = NextResponse.redirect(`${origin}${dest}`)
      return withPortalCookie(res, 'company')
    }

    // No company row — new admin, needs workspace setup
    const res = NextResponse.redirect(`${origin}/workspace/setup`)
    return withPortalCookie(res, 'company')

  } catch (err) {
    console.error('[callback] handleCompanyAuth error:', err)
    return NextResponse.redirect(`${origin}/workspace/setup`)
  }
}

async function applyInvitation(
  token: string,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  _origin: string,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data: inv } = await admin
      .from('employee_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .maybeSingle()
    if (inv) await linkUserToInvitation(admin, user, inv)
  } catch (e) { console.error('[callback] applyInvitation:', e) }
}

async function applyInvitationByEmail(
  email: string | null | undefined,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  _origin: string,
) {
  if (!email) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data: inv } = await admin
      .from('employee_invitations')
      .select('*')
      .eq('email', email)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (inv) await linkUserToInvitation(admin, user, inv)
  } catch (e) { console.error('[callback] applyInvitationByEmail:', e) }
}

async function linkUserToInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  inv: { id: string; company_id: string; role_slug: string; department: string | null; designation: string | null; full_name: string | null },
) {
  const { error } = await admin.from('users').upsert({
    id:          user.id,
    company_id:  inv.company_id,
    role:        inv.role_slug,
    department:  inv.department ?? null,
    designation: inv.designation ?? null,
    full_name:   inv.full_name ?? (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? null,
    email:       user.email,
    status:      'active',
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) { console.error('[callback] linkUserToInvitation:', error); return }

  await admin.from('employee_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', inv.id)

  console.log(`[callback] Linked ${user.email} → ${inv.company_id} as ${inv.role_slug}`)
}
