'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { invoiceSchema } from '@/lib/validations/invoice'
import type { InvoiceFormValues } from '@/lib/validations/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface InvoiceFormProps {
  defaultValues?: Partial<InvoiceFormValues>
  vendors: Array<{ id: string; name: string }>
  purchaseOrders: Array<{ id: string; po_number: string; vendor_id: string; vendor: { name: string } | null }>
  products: Array<{ id: string; name: string; sku: string; unit: string; unit_cost: number }>
  onSubmit: (values: InvoiceFormValues) => Promise<void>
  submitLabel?: string
}

export function InvoiceForm({
  defaultValues,
  vendors,
  purchaseOrders,
  products,
  onSubmit,
  submitLabel = 'Save Invoice',
}: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().slice(0, 10),
      discount_amount: 0,
      currency: 'INR',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_percentage: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const discount = watch('discount_amount') ?? 0
  const selectedPO = watch('purchase_order_id')

  // Auto-fill vendor when PO changes
  useEffect(() => {
    if (selectedPO) {
      const po = purchaseOrders.find((p) => p.id === selectedPO)
      if (po) setValue('vendor_id', po.vendor_id)
    }
  }, [selectedPO, purchaseOrders, setValue])

  const subtotal = watchedItems.reduce((s, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    return s + qty * price
  }, 0)
  const taxTotal = watchedItems.reduce((s, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    const tax = Number(item.tax_percentage) || 0
    return s + qty * price * (tax / 100)
  }, 0)
  const total = subtotal + taxTotal - (Number(discount) || 0)

  function handleSubmitForm(values: InvoiceFormValues) {
    setError(null)
    startTransition(async () => {
      try {
        await onSubmit(values)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Invoice Details</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="vendor_id">Vendor *</Label>
            <Controller
              control={control}
              name="vendor_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="vendor_id">
                    <SelectValue placeholder="Select vendor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vendor_id && <p className="text-xs text-red-600">{errors.vendor_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase_order_id">Purchase Order (optional)</Label>
            <Controller
              control={control}
              name="purchase_order_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                >
                  <SelectTrigger id="purchase_order_id">
                    <SelectValue placeholder="Link to PO…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PO</SelectItem>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_number}{po.vendor ? ` — ${po.vendor.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice_date">Invoice Date *</Label>
            <Input id="invoice_date" type="date" {...register('invoice_date')} />
            {errors.invoice_date && <p className="text-xs text-red-600">{errors.invoice_date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...register('currency')} placeholder="INR" className="uppercase" maxLength={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount_amount">Discount Amount</Label>
            <Input id="discount_amount" type="number" step="0.01" min="0" {...register('discount_amount')} placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional notes or payment terms…" />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[--color-foreground]">Line Items</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_percentage: 0 })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items?.root && (
          <p className="text-xs text-red-600">{errors.items.root.message}</p>
        )}

        {/* Header row */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_90px_110px_90px_32px] gap-2 px-1 text-xs font-medium text-[--color-foreground-muted]">
          <span>Description</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Tax %</span>
          <span />
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => {
            const qty = Number(watchedItems[index]?.quantity) || 0
            const price = Number(watchedItems[index]?.unit_price) || 0
            const tax = Number(watchedItems[index]?.tax_percentage) || 0
            const lineTotal = qty * price * (1 + tax / 100)

            return (
              <div key={field.id} className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_90px_110px_90px_32px] sm:gap-2 sm:items-start">
                {/* Description + product picker */}
                <div className="space-y-1">
                  <Controller
                    control={control}
                    name={`items.${index}.product_id`}
                    render={({ field: f }) => (
                      <Select
                        value={f.value ?? ''}
                        onValueChange={(v) => {
                          f.onChange(v === 'none' ? null : v)
                          if (v !== 'none') {
                            const prod = products.find((p) => p.id === v)
                            if (prod) {
                              setValue(`items.${index}.description`, prod.name)
                              setValue(`items.${index}.unit_price`, prod.unit_cost)
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs mb-1">
                          <SelectValue placeholder="Pick product (optional)…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Custom item</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Description *"
                    className="h-8 text-xs"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-red-600">{errors.items[index]?.description?.message}</p>
                  )}
                  <p className="text-[11px] text-[--color-foreground-muted] text-right">
                    Line: {formatCurrency(lineTotal)}
                  </p>
                </div>

                <div>
                  <Label className="text-xs sm:hidden">Qty</Label>
                  <Input type="number" step="0.001" min="0.001" {...register(`items.${index}.quantity`)} className="h-8 text-xs" />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs sm:hidden">Unit Price</Label>
                  <Input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`)} className="h-8 text-xs" />
                  {errors.items?.[index]?.unit_price && (
                    <p className="text-xs text-red-600">{errors.items[index]?.unit_price?.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs sm:hidden">Tax %</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...register(`items.${index}.tax_percentage`)} className="h-8 text-xs" placeholder="0" />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 mt-0 sm:mt-0"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 border-t border-[--color-border] pt-3">
          <div className="flex justify-between text-sm text-[--color-foreground-muted]">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-[--color-foreground-muted]">
            <span>Tax</span><span>{formatCurrency(taxTotal)}</span>
          </div>
          {(Number(discount) || 0) > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount</span><span>−{formatCurrency(Number(discount) || 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[--color-foreground] border-t border-[--color-border] pt-1.5">
            <span>Total</span><span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
