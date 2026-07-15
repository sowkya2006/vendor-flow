'use client'

/**
 * /auth/confirm
 *
 * Handles ALL Supabase email-link flows:
 *
 *   type=invite   → Employee accepted invite
 *                   1. Exchange tokens → session
 *                   2. Call applyInvitationServerAction (admin client, bypasses RLS)
 *                      → writes company_id + role to public.users
 *                   3. Redirect to /reset-password?invited=1 (set password)
 *                   4. After password set → /dashboard (their role dashboard)
 *                      Middleware allows because role ≠ administrator,
 *                      so workspace-setup check is SKIPPED.
 *
 *   type=recovery → Password reset link clicked
 *                   Redirect to /reset-password
 *
 *   type=signup   → Email confirmation after sign-up
 *                   Redirect to company dashboard or vendor dashboard
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { applyInvitationServerAction } from '@/app/invite/actions'

type Status = 'loading' | 'success' | 'error' | 'expired'

// Helper — set portal cookie client-side
function setPortalCookie(portal: 'company' | 'vendor') {
  document.cookie = `vf_portal=${portal}; path=/; max-age=604800; SameSite=Lax`
  document.cookie = `vf_ctx=; path=/; max-age=0`
}

export default function AuthConfirmPage() {
  const router = useRouter()
  const [status,  setStatus]  = useState<Status>('loading')
  const [message, setMessage] = useState('Processing…')

  useEffect(() => {
    let cancelled = false

    async function handle() {
      try {
        // ── 1. Parse URL ─────────────────────────────────────────────────
        const hash     = window.location.hash.replace('#', '')
        const fragment = new URLSearchParams(hash)
        const query    = new URLSearchParams(window.location.search)

        const accessToken  = fragment.get('access_token')
        const refreshToken = fragment.get('refresh_token')
        const typeFragment = fragment.get('type')
        const errorCode    = fragment.get('error_code')
        const errorDesc    = fragment.get('error_description')
        const codeQuery    = query.get('code')

        // ── 2. Handle error fragment (expired / invalid link) ────────────
        if (errorCode || errorDesc) {
          if (!cancelled) {
            setStatus('expired')
            setMessage(errorDesc ?? 'This link has expired or is invalid.')
          }
          return
        }

        const supabase = createClient()

        // ── 3a. PKCE flow — code in query string ─────────────────────────
        if (codeQuery) {
          const { error } = await supabase.auth.exchangeCodeForSession(codeQuery)
          if (error) {
            if (!cancelled) { setStatus('expired'); setMessage(error.message) }
            return
          }
          // After PKCE exchange, apply invite via server action
          const result = await applyInvitationServerAction()
          if (!cancelled) {
            if (result.ok) {
              setStatus('success')
              setMessage('Invitation accepted! Please set your password.')
              setPortalCookie('company')
              setTimeout(() => router.replace('/reset-password?invited=1'), 600)
            } else {
              // If no invite found, just go to password reset (recovery flow)
              setStatus('success')
              setMessage('Redirecting…')
              setPortalCookie('company')
              setTimeout(() => router.replace('/reset-password?invited=1'), 600)
            }
          }
          return
        }

        // ── 3b. Implicit flow — tokens in hash fragment ──────────────────
        if (!accessToken || !refreshToken) {
          if (!cancelled) {
            setStatus('expired')
            setMessage('Invalid link — no authentication tokens found.')
          }
          return
        }

        const { data: sessionData, error: sessionErr } =
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })

        if (sessionErr || !sessionData.user) {
          if (!cancelled) {
            setStatus('expired')
            setMessage(sessionErr?.message ?? 'Failed to authenticate. Please request a new invite.')
          }
          return
        }

        const user = sessionData.user
        const type = typeFragment

        // ── 4. Invite flow (type=invite) ─────────────────────────────────
        if (type === 'invite') {
          if (!cancelled) setMessage('Applying your invitation…')

          // Use server action with admin client — bypasses RLS entirely
          const result = await applyInvitationServerAction()

          if (!cancelled) {
            if (!result.ok) {
              console.warn('[auth/confirm] applyInvitation returned:', result.error)
              // Even if apply failed (e.g. already applied), continue to password reset
            }
            setStatus('success')
            setMessage('Invitation accepted! Please set your password.')
            setPortalCookie('company')
            setTimeout(() => router.replace('/reset-password?invited=1'), 600)
          }
          return
        }

        // ── 5. Password recovery (type=recovery) ─────────────────────────
        if (type === 'recovery') {
          if (!cancelled) {
            setStatus('success')
            setMessage('Redirecting to password reset…')
            setPortalCookie('company')
            setTimeout(() => router.replace('/reset-password'), 600)
          }
          return
        }

        // ── 6. Signup email confirmation (type=signup or no type) ─────────
        if (!cancelled) {
          setStatus('success')
          setMessage('Email confirmed! Redirecting…')

          // Check portal via server action
          const result = await applyInvitationServerAction()

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: userRow } = await (supabase as any)
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .maybeSingle()

          const companyId = (userRow as { company_id: string | null } | null)?.company_id

          if (companyId) {
            setPortalCookie('company')
            setTimeout(() => router.replace('/dashboard'), 600)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: vc } = await (supabase as any)
              .from('vendor_companies')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()
            if (vc) {
              setPortalCookie('vendor')
              setTimeout(() => router.replace('/vendor/dashboard'), 600)
            } else {
              // New admin account — needs workspace setup
              setPortalCookie('company')
              setTimeout(() => router.replace('/workspace/setup'), 600)
            }
          }
        }

      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
        }
      }
    }

    handle()
    return () => { cancelled = true }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle] px-4">
      <div className="rounded-2xl border border-[--color-border] bg-[--color-card] shadow-lg px-10 py-12 w-full max-w-sm text-center space-y-5">

        <div className="text-lg font-bold tracking-tight text-[--color-foreground]">VendorFlow</div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[--color-primary] mx-auto" />
            <div>
              <p className="text-base font-semibold text-[--color-foreground]">{message}</p>
              <p className="text-xs text-[--color-foreground-muted] mt-1">Please wait…</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-base font-semibold text-[--color-foreground]">{message}</p>
          </>
        )}

        {(status === 'expired' || status === 'error') && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-[--color-foreground]">
                {status === 'expired' ? 'Invitation Link Expired' : 'Something went wrong'}
              </p>
              <p className="text-sm text-[--color-foreground-muted] mt-1">{message}</p>
            </div>

            {status === 'expired' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-2 mb-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  What to do next
                </p>
                <p className="text-xs text-amber-700">
                  Ask your Administrator to resend the invite from{' '}
                  <strong>Settings → Employees → Invite Employee</strong>.
                  Invite links expire after <strong>24 hours</strong>.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button asChild size="sm">
                <Link href="/company/login">Go to Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
