'use client'

/**
 * /auth/magic-callback
 *
 * Handles email link flows that use #access_token hash fragments:
 * - Magic sign-in links (company/vendor signup)
 * - Invite links (employee invitations)
 *
 * CRITICAL: Never sign out BEFORE reading the session.
 * The #access_token in the hash is the new session — sign out after reading it.
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MagicCallbackPage() {
  const [message, setMessage] = useState('Signing you in…')

  useEffect(() => {
    let done = false

    async function run() {
      const supabase = createClient()
      const params   = new URLSearchParams(window.location.search)
      const isVendor    = params.get('vendor') === '1'
      const inviteToken = params.get('invite_token')
      const isInvite    = !!inviteToken

      // Step 1: Let Supabase process the hash and get the NEW session
      // Use onAuthStateChange — it fires when the hash token is exchanged
      let newSession: { userId: string; isVendorUser: boolean } | null = null

      await new Promise<void>(resolve => {
        // Timeout after 8 seconds
        const timeout = setTimeout(() => resolve(), 8000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (done) return
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.id) {
            clearTimeout(timeout)
            newSession = {
              userId: session.user.id,
              isVendorUser: isVendor || session.user.user_metadata?.is_vendor === true,
            }
            subscription.unsubscribe()
            resolve()
          }
        })

        // Also poll as backup
        ;(async () => {
          for (let i = 0; i < 10 && !done; i++) {
            await new Promise(r => setTimeout(r, 700))
            if (newSession) break
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (session?.user?.id) {
                clearTimeout(timeout)
                newSession = {
                  userId: session.user.id,
                  isVendorUser: isVendor || session.user.user_metadata?.is_vendor === true,
                }
                subscription.unsubscribe()
                resolve()
                break
              }
            } catch { /* ignore */ }
          }
        })()
      })

      if (done) return
      done = true

      if (!newSession) {
        // Could not establish session
        setMessage('Link expired or already used. Redirecting…')
        setTimeout(() => {
          if (isInvite) {
            window.location.href = '/company/login?error=invite_expired&hint=Your+invite+link+has+expired.+Ask+your+admin+to+resend.'
          } else if (isVendor) {
            window.location.href = '/vendor/login?hint=use_password'
          } else {
            window.location.href = '/company/login'
          }
        }, 1500)
        return
      }

      const { userId, isVendorUser } = newSession as { userId: string; isVendorUser: boolean }

      // Step 2: Handle based on flow type

      // ── INVITE: employee accepted invite → set password ──────────────────
      if (isInvite) {
        setMessage('Invitation accepted! Please set your password…')
        setTimeout(() => {
          window.location.href = `/reset-password?invited=1&invite_token=${encodeURIComponent(inviteToken!)}`
        }, 400)
        return
      }

      // ── VENDOR ────────────────────────────────────────────────────────────
      if (isVendorUser) {
        try { await fetch('/api/auth/set-vendor-portal', { method: 'POST' }) } catch { /* non-critical */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any
        const [{ data: vc }, { data: vu }] = await Promise.all([
          db.from('vendor_companies').select('id').eq('user_id', userId).maybeSingle(),
          db.from('vendor_users').select('id').eq('user_id', userId).maybeSingle(),
        ])
        setMessage('Signed in! Redirecting…')
        setTimeout(() => {
          window.location.href = (vc || vu) ? '/vendor/dashboard' : '/vendor/complete-profile'
        }, 300)
        return
      }

      // ── COMPANY: go through server finalize to set cookie + check setup ───
      setMessage('Signed in! Redirecting…')
      setTimeout(() => {
        window.location.href = '/api/auth/finalize?portal=company'
      }, 300)
    }

    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle]">
      <div className="rounded-2xl border border-[--color-border] bg-[--color-card] shadow-lg px-10 py-12 w-full max-w-sm text-center space-y-4">
        <div className="text-lg font-bold tracking-tight text-[--color-foreground]">VendorFlow</div>
        <Loader2 className="h-12 w-12 animate-spin text-[--color-primary] mx-auto" />
        <p className="text-base font-medium text-[--color-foreground]">{message}</p>
      </div>
    </div>
  )
}
