'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { createVendorInvoiceSchema } from '@/lib/validations/vendor-portal'
import type { CreateVendorInvoiceInput } from '@/lib/validations/vendor-portal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface Props {
  poOptions: Array<{ id: string; po_number: string }>
  defaultValues?: Partial<CreateVendorInvoiceInput>
  onSubmit: (values: CreateVendorInvoiceInput) => Promise<void>
}

export function VendorInvoiceForm({ poOptions, defaultValues, onSubmit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CreateVendorInvoiceInput>({
    resolver: zodResolver(createVendorInvoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().slice(0, 10),
      currency: 'INR',
      discount_amount: 0,
      items: [{ description: '', quantity: 1, unit_price: 0, tax_percentage: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const discount = watch('discount_amount') ?? 0
  const subtotal = watchedItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const tax = watchedItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0) * ((Number(i.tax_percentage) || 0) / 100), 0)
  const total = subtotal + tax - (Number(discount) || 0)

  function handleSubmitForm(values: CreateVendorInvoiceInput) {
    setError(null)
    startTransition(async () => {
      try { await onSubmit(values) }
      catch (e) { setError(e instanceof Error ? e.message : 'An error occurred') }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Invoice Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
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
            <Label>Purchase Order (optional)</Label>
            <Controller control={control} name="purchase_order_id" render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Link to PO…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No PO</SelectItem>
                  {poOptions.map((po) => <SelectItem key={po.id} value={po.id}>{po.po_number}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="discount_amount">Discount</Label>
            <Input id="discount_amount" type="number" step="0.01" min="0" {...register('discount_amount')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={2} />
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[--color-foreground]">Line Items</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_percentage: 0 })}><Plus className="h-3.5 w-3.5 mr-1" />Add Item</Button>
        </div>
        <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_70px_32px] gap-2 px-1 text-[11px] font-medium text-[--color-foreground-muted]">
          <span>Description</span><span>Qty</span><span>Unit Price</span><span>Tax %</span><span />
        </div>
        {fields.map((field, index) => {
          const qty = Number(watchedItems[index]?.quantity) || 0
          const price = Number(watchedItems[index]?.unit_price) || 0
          const taxPct = Number(watchedItems[index]?.tax_percentage) || 0
          const lineTotal = qty * price * (1 + taxPct / 100)
          return (
            <div key={field.id} className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_80px_100px_70px_32px] sm:gap-2 sm:items-start">
              <div>
                <Input {...register(`items.${index}.description`)} placeholder="Description *" className="h-8 text-xs" />
                {errors.items?.[index]?.description && <p className="text-[11px] text-red-600 mt-0.5">{errors.items[index]?.description?.message}</p>}
                <p className="text-[11px] text-right text-[--color-foreground-muted] mt-0.5">Line: {formatCurrency(lineTotal)}</p>
              </div>
              <Input type="number" step="0.001" min="0" {...register(`items.${index}.quantity`)} className="h-8 text-xs" />
              <Input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`)} className="h-8 text-xs" />
              <Input type="number" step="0.01" min="0" max="100" {...register(`items.${index}.tax_percentage`)} className="h-8 text-xs" placeholder="0" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )
        })}
        <div className="ml-auto w-full max-w-xs space-y-1 border-t border-[--color-border] pt-3">
          <div className="flex justify-between text-xs text-[--color-foreground-muted]"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between text-xs text-[--color-foreground-muted]"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
          {(Number(discount) || 0) > 0 && <div className="flex justify-between text-xs text-emerald-600"><span>Discount</span><span>−{formatCurrency(Number(discount) || 0)}</span></div>}
          <div className="flex justify-between text-sm font-bold text-[--color-foreground] border-t border-[--color-border] pt-1.5"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : 'Create Invoice'}</Button>
      </div>
    </form>
  )
}
