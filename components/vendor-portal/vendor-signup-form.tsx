'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { registerVendorBeforeVerificationAction } from '@/app/vendor/actions'

const INDUSTRIES = ['Manufacturing', 'Retail', 'Technology', 'Healthcare', 'Construction', 'Logistics', 'Education', 'Finance', 'Government', 'Other']

const schema = z.object({
  email:        z.string().email('Enter a valid email'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_name: z.string().max(200).optional(),
  phone:        z.string().max(30).optional(),
  website:      z.string().optional(),
  industry:     z.string().optional(),
  gst_number:   z.string().max(50).optional(),
  address:      z.string().max(500).optional(),
  description:  z.string().max(2000).optional(),
})
type Values = z.infer<typeof schema>

export function VendorSignupForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 'verify'>(1)
  const [verifyEmail, setVerifyEmail] = useState('')

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  async function handleStep1() {
    const valid = await trigger(['email', 'password', 'company_name', 'contact_name'])
    if (valid) setStep(2)
  }

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()

        // ── Step 1: Create auth account ──────────────────────────────────
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.contact_name ?? '',
              is_vendor: true,
            },
            emailRedirectTo: `${window.location.origin}/vendor/verify-complete`,
          },
        })
        if (signUpErr) throw signUpErr

        const userId = signUpData.user?.id
        if (!userId) throw new Error('Failed to create account')

        // ── Step 2: Save vendor profile immediately using service role ───
        // This saves ALL data BEFORE email verification.
        // The upsert ensures no duplicates even if called multiple times.
        const { email: _e, password: _p, ...profileData } = values
        await registerVendorBeforeVerificationAction({
          userId,
          ...profileData,
          email: values.email,
        })

        // ── Step 3: Check if email confirmation needed ───────────────────
        if (signUpData.session) {
          // Email confirmation disabled — already signed in
          router.replace('/vendor/dashboard')
          router.refresh()
          return
        }

        // Email confirmation required — show verify screen
        setVerifyEmail(values.email)
        setStep('verify')

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed. Please try again.')
      }
    })
  }

  // ── Email verification waiting screen ─────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-primary]/10">
            <Mail className="h-8 w-8 text-[--color-primary]" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[--color-foreground]">Check your email</h2>
          <p className="mt-1 text-sm text-[--color-foreground-muted]">
            We sent a verification link to{' '}
            <span className="font-medium text-[--color-foreground]">{verifyEmail}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-[--color-foreground] uppercase tracking-wide">What happens next</p>
          <ul className="space-y-1.5 text-sm text-[--color-foreground-muted]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[--color-success] shrink-0" />
              Your company profile has been saved
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[--color-success] shrink-0" />
              Click the link in your email to verify
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[--color-success] shrink-0" />
              You will be redirected to Vendor Login
            </li>
          </ul>
        </div>
        <p className="text-xs text-[--color-foreground-subtle]">
          Didn&apos;t receive it? Check spam or{' '}
          <button
            type="button"
            onClick={() => { setStep(1); setError(null) }}
            className="text-[--color-primary] hover:underline font-medium"
          >
            try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Step 1 — Account basics ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vr-email">Email Address *</Label>
              <Input id="vr-email" type="email" {...register('email')} placeholder="vendor@company.com" />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vr-pw">Password *</Label>
              <div className="relative">
                <Input
                  id="vr-pw"
                  type={showPw ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle]"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vr-company">Company Name *</Label>
              <Input id="vr-company" {...register('company_name')} placeholder="Acme Supplies Ltd." />
              {errors.company_name && <p className="text-xs text-red-600">{errors.company_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vr-contact">Contact Name</Label>
              <Input id="vr-contact" {...register('contact_name')} placeholder="Your full name" />
            </div>
          </div>
          <Button type="button" className="w-full" onClick={handleStep1}>
            Continue →
          </Button>
        </div>
      )}

      {/* ── Step 2 — Company details ────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vr-phone">Phone</Label>
              <Input id="vr-phone" {...register('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vr-gst">GST Number</Label>
              <Input id="vr-gst" {...register('gst_number')} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vr-industry">Industry</Label>
              <select
                id="vr-industry"
                {...register('industry')}
                className="w-full h-9 rounded-lg border border-white/[0.12] bg-[#0f1623] text-[#E5E7EB] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]/50"
              >
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vr-website">Website</Label>
              <Input id="vr-website" {...register('website')} placeholder="https://yourcompany.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vr-address">Address</Label>
            <Input id="vr-address" {...register('address')} placeholder="Registered address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vr-desc">Company Description</Label>
            <Textarea
              id="vr-desc"
              {...register('description')}
              rows={3}
              placeholder="What products or services does your company offer?"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating Account…</>
                : 'Create Vendor Account'
              }
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
