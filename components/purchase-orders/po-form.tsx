'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { purchaseOrderSchema, type PurchaseOrderFormValues } from '@/lib/validations/purchase-order'
import type { PurchaseOrder } from '@/types/purchase-order'
import type { VendorSummary } from '@/types/vendor'

// ── Constants ─────────────────────────────────────────────────────────────────

const UNITS = [
  'unit', 'pcs', 'kg', 'g', 'lb', 'oz',
  'ltr', 'ml', 'box', 'set', 'pair', 'roll', 'sheet', 'hour', 'day', 'month',
]

const EMPTY_ITEM = { description: '', quantity: 1, unit: 'unit', unit_price: 0 } as const

// ── Field helpers ─────────────────────────────────────────────────────────────

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

interface POFormProps {
  po?: PurchaseOrder
  vendors: VendorSummary[]
  onSubmit: (values: PurchaseOrderFormValues) => Promise<void>
  mode: 'create' | 'edit'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function POForm({ po, vendors, onSubmit, mode }: POFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultItems =
    po?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
    })) ?? [{ ...EMPTY_ITEM }]

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      vendor_id: po?.vendor_id ?? '',
      rfq_id: po?.rfq_id ?? '',
      due_date: po?.due_date ? po.due_date.slice(0, 10) : '',
      shipping_address: po?.shipping_address ?? '',
      billing_address: po?.billing_address ?? '',
      payment_terms: po?.payment_terms ?? '',
      notes: po?.notes ?? '',
      items: defaultItems,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Live total
  const watchedItems = watch('items') ?? []
  const lineTotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  )

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error('Failed to save purchase order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* ── Vendor & Dates ── */}
      <Section title="Order Details" description="Select the vendor and key dates for this PO.">
        <div className="space-y-4">
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
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.vendor_id?.message} />
          </div>

          {/* Due date */}
          <div className="sm:max-w-xs">
            <FieldLabel htmlFor="due_date">Delivery Date</FieldLabel>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              aria-invalid={!!errors.due_date}
            />
            <FieldError message={errors.due_date?.message} />
          </div>

          {/* Payment terms */}
          <div>
            <FieldLabel htmlFor="payment_terms">Payment Terms</FieldLabel>
            <Input
              id="payment_terms"
              placeholder="e.g. Net 30, 50% upfront"
              {...register('payment_terms')}
            />
            <FieldError message={errors.payment_terms?.message} />
          </div>
        </div>
      </Section>

      {/* ── Line Items ── */}
      <Section title="Line Items" description="Add the items being ordered.">
        <div className="space-y-3">
          {fields.length > 0 && (
            <div className="hidden grid-cols-[1fr_80px_100px_120px_40px] gap-3 sm:grid">
              <span className="text-xs font-medium text-[--color-foreground-muted]">Description</span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">Qty</span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">Unit</span>
              <span className="text-xs font-medium text-[--color-foreground-muted]">Unit Price</span>
              <span />
            </div>
          )}

          {fields.map((field, index) => {
            const qty = Number(watchedItems[index]?.quantity) || 0
            const price = Number(watchedItems[index]?.unit_price) || 0
            const rowTotal = qty * price

            return (
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

                {/* Qty */}
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

                {/* Unit Price */}
                <div className="mb-2 sm:mb-0">
                  <FieldLabel htmlFor={`items.${index}.unit_price`} required>
                    <span className="sm:hidden">Unit Price</span>
                  </FieldLabel>
                  <Input
                    id={`items.${index}.unit_price`}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    aria-invalid={!!errors.items?.[index]?.unit_price}
                  />
                  <FieldError message={errors.items?.[index]?.unit_price?.message} />
                  {rowTotal > 0 && (
                    <p className="mt-1 text-xs text-[--color-foreground-subtle]">
                      = {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rowTotal)}
                    </p>
                  )}
                </div>

                {/* Remove */}
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
            )
          })}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...EMPTY_ITEM })}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>

            {lineTotal > 0 && (
              <p className="text-sm font-semibold text-[--color-foreground]">
                Total:{' '}
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(lineTotal)}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── Addresses ── */}
      <Section title="Addresses" description="Shipping and billing information.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="shipping_address">Shipping Address</FieldLabel>
            <Textarea
              id="shipping_address"
              placeholder="Shipping address…"
              rows={3}
              {...register('shipping_address')}
            />
            <FieldError message={errors.shipping_address?.message} />
          </div>
          <div>
            <FieldLabel htmlFor="billing_address">Billing Address</FieldLabel>
            <Textarea
              id="billing_address"
              placeholder="Billing address…"
              rows={3}
              {...register('billing_address')}
            />
            <FieldError message={errors.billing_address?.message} />
          </div>
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section title="Notes" description="Internal notes visible only to your team.">
        <Textarea
          id="notes"
          placeholder="Add any internal notes or special instructions…"
          rows={3}
          {...register('notes')}
        />
        <FieldError message={errors.notes?.message} />
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
          {mode === 'create' ? 'Create Purchase Order' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
