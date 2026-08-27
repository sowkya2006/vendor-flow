'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { registerVendorBeforeVerificationAction } from '@/app/vendor/actions'

const INDUSTRIES = [
  'Manufacturing', 'Retail', 'Technology', 'Healthcare',
  'Construction', 'Logistics', 'Education', 'Finance',
  'Government', 'Other',
]

const schema = z.object({
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

interface Props {
  userEmail: string
  userId: string
}

export function VendorCompleteProfileForm({ userEmail, userId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        await registerVendorBeforeVerificationAction({
          userId,
          email: userEmail,
          ...values,
        })
        // Profile saved — set portal cookie and go to dashboard
        try { await fetch('/api/auth/set-vendor-portal', { method: 'POST' }) } catch { /* non-critical */ }
        window.location.href = '/vendor/dashboard'
      } catch (e) {
        const msg = e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null
            ? JSON.stringify(e)
            : 'Failed to save profile. Please try again.'
        setError(msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Email (read-only — already verified) */}
      <div className="space-y-1.5">
        <Label>Email Address (Verified)</Label>
        <Input value={userEmail} readOnly className="bg-[--color-background-subtle] cursor-not-allowed opacity-70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cp-company">Company Name *</Label>
          <Input id="cp-company" {...register('company_name')} placeholder="Acme Supplies Ltd." />
          {errors.company_name && <p className="text-xs text-red-600">{errors.company_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-contact">Your Full Name</Label>
          <Input id="cp-contact" {...register('contact_name')} placeholder="Jane Smith" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cp-phone">Phone</Label>
          <Input id="cp-phone" {...register('phone')} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-gst">GST Number</Label>
          <Input id="cp-gst" {...register('gst_number')} placeholder="22AAAAA0000A1Z5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cp-industry">Industry</Label>
          <select
            id="cp-industry"
            {...register('industry')}
            className="w-full h-9 rounded-lg border border-white/[0.12] bg-[#0f1623] text-[#E5E7EB] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]/50"
          >
            <option value="">Select…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-website">Website</Label>
          <Input id="cp-website" {...register('website')} placeholder="https://yourcompany.com" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cp-address">Address</Label>
        <Input id="cp-address" {...register('address')} placeholder="Registered address" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cp-desc">Company Description</Label>
        <Textarea
          id="cp-desc"
          {...register('description')}
          rows={3}
          placeholder="What products or services does your company offer?"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving profile…</>
          : 'Save Profile & Go to Dashboard'
        }
      </Button>
    </form>
  )
}
