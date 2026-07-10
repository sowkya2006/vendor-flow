'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPasswordForEmail } from '@/lib/supabase/auth'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

type Values = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Values) {
    const { error } = await resetPasswordForEmail(values.email)
    if (error) {
      toast.error(error.message)
      return
    }
    setSubmittedEmail(values.email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-[--color-success-bg] p-3">
            <CheckCircle2 className="size-8 text-[--color-success]" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-[--color-foreground]">Check your inbox</p>
          <p className="text-sm text-[--color-foreground-muted]">
            We sent a reset link to{' '}
            <span className="font-medium text-[--color-foreground]">{submittedEmail}</span>
          </p>
        </div>
        <p className="text-xs text-[--color-foreground-subtle]">
          Didn&apos;t receive it? Check spam or{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-[--color-primary] hover:underline focus-visible:underline outline-none"
          >
            try again
          </button>
        </p>
        <Link
          href="/login"
          className="block text-sm text-[--color-primary] font-medium hover:underline focus-visible:underline outline-none"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="forgot-email"
          className="block text-sm font-medium text-[--color-foreground]"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'forgot-email-error' : undefined}
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p id="forgot-email-error" className="text-xs text-[--color-error]" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <p className="text-center text-sm text-[--color-foreground-muted]">
        Remember your password?{' '}
        <Link
          href="/login"
          className="text-[--color-primary] font-medium hover:underline focus-visible:underline outline-none"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
