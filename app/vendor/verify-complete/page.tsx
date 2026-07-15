'use client'

/**
 * /vendor/verify-complete
 *
 * Supabase redirects here after the vendor clicks the email verification link.
 * The vendor profile was ALREADY saved during registration (before verification).
 *
 * This page:
 * 1. Waits for Supabase to establish the session from the URL hash/code.
 * 2. Checks that the user has a vendor record (vendor_companies OR vendor_users).
 * 3. Redirects directly to /vendor/dashboard — NO login step needed.
 *
 * If no session can be established, falls back to /vendor/login.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'success' | 'error'

export default function VendorVerifyCompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('Verifying your email…')

  useEffect(() => {
    let cancelled = false

    async function complete() {
      try {
        const supabase = createClient()

        // Give Supabase a moment to process the token from the URL fragment
        await new Promise(resolve => setTimeout(resolve, 800))

        // Try getUser first — works if session was established by PKCE code
        let userId: string | null = null
        const { data: { user }, error: userErr } = await supabase.auth.getUser()

        if (!userErr && user) {
          userId = user.id
        } else {
          // Fall back to getSession for hash fragment flow
          const { data: { session } } = await supabase.auth.getSession()
          userId = session?.user?.id ?? null
        }

        if (!userId) {
          if (!cancelled) {
            setStatus('error')
            setMessage('Verification link expired or already used. Please log in.')
            setTimeout(() => router.replace('/vendor/login'), 2500)
          }
          return
        }

        // Confirm vendor record exists — vendor profile was saved pre-verification
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = supabase as any
        const [vcRes, vuRes] = await Promise.all([
          db.from('vendor_companies').select('id').eq('user_id', userId).maybeSingle(),
          db.from('vendor_users').select('id').eq('user_id', userId).maybeSingle(),
        ])

        const hasVendorRecord = !!(vcRes.data || vuRes.data)

        if (!hasVendorRecord) {
          // Profile may not have saved correctly — send to register
          if (!cancelled) {
            setStatus('error')
            setMessage('Your vendor profile could not be found. Please complete registration.')
            setTimeout(() => router.replace('/vendor/register'), 2500)
          }
          return
        }

        // All good — go straight to dashboard, no login required
        if (!cancelled) {
          setStatus('success')
          setMessage('Email verified! Redirecting to your vendor dashboard…')
          setTimeout(() => {
            // Hard redirect so the session cookie is fully propagated
            window.location.href = '/vendor/dashboard'
          }, 1000)
        }

      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage('Something went wrong. Please try signing in.')
          setTimeout(() => router.replace('/vendor/login'), 2500)
        }
      }
    }

    complete()
    return () => { cancelled = true }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background-subtle] px-4">
      <div className="rounded-2xl border border-[--color-border] bg-[--color-card] shadow-lg px-10 py-12 w-full max-w-sm text-center space-y-4">
        {/* Wordmark */}
        <div className="flex justify-center mb-2">
          <span className="text-lg font-bold tracking-tight text-[--color-foreground]">
            VendorFlow
          </span>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[--color-primary] mx-auto" />
            <p className="text-base font-medium text-[--color-foreground]">{message}</p>
            <p className="text-sm text-[--color-foreground-muted]">Please wait…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-base font-semibold text-[--color-foreground]">{message}</p>
            <p className="text-sm text-[--color-foreground-muted]">
              Your account is ready. Taking you to your dashboard now.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-base font-medium text-[--color-foreground]">{message}</p>
            <a
              href="/vendor/login"
              className="inline-block mt-2 rounded-lg bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Go to Vendor Login
            </a>
          </>
        )}
      </div>
    </div>
  )
}
