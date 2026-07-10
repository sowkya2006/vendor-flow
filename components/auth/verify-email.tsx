'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { resendVerificationEmail } from '@/lib/supabase/auth'

export function VerifyEmail() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleResend() {
    if (!email) return
    setResending(true)
    const { error } = await resendVerificationEmail(email)
    setResending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setResent(true)
    toast.success('Verification email sent')
  }

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-[--color-primary]/10 p-4">
          <Mail className="size-10 text-[--color-primary]" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[--color-foreground]">Check your email</h2>
        <p className="text-sm text-[--color-foreground-muted]">
          We sent a verification link to{' '}
          {email ? (
            <span className="font-medium text-[--color-foreground]">{email}</span>
          ) : (
            'your email address'
          )}
        </p>
        <p className="text-sm text-[--color-foreground-muted]">
          Click the link in the email to activate your account.
        </p>
      </div>

      {email && (
        <div className="space-y-2">
          <p className="text-xs text-[--color-foreground-subtle]">Didn&apos;t receive it?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resending || resent}
            onClick={handleResend}
            className="gap-1.5"
          >
            {resending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Sending…
              </>
            ) : resent ? (
              'Email sent!'
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Resend verification email
              </>
            )}
          </Button>
        </div>
      )}

      <Link
        href="/login"
        className="block text-sm text-[--color-primary] font-medium hover:underline focus-visible:underline outline-none"
      >
        Back to sign in
      </Link>
    </div>
  )
}
