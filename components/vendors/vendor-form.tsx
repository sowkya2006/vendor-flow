'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vendorSchema, type VendorFormValues } from '@/lib/validations/vendor'
import { createVendorAction, updateVendorAction } from '@/app/actions/vendors'
import type { Vendor } from '@/types/vendor'

// ── field helpers ─────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-[--color-foreground]"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-destructive]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-[--color-destructive]">{message}</p>
}

function FieldGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-col', className)}>{children}</div>
}

// ── select options ────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'services', label: 'Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
] as const

// ── component ─────────────────────────────────────────────────────────────────

interface VendorFormProps {
  /** When provided the form operates in edit mode. */
  vendor?: Vendor
}

export function VendorForm({ vendor }: VendorFormProps) {
  const isEdit = vendor != null
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: vendor?.name ?? '',
      category: vendor?.category,
      status: vendor?.status ?? 'pending',
      website: vendor?.website ?? '',
      email: vendor?.email ?? '',
      phone: vendor?.phone ?? '',
      address: vendor?.address ?? '',
      notes: vendor?.notes ?? '',
      contract_start_date: vendor?.contract_start_date ?? '',
      contract_end_date: vendor?.contract_end_date ?? '',
      contract_value: vendor?.contract_value ?? undefined,
    },
  })

  const categoryValue = watch('category')
  const statusValue = watch('status')

  function onSubmit(values: VendorFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateVendorAction(vendor!.id, values)
        : await createVendorAction(values)

      if (result && !result.success) {
        toast.error(result.error)
      }
      // On success the server action redirects — nothing more to do here
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        {/* ── Core info ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">
            Core information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <FieldGroup className="sm:col-span-2">
              <Label htmlFor="name" required>
                Vendor name
              </Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError message={errors.name?.message} />
            </FieldGroup>

            {/* Category */}
            <FieldGroup>
              <Label htmlFor="category" required>
                Category
              </Label>
              <Select
                value={categoryValue}
                onValueChange={(v) =>
                  setValue('category', v as VendorFormValues['category'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="category" aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.category?.message} />
            </FieldGroup>

            {/* Status */}
            <FieldGroup>
              <Label htmlFor="status" required>
                Status
              </Label>
              <Select
                value={statusValue}
                onValueChange={(v) =>
                  setValue('status', v as VendorFormValues['status'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="status" aria-invalid={!!errors.status}>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.status?.message} />
            </FieldGroup>
          </div>
        </section>

        {/* ── Contact details ───────────────────────────────────────── */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">
            Contact details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <FieldGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@vendor.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </FieldGroup>

            {/* Phone */}
            <FieldGroup>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError message={errors.phone?.message} />
            </FieldGroup>

            {/* Website */}
            <FieldGroup>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://vendor.com"
                aria-invalid={!!errors.website}
                {...register('website')}
              />
              <FieldError message={errors.website?.message} />
            </FieldGroup>

            {/* Address */}
            <FieldGroup>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                aria-invalid={!!errors.address}
                {...register('address')}
              />
              <FieldError message={errors.address?.message} />
            </FieldGroup>
          </div>
        </section>

        {/* ── Contract & financials ─────────────────────────────────── */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">
            Contract &amp; financials
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Contract start */}
            <FieldGroup>
              <Label htmlFor="contract_start_date">Contract start</Label>
              <Input
                id="contract_start_date"
                type="date"
                aria-invalid={!!errors.contract_start_date}
                {...register('contract_start_date')}
              />
              <FieldError message={errors.contract_start_date?.message} />
            </FieldGroup>

            {/* Contract end */}
            <FieldGroup>
              <Label htmlFor="contract_end_date">Contract end</Label>
              <Input
                id="contract_end_date"
                type="date"
                aria-invalid={!!errors.contract_end_date}
                {...register('contract_end_date')}
              />
              <FieldError message={errors.contract_end_date?.message} />
            </FieldGroup>

            {/* Annual value */}
            <FieldGroup>
              <Label htmlFor="contract_value">Annual value (USD)</Label>
              <Input
                id="contract_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                aria-invalid={!!errors.contract_value}
                {...register('contract_value', { valueAsNumber: true })}
              />
              <FieldError message={errors.contract_value?.message} />
            </FieldGroup>
          </div>
        </section>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">Notes</h2>
          <FieldGroup>
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Any additional context about this vendor…"
              aria-invalid={!!errors.notes}
              {...register('notes')}
            />
            <FieldError message={errors.notes?.message} />
          </FieldGroup>
        </section>

        {/* ── Form actions ──────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create vendor'}
          </Button>
        </div>
      </div>
    </form>
  )
}
