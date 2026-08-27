'use client'

/**
 * /vendor/verify-complete
 *
 * Supabase redirects here after the vendor clicks the email sign-in link.
 * 
 * The account is ALREADY CONFIRMED server-side (email_confirm: true set at registration).
 * This page just needs to establish the session from the URL hash token and redirect.
 *
 * If the hash token fails (already used, timing issue), the user can sign in with password.
 */
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VendorVerifyCompletePage() {
  const [message, setMessage] = useState('Signing you in…')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function complete() {
      const supabase = createClient()

      // Try to get session from the URL hash token
      // Supabase JS client automatically processes the #access_token hash
      let userId: string | null = null

      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 600))
        try {
          // getSession reads the hash fragment and returns the session
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.id) { userId = session.user.id; break }
          // getUser fallback
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.id) { userId = user.id; break }
        } catch { /* retry */ }
      }

      if (cancelled) return

      if (userId) {
        // Session established — set portal cookie and check vendor status
        try { await fetch('/api/auth/set-vendor-portal', { method: 'POST' }) } catch { /* non-critical */ }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any
        const [{ data: vc }, { data: vu }] = await Promise.all([
          db.from('vendor_companies').select('id').eq('user_id', userId).maybeSingle(),
          db.from('vendor_users').select('id').eq('user_id', userId).maybeSingle(),
        ])

        setDone(true)
        if (vc || vu) {
          setMessage('Signed in! Redirecting to your dashboard…')
          setTimeout(() => { window.location.href = '/vendor/dashboard' }, 800)
        } else {
          setMessage('Email verified! Setting up your vendor profile…')
          setTimeout(() => { window.location.href = '/vendor/complete-profile' }, 800)
        }
      } else {
        // Could not establish session from hash token
        // Account is confirmed — just send to login with password
        setMessage('Your account is confirmed. Please sign in with your password.')
        setTimeout(() => { window.location.href = '/vendor/login?hint=use_password' }, 1500)
      }
    }

    complete()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle] px-4">
      <div className="rounded-2xl border border-[--color-border] bg-[--color-card] shadow-lg px-10 py-12 w-full max-w-sm text-center space-y-4">
        <div className="flex justify-center mb-2">
          <span className="text-lg font-bold tracking-tight text-[--color-foreground]">VendorFlow</span>
        </div>
        {done ? (
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-[--color-primary] mx-auto" />
        )}
        <p className="text-base font-medium text-[--color-foreground]">{message}</p>
      </div>
    </div>
  )
}
