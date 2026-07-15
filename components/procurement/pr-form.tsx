'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader as Loader2, CircleAlert as AlertCircle, ChevronLeft } from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { purchaseRequestSchema, type PRFormValues } from '@/lib/validations/purchase-request'
import type { PurchaseRequest } from '@/types/purchase-request'
import { DEPARTMENTS } from '@/types/purchase-request'

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const UNITS = ['pcs', 'unit', 'kg', 'g', 'litre', 'ml', 'box', 'set', 'hour', 'day', 'month']

const EMPTY_ITEM = {
  product_id: null,
  description: '',
  quantity: 1,
  unit: 'pcs',
  estimated_unit_price: null,
  notes: null,
} as const

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[--color-error]">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      <div className="border-b border-[--color-border] px-6 py-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

interface PRFormProps {
  pr?: PurchaseRequest
  onSubmit: (values: PRFormValues) => Promise<void>
  mode: 'create' | 'edit'
}

export function PRForm({ pr, onSubmit, mode }: PRFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultItems =
    pr?.items?.map((item) => ({
      product_id: item.product_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price ?? null,
      notes: item.notes ?? null,
    })) ?? [{ ...EMPTY_ITEM }]

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PRFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      title: pr?.title ?? '',
      description: pr?.description ?? '',
      department: pr?.department ?? '',
      priority: pr?.priority ?? 'medium',
      required_date: pr?.required_date ? pr.required_date.slice(0, 10) : '',
      budget_amount: pr?.budget_amount ?? null,
      currency: pr?.currency ?? 'INR',
      notes: pr?.notes ?? '',
      items: defaultItems,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error('Failed to save purchase request.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Section title="Request Details" description="Basic information about this purchase request.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title <span className="text-[--color-error]">*</span></Label>
            <Input id="title" placeholder="e.g. Office Equipment Q4 2024" className="mt-1.5"
              {...register('title')} aria-invalid={!!errors.title} />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} className="mt-1.5"
              placeholder="Describe what you need and why…"
              {...register('description')} />
            <FieldError message={errors.description?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="department">Department</Label>
              <Controller name="department" control={control} render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No department</SelectItem>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div>
              <Label htmlFor="priority">Priority <span className="text-[--color-error]">*</span></Label>
              <Controller name="priority" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5" aria-invalid={!!errors.priority}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              <FieldError message={errors.priority?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="required_date">Required By</Label>
              <Input id="required_date" type="date" className="mt-1.5"
                {...register('required_date')} />
            </div>
            <div>
              <Label htmlFor="budget_amount">Budget Amount</Label>
              <Input id="budget_amount" type="number" min="0" step="0.01"
                placeholder="0.00" className="mt-1.5"
                {...register('budget_amount', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })} />
              <FieldError message={errors.budget_amount?.message} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" maxLength={3} placeholder="INR" className="mt-1.5 uppercase"
                {...register('currency')} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Requested Items" description="Add the products or services you need.">
        <div className="space-y-3">
          {fields.length > 0 && (
            <div className="hidden grid-cols-[1fr_80px_100px_120px_40px] gap-3 sm:grid">
              {['Description', 'Qty', 'Unit', 'Est. Price', ''].map((h) => (
                <span key={h} className="text-xs font-medium text-[--color-foreground-muted]">{h}</span>
              ))}
            </div>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3',
                'sm:grid sm:grid-cols-[1fr_80px_100px_120px_40px] sm:items-start sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
              )}
            >
              <div className="mb-2 sm:mb-0">
                <Input placeholder="Item description" className="sm:hidden mb-1"
                  {...register(`items.${index}.description`)} />
                <Input placeholder="Item description" className="hidden sm:block"
                  {...register(`items.${index}.description`)} />
                <FieldError message={errors.items?.[index]?.description?.message} />
              </div>

              <div className="mb-2 sm:mb-0">
                <Input type="number" min="0.001" step="any" placeholder="1"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                <FieldError message={errors.items?.[index]?.quantity?.message} />
              </div>

              <div className="mb-2 sm:mb-0">
                <Controller name={`items.${index}.unit`} control={control}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
              </div>

              <div className="mb-2 sm:mb-0">
                <Input type="number" min="0" step="any" placeholder="0.00"
                  {...register(`items.${index}.estimated_unit_price`, {
                    setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                  })} />
              </div>

              <div className="flex items-start justify-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md text-[--color-foreground-muted]',
                    'transition-colors hover:bg-[--color-error-bg] hover:text-[--color-error]',
                    'disabled:pointer-events-none disabled:opacity-30',
                  )}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm"
            onClick={() => append({ ...EMPTY_ITEM })}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </Section>

      <Section title="Additional Notes">
        <Textarea id="notes" rows={3} placeholder="Any internal notes or justification…"
          {...register('notes')} />
      </Section>

      <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Request' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
