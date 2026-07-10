'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { vendorProfileSchema } from '@/lib/validations/vendor-portal'
import type { VendorProfileInput } from '@/lib/validations/vendor-portal'
import type { VendorPortalProfile } from '@/types/vendor-portal'
import { updateVendorProfileAction } from '@/app/vendor/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function VendorProfileForm({ defaultValues }: { defaultValues: VendorPortalProfile }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<VendorProfileInput>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      name: defaultValues.name,
      legal_name: defaultValues.legal_name ?? '',
      email: defaultValues.email ?? '',
      phone: defaultValues.phone ?? '',
      website: defaultValues.website ?? '',
      address: defaultValues.address ?? '',
      tax_id: defaultValues.tax_id ?? '',
      registration_number: defaultValues.registration_number ?? '',
      description: defaultValues.description ?? '',
    },
  })

  function onSubmit(values: VendorProfileInput) {
    setError(null)
    startTransition(async () => {
      try {
        await updateVendorProfileAction(values)
        toast.success('Profile updated successfully')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Company Name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="legal_name">Legal Name</Label>
          <Input id="legal_name" {...register('legal_name')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" type="url" {...register('website')} placeholder="https://" />
          {errors.website && <p className="text-xs text-red-600">{errors.website.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax_id">GST / Tax ID</Label>
          <Input id="tax_id" {...register('tax_id')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input id="registration_number" {...register('registration_number')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register('address')} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={3} placeholder="About your company…" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
