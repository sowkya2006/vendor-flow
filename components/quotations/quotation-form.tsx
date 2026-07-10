'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Calculator,
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
import { cn, formatCurrency } from '@/lib/utils'
import { quotationSchema, type QuotationFormValues } from '@/lib/validations/quotation'
import type { Quotation } from '@/types/quotation'
import type { VendorSummary } from '@/types/vendor'
import type { RFQSummary } from '@/types/rfq'

// ── Constants ─────────────────────────────────────────────────────────────────

const UNITS = [
  'unit', 'pcs', 'kg', 'g', 'lb', 'ltr', 'ml',
  'box', 'set', 'pair', 'roll', 'sheet', 'hour', 'day', 'month',
]

const EMPTY_ITEM = {
  item_name: '',
  description: '',
  part_number: '',
  unit: 'unit',
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
  tax_pct: 0,
  delivery_days: null,
  warranty_months: null,
  remarks: '',
  sort_order: 0,
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-[--color-foreground-muted] mb-1.5">
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      <div className="border-b border-[--color-border] px-6 py-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Line total helper ─────────────────────────────────────────────────────────

function calcLineTotal(qty: number, price: number, discPct: number, taxPct: number) {
  const base = qty * price
  const disc = base * (discPct / 100)
  const tax = (base - disc) * (taxPct / 100)
  return base - disc + tax
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QuotationFormProps {
  quotation?: Quotation
  vendors: VendorSummary[]
  rfqs: RFQSummary[]
  onSubmit: (values: QuotationFormValues) => Promise<void>
  mode: 'create' | 'edit'
  /** Pre-select RFQ when navigating from RFQ detail */
  defaultRfqId?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuotationForm({ quotation, vendors, rfqs, onSubmit, mode, defaultRfqId }: QuotationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultItems = quotation?.items?.map((item) => ({
    id: item.id,
    rfq_item_id: item.rfq_item_id,
    item_name: item.item_name,
    description: item.description ?? '',
    part_number: item.part_number ?? '',
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_pct: item.discount_pct,
    tax_pct: item.tax_pct,
    delivery_days: item.delivery_days,
    warranty_months: item.warranty_months,
    remarks: item.remarks ?? '',
    sort_order: item.sort_order,
  })) ?? [{ ...EMPTY_ITEM }]

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      rfq_id: quotation?.rfq_id ?? defaultRfqId ?? '',
      vendor_id: quotation?.vendor_id ?? '',
      discount_type: quotation?.discount_type ?? 'percentage',
      discount_value: quotation?.discount_value ?? 0,
      delivery_days: quotation?.delivery_days ?? null,
      lead_time_days: quotation?.lead_time_days ?? null,
      warranty_months: quotation?.warranty_months ?? null,
      payment_terms: quotation?.payment_terms ?? '',
      validity_date: quotation?.validity_date ? quotation.validity_date.slice(0, 10) : '',
      notes: quotation?.notes ?? '',
      items: defaultItems,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items') ?? []
  const watchDiscountType = watch('discount_type')
  const watchDiscountValue = watch('discount_value') ?? 0

  // Live totals
  const subtotal = watchedItems.reduce((sum, item) => {
    const base = (item.quantity || 0) * (item.unit_price || 0)
    const disc = base * ((item.discount_pct || 0) / 100)
    return sum + (base - disc)
  }, 0)
  const totalTax = watchedItems.reduce((sum, item) => {
    const base = (item.quantity || 0) * (item.unit_price || 0)
    const disc = base * ((item.discount_pct || 0) / 100)
    return sum + ((base - disc) * ((item.tax_pct || 0) / 100))
  }, 0)
  const headerDisc = watchDiscountType === 'percentage'
    ? subtotal * ((watchDiscountValue || 0) / 100)
    : (watchDiscountValue || 0)
  const grandTotal = subtotal - headerDisc + totalTax

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error('Failed to save quotation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">

      {/* ── Basic Details ── */}
      <Section title="Quotation Details" description="Associate this quotation with an RFQ and vendor.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* RFQ */}
          <div>
            <FieldLabel htmlFor="rfq_id" required>RFQ</FieldLabel>
            <Controller
              name="rfq_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rfq_id" aria-invalid={!!errors.rfq_id}>
                    <SelectValue placeholder="Select an RFQ" />
                  </SelectTrigger>
                  <SelectContent>
                    {rfqs.length === 0 ? (
                      <SelectItem value="_none" disabled>No RFQs available</SelectItem>
                    ) : (
                      rfqs.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.rfq_id?.message} />
          </div>

          {/* Vendor */}
          <div>
            <FieldLabel htmlFor="vendor_id" required>Vendor</FieldLabel>
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
                      <SelectItem value="_none" disabled>No vendors available</SelectItem>
                    ) : (
                      vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                          {v.category && (
                            <span className="ml-1 text-[--color-foreground-muted]">· {v.category}</span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.vendor_id?.message} />
          </div>

          {/* Validity Date */}
          <div>
            <FieldLabel htmlFor="validity_date">Valid Until</FieldLabel>
            <Input id="validity_date" type="date" {...register('validity_date')} />
            <FieldError message={errors.validity_date?.message} />
          </div>

          {/* Payment Terms */}
          <div>
            <FieldLabel htmlFor="payment_terms">Payment Terms</FieldLabel>
            <Input id="payment_terms" placeholder="e.g. Net 30, 50% advance…" {...register('payment_terms')} />
            <FieldError message={errors.payment_terms?.message} />
          </div>

          {/* Delivery Days */}
          <div>
            <FieldLabel htmlFor="delivery_days">Delivery Days</FieldLabel>
            <Input
              id="delivery_days"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 14"
              {...register('delivery_days', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
            />
            <FieldError message={errors.delivery_days?.message} />
          </div>

          {/* Lead Time */}
          <div>
            <FieldLabel htmlFor="lead_time_days">Lead Time Days</FieldLabel>
            <Input
              id="lead_time_days"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 7"
              {...register('lead_time_days', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
            />
            <FieldError message={errors.lead_time_days?.message} />
          </div>

          {/* Warranty */}
          <div>
            <FieldLabel htmlFor="warranty_months">Warranty (months)</FieldLabel>
            <Input
              id="warranty_months"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 12"
              {...register('warranty_months', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
            />
            <FieldError message={errors.warranty_months?.message} />
          </div>
        </div>
      </Section>

      {/* ── Line Items ── */}
      <Section title="Line Items" description="Add products or services with pricing details.">
        <div className="space-y-4">
          {/* Column headers (desktop) */}
          {fields.length > 0 && (
            <div className="hidden xl:grid xl:grid-cols-[2fr_80px_90px_100px_80px_80px_80px_80px_36px] gap-2 px-1">
              {['Item', 'Qty', 'Unit', 'Unit Price', 'Disc %', 'Tax %', 'Del. Days', 'Warranty', ''].map((h) => (
                <span key={h} className="text-xs font-medium text-[--color-foreground-muted]">{h}</span>
              ))}
            </div>
          )}

          {fields.map((field, index) => {
            const qty = watchedItems[index]?.quantity || 0
            const price = watchedItems[index]?.unit_price || 0
            const discPct = watchedItems[index]?.discount_pct || 0
            const taxPct = watchedItems[index]?.tax_pct || 0
            const lineTotal = calcLineTotal(qty, price, discPct, taxPct)

            return (
              <div
                key={field.id}
                className={cn(
                  'rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-4 space-y-3',
                  'xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:space-y-0',
                  'xl:grid xl:grid-cols-[2fr_80px_90px_100px_80px_80px_80px_80px_36px] xl:gap-2 xl:items-start',
                )}
              >
                {/* Item Name */}
                <div>
                  <FieldLabel htmlFor={`items.${index}.item_name`} required>
                    <span className="xl:hidden">Item Name</span>
                  </FieldLabel>
                  <Input
                    id={`items.${index}.item_name`}
                    placeholder="Item name"
                    {...register(`items.${index}.item_name`)}
                    aria-invalid={!!errors.items?.[index]?.item_name}
                  />
                  <FieldError message={errors.items?.[index]?.item_name?.message} />
                </div>

                {/* Quantity */}
                <div>
                  <FieldLabel><span className="xl:hidden">Qty</span></FieldLabel>
                  <Input
                    type="number"
                    min="0.001"
                    step="any"
                    placeholder="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                {/* Unit */}
                <div>
                  <FieldLabel><span className="xl:hidden">Unit</span></FieldLabel>
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger><SelectValue placeholder="unit" /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <FieldLabel><span className="xl:hidden">Unit Price</span></FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                  />
                </div>

                {/* Discount % */}
                <div>
                  <FieldLabel><span className="xl:hidden">Discount %</span></FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    {...register(`items.${index}.discount_pct`, { valueAsNumber: true })}
                  />
                </div>

                {/* Tax % */}
                <div>
                  <FieldLabel><span className="xl:hidden">Tax %</span></FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    {...register(`items.${index}.tax_pct`, { valueAsNumber: true })}
                  />
                </div>

                {/* Delivery Days */}
                <div>
                  <FieldLabel><span className="xl:hidden">Delivery Days</span></FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="—"
                    {...register(`items.${index}.delivery_days`, {
                      setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                    })}
                  />
                </div>

                {/* Warranty Months */}
                <div>
                  <FieldLabel><span className="xl:hidden">Warranty (mo.)</span></FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="—"
                    {...register(`items.${index}.warranty_months`, {
                      setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                    })}
                  />
                </div>

                {/* Remove */}
                <div className="flex items-start xl:justify-center xl:pt-1">
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

                {/* Line total (mobile only) */}
                <div className="xl:hidden flex items-center justify-between pt-1 border-t border-[--color-border]">
                  <span className="text-xs text-[--color-foreground-muted]">Line Total</span>
                  <span className="text-sm font-semibold text-[--color-foreground]">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>

                {/* Remarks (full row) */}
                <div className="xl:col-span-9">
                  <Input
                    placeholder="Remarks (optional)"
                    className="text-xs"
                    {...register(`items.${index}.remarks`)}
                  />
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...EMPTY_ITEM, sort_order: fields.length })}
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </Section>

      {/* ── Discount & Totals ── */}
      <Section title="Pricing Summary" description="Apply header-level discount and review totals.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="discount_type">Discount Type</FieldLabel>
                <Controller
                  name="discount_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="discount_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <FieldLabel htmlFor="discount_value">
                  {watchDiscountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                </FieldLabel>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  {...register('discount_value', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Live totals */}
          <div className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-[--color-primary]" />
              <span className="text-sm font-semibold text-[--color-foreground]">Totals Preview</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[--color-foreground-muted]">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[--color-error]">
                <span>Discount</span>
                <span className="tabular-nums">− {formatCurrency(headerDisc)}</span>
              </div>
              <div className="flex justify-between text-[--color-foreground-muted]">
                <span>Tax</span>
                <span className="tabular-nums">+ {formatCurrency(totalTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-[--color-foreground]">
                <span>Grand Total</span>
                <span className="tabular-nums text-[--color-primary]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section title="Notes" description="Additional remarks or terms for this quotation.">
        <Textarea
          id="notes"
          placeholder="Any additional terms, conditions, or remarks…"
          rows={4}
          {...register('notes')}
        />
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Quotation' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
