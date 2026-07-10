'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { rfqSchema, type RFQFormValues } from '@/lib/validations/rfq'
import type { RFQ } from '@/types/rfq'
import type { VendorSummary } from '@/types/vendor'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const UNITS = [
  'unit', 'pcs', 'kg', 'g', 'lb', 'oz',
  'ltr', 'ml', 'box', 'set', 'pair', 'roll', 'sheet', 'hour', 'day', 'month',
]

const EMPTY_ITEM = {
  description: '',
  quantity: 1,
  unit: 'unit',
  estimated_unit_price: null,
} as const

// ── Field label helper ────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-[--color-foreground-muted] mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-error]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[--color-error]">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface RFQFormProps {
  /** If provided, the form operates in edit mode */
  rfq?: RFQ
  vendors: VendorSummary[]
  onSubmit: (values: RFQFormValues) => Promise<void>
  mode: 'create' | 'edit'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RFQForm({ rfq, vendors, onSubmit, mode }: RFQFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultItems =
    rfq?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price ?? null,
    })) ?? [{ ...EMPTY_ITEM }]

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      title: rfq?.title ?? '',
      description: rfq?.description ?? '',
      vendor_id: rfq?.vendor_id ?? '',
      due_date: rfq?.due_date ? rfq.due_date.slice(0, 10) : '',
      priority: rfq?.priority ?? 'medium',
      terms: rfq?.terms ?? '',
      items: defaultItems,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      // redirect() throws a special Next.js error — let it propagate so the
      // navigation actually happens. Only show an error toast for real failures.
      if (isRedirectError(err)) throw err
      toast.error('Failed to save RFQ. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ── Basic Info ── */}
      <Section
        title="RFQ Details"
        description="Basic information about this request for quotation."
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <FieldLabel htmlFor="title" required>
              Title
            </FieldLabel>
            <Input
              id="title"
              placeholder="e.g. Office Supplies Q3 2024"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Describe what you need and any special requirements…"
              rows={3}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Vendor + Priority row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Vendor */}
            <div>
              <FieldLabel htmlFor="vendor_id" required>
                Vendor
              </FieldLabel>
              <Controller
                name="vendor_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="vendor_id" aria-invalid={!!errors.vendor_id}>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No vendors available
                        </SelectItem>
                      ) : (
                        vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                            {v.category ? (
                              <span className="ml-1 text-[--color-foreground-muted]">
                                · {v.category}
                              </span>
                            ) : null}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.vendor_id?.message} />
            </div>

            {/* Priority */}
            <div>
              <FieldLabel htmlFor="priority" required>
                Priority
              </FieldLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority" aria-invalid={!!errors.priority}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.priority?.message} />
            </div>
          </div>

          {/* Due date */}
          <div className="sm:max-w-xs">
            <FieldLabel htmlFor="due_date">Closing Date</FieldLabel>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              aria-invalid={!!errors.due_date}
            />
            <FieldError message={errors.due_date?.message} />
          </div>
        </div>
      </Section>

      {/* ── Line Items ── */}
      <Section
        title="Line Items"
        description="Add the products or services you want vendors to quote on."
      >
        <div className="space-y-3">
          {/* Header row — hidden on mobile */}
          {fields.length > 0 && (
            <div className="hidden grid-cols-[1fr_80px_100px_120px_40px] gap-3 sm:grid">
              <span className="text-xs font-medium text-[--color-foreground-muted]">
                Description
              </span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">
                Qty
              </span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">
                Unit
              </span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">
                Est. Unit Price
              </span>
              <span />
            </div>
          )}

          {/* Item rows */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3',
                'sm:grid sm:grid-cols-[1fr_80px_100px_120px_40px] sm:items-start sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
              )}
            >
              {/* Description */}
              <div className="mb-2 sm:mb-0">
                <FieldLabel htmlFor={`items.${index}.description`} required>
                  <span className="sm:hidden">Description</span>
                </FieldLabel>
                <Input
                  id={`items.${index}.description`}
                  placeholder="Item description"
                  {...register(`items.${index}.description`)}
                  aria-invalid={!!errors.items?.[index]?.description}
                />
                <FieldError message={errors.items?.[index]?.description?.message} />
              </div>

              {/* Quantity */}
              <div className="mb-2 sm:mb-0">
                <FieldLabel htmlFor={`items.${index}.quantity`} required>
                  <span className="sm:hidden">Quantity</span>
                </FieldLabel>
                <Input
                  id={`items.${index}.quantity`}
                  type="number"
                  min="0.0001"
                  step="any"
                  placeholder="1"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  aria-invalid={!!errors.items?.[index]?.quantity}
                />
                <FieldError message={errors.items?.[index]?.quantity?.message} />
              </div>

              {/* Unit */}
              <div className="mb-2 sm:mb-0">
                <FieldLabel htmlFor={`items.${index}.unit`} required>
                  <span className="sm:hidden">Unit</span>
                </FieldLabel>
                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field: unitField }) => (
                    <Select value={unitField.value} onValueChange={unitField.onChange}>
                      <SelectTrigger
                        id={`items.${index}.unit`}
                        aria-invalid={!!errors.items?.[index]?.unit}
                      >
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.items?.[index]?.unit?.message} />
              </div>

              {/* Est. Unit Price */}
              <div className="mb-2 sm:mb-0">
                <FieldLabel htmlFor={`items.${index}.estimated_unit_price`}>
                  <span className="sm:hidden">Est. Unit Price</span>
                </FieldLabel>
                <Input
                  id={`items.${index}.estimated_unit_price`}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  {...register(`items.${index}.estimated_unit_price`, {
                    setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                  })}
                  aria-invalid={!!errors.items?.[index]?.estimated_unit_price}
                />
                <FieldError
                  message={errors.items?.[index]?.estimated_unit_price?.message}
                />
              </div>

              {/* Remove */}
              <div className="flex items-start justify-end sm:pt-0">
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

          {/* Add row */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...EMPTY_ITEM })}
            className="mt-2"
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </Section>

      {/* ── Terms & Conditions ── */}
      <Section title="Terms & Conditions" description="Optional terms to include in this RFQ.">
        <Textarea
          id="terms"
          placeholder="Enter any terms, payment conditions, delivery requirements, or other notes for vendors…"
          rows={4}
          {...register('terms')}
          aria-invalid={!!errors.terms}
        />
        <FieldError message={errors.terms?.message} />
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create RFQ' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
