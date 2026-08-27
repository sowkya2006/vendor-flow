'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Values = z.infer<typeof schema>

export function SignupForm() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showCp, setShowCp] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Values) {
    try {
      const res = await fetch('/api/auth/company-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error('This email is already registered. Please sign in.')
        } else {
          toast.error(data.error ?? 'Failed to create account')
        }
        return
      }

      if (data.emailSent) {
        // Email sent via Brevo — show verify screen
        setVerifyEmail(values.email)
        return
      }

      // Brevo not configured — auto-confirm via confirmation URL for local testing
      if (data.confirmationUrl) {
        try {
          await fetch(data.confirmationUrl, { method: 'GET', redirect: 'manual' })
        } catch { /* expected redirect */ }
        const supabase = createClient()
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
        if (!signInErr) {
          toast.success('Account confirmed! Setting up your workspace…')
          window.location.href = '/workspace/setup'
          return
        }
      }

      // Fallback
      setVerifyEmail(values.email)
    } catch (err) {
      console.error('[SignupForm] error:', err)
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // ── Email sent screen ──────────────────────────────────────────────────────
  if (verifyEmail) {
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
            We sent a verification link to{' '}
            <span className="font-medium text-[--color-foreground]">{verifyEmail}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-[--color-foreground] uppercase tracking-wide">What happens next</p>
          <ul className="space-y-2 text-sm text-[--color-foreground-muted]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Click the confirmation link in your email
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              You'll be redirected to set up your company profile
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Complete your workspace and start managing vendors
            </li>
          </ul>
        </div>
        <p className="text-xs text-[--color-foreground-subtle]">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setVerifyEmail(null)}
            className="text-[--color-primary] hover:underline font-medium"
          >
            try again
          </button>
        </p>
      </div>
    )
  }

  // ── Signup form ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Full Name */}
      <div className="space-y-1.5">
        <label htmlFor="signup-name" className="block text-sm font-medium text-[--color-foreground]">
          Full name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            aria-invalid={!!errors.fullName}
            className="pl-10"
            {...register('fullName')}
          />
        </div>
        {errors.fullName && <p className="text-xs text-[--color-error]">{errors.fullName.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="block text-sm font-medium text-[--color-foreground]">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-xs text-[--color-error]">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="block text-sm font-medium text-[--color-foreground]">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="signup-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            aria-invalid={!!errors.password}
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide' : 'Show'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted]">
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-[--color-error]">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="signup-confirm" className="block text-sm font-medium text-[--color-foreground]">
          Confirm password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="signup-confirm"
            type={showCp ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            className="pl-10 pr-10"
            {...register('confirmPassword')}
          />
          <button type="button" onClick={() => setShowCp(v => !v)} aria-label={showCp ? 'Hide' : 'Show'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted]">
            {showCp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-[--color-error]">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><Loader2 className="size-4 animate-spin" />Sending verification email…</> : 'Create account'}
      </Button>

      <p className="text-center text-sm text-[--color-foreground-muted]">
        Already have an account?{' '}
        <Link href="/login" className="text-[--color-primary] font-medium hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
