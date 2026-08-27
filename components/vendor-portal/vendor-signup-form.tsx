'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z
  .object({
    email:           z.string().email('Enter a valid email'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    contactName:     z.string().max(200).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type Values = z.infer<typeof schema>

export function VendorSignupForm() {
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw]   = useState(false)
  const [showCp, setShowCp]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/vendor-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:       values.email,
            password:    values.password,
            contactName: values.contactName ?? null,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          if (res.status === 409) {
            setError('This email is already registered. Please sign in at /vendor/login')
          } else {
            setError(data.error ?? 'Registration failed. Please try again.')
          }
          return
        }

        if (data.emailSent) {
          // Email sent via Brevo — show "check your email" screen
          setVerifyEmail(values.email)
          return
        }

        // Brevo not configured (dev/local) — sign in directly and go to complete profile
        if (data.ok) {
          try { await fetch('/api/auth/set-vendor-portal', { method: 'POST' }) } catch { /* non-critical */ }
          window.location.href = '/vendor/complete-profile'
        }

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed. Please try again.')
      }
    })
  }

  // ── Email sent screen ─────────────────────────────────────────────────────
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
            We sent a sign-in link to{' '}
            <span className="font-medium text-[--color-foreground]">{verifyEmail}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-[--color-foreground] uppercase tracking-wide">What happens next</p>
          <ul className="space-y-2 text-sm text-[--color-foreground-muted]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Click the <strong>Sign In &amp; Complete Profile</strong> button in the email
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Fill in your vendor company details
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              You can also sign in at <a href="/vendor/login" className="text-[--color-primary] hover:underline">/vendor/login</a> with your password
            </li>
          </ul>
        </div>
        <p className="text-xs text-[--color-foreground-subtle]">
          Didn&apos;t receive it? Check spam or{' '}
          <button type="button" onClick={() => setVerifyEmail(null)} className="text-[--color-primary] hover:underline font-medium">
            try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="vr-name">Your Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input id="vr-name" type="text" {...register('contactName')} placeholder="Jane Smith" className="pl-10" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vr-email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input id="vr-email" type="email" autoComplete="email" {...register('email')} placeholder="vendor@company.com" className="pl-10" />
        </div>
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vr-pw">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="vr-pw"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            placeholder="Min. 8 characters"
            className="pl-10 pr-10"
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle]">
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vr-confirm">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="vr-confirm"
            type={showCp ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            placeholder="••••••••"
            className="pl-10 pr-10"
          />
          <button type="button" onClick={() => setShowCp(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle]">
            {showCp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
          : 'Create Vendor Account'
        }
      </Button>
    </form>
  )
}
