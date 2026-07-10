'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { organizationSchema, type OrganizationFormValues } from '@/lib/validations/settings'
import { updateOrganizationAction } from '@/app/actions/settings'

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── options ───────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'AED', label: 'AED — UAE Dirham' },
]

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// ── props ─────────────────────────────────────────────────────────────────────

interface OrganizationTabProps {
  org?: {
    name?: string
    timezone?: string
    currency?: string
    fiscal_year_start?: number
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export function OrganizationTab({ org }: OrganizationTabProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      org_name: org?.name ?? '',
      timezone: org?.timezone ?? 'UTC',
      currency: org?.currency ?? 'USD',
      fiscal_year_start: org?.fiscal_year_start ?? 1,
    },
  })

  const timezoneValue = watch('timezone')
  const currencyValue = watch('currency')
  const fiscalMonthValue = watch('fiscal_year_start')

  function onSubmit(values: OrganizationFormValues) {
    startTransition(async () => {
      const result = await updateOrganizationAction(values)
      if (result.success) {
        toast.success(result.message ?? 'Organization settings saved')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        {/* General */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">General</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col sm:col-span-2">
              <Label htmlFor="org_name" required>Organization name</Label>
              <Input
                id="org_name"
                placeholder="Acme Inc."
                aria-invalid={!!errors.org_name}
                {...register('org_name')}
              />
              <FieldError message={errors.org_name?.message} />
            </div>
          </div>
        </section>

        {/* Locale & financials */}
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">
            Locale &amp; financials
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Timezone */}
            <div className="flex flex-col">
              <Label htmlFor="timezone" required>Timezone</Label>
              <Select
                value={timezoneValue}
                onValueChange={(v) =>
                  setValue('timezone', v, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="timezone" aria-invalid={!!errors.timezone}>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.timezone?.message} />
            </div>

            {/* Currency */}
            <div className="flex flex-col">
              <Label htmlFor="currency" required>Default currency</Label>
              <Select
                value={currencyValue}
                onValueChange={(v) =>
                  setValue('currency', v, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="currency" aria-invalid={!!errors.currency}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.currency?.message} />
            </div>

            {/* Fiscal year start */}
            <div className="flex flex-col">
              <Label htmlFor="fiscal_year_start">Fiscal year start</Label>
              <Select
                value={String(fiscalMonthValue)}
                onValueChange={(v) =>
                  setValue('fiscal_year_start', Number(v), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="fiscal_year_start" aria-invalid={!!errors.fiscal_year_start}>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.fiscal_year_start?.message} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </form>
  )
}
