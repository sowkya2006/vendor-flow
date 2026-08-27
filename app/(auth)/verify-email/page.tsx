'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''
  const isExpired = searchParams.get('expired') === '1'

  const [email, setEmail] = useState(emailFromUrl)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function resend() {
    const target = email.trim()
    if (!target) { setStatus('error'); setMessage('Please enter your email address.'); return }
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      })
      const data = await res.json()
      if (res.ok) {
        // If Brevo not configured, auto-confirm via returned URL
        if (data.confirmationUrl) {
          try { await fetch(data.confirmationUrl, { method: 'GET', redirect: 'manual' }) } catch { /* redirect */ }
          window.location.href = '/auth/callback'
          return
        }
        setStatus('sent')
        setMessage(`A new confirmation link has been sent to ${target}. Check your inbox.`)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Failed to resend. Please try signing up again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (!isExpired) {
    // Normal "check your email" screen
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-primary]/10">
            <Mail className="h-8 w-8 text-[--color-primary]" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[--color-foreground]">Check your email</h2>
          <p className="mt-2 text-sm text-[--color-foreground-muted]">
            We sent a confirmation link to{' '}
            <span className="font-medium text-[--color-foreground]">{email || 'your email address'}</span>.
            Click the link to continue.
          </p>
        </div>
        <p className="text-xs text-[--color-foreground-subtle]">
          Didn&apos;t receive it? Check spam or{' '}
          <a href="/signup" className="text-[--color-primary] hover:underline font-medium">try again</a>
        </p>
      </div>
    )
  }

  // Expired link screen — always show resend option
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[--color-foreground]">Confirmation link expired</h2>
        <p className="mt-2 text-sm text-[--color-foreground-muted]">
          Your confirmation link has expired. Links are valid for 24 hours.
          Enter your email below to get a new one.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
          </div>
          <p className="text-center text-xs text-[--color-foreground-subtle]">
            Still not received?{' '}
            <button onClick={() => setStatus('idle')} className="text-[--color-primary] hover:underline font-medium">
              Send again
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[--color-foreground]">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === 'sending'}
            />
          </div>

          {status === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
            </div>
          )}

          <Button onClick={resend} disabled={status === 'sending'} className="w-full">
            {status === 'sending'
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending new link…</>
              : 'Send new confirmation link'
            }
          </Button>

          <p className="text-center text-xs text-[--color-foreground-subtle]">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-[--color-primary] hover:underline font-medium">Sign up</a>
            {' '}·{' '}
            <a href="/vendor/register" className="text-[--color-primary] hover:underline font-medium">Register as vendor</a>
          </p>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-[--color-foreground-muted]">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
