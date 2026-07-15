'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Receipt, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createVendorInvoiceSchema } from '@/lib/validations/vendor-portal'
import type { CreateVendorInvoiceInput } from '@/lib/validations/vendor-portal'
import type { POForInvoice } from '@/lib/supabase/vendor-portal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface Props {
  po: POForInvoice
  onSubmit: (values: CreateVendorInvoiceInput) => Promise<void>
}

// Only the fields the vendor fills in manually
interface VendorFields {
  invoice_number: string
  invoice_date: string
  due_date: string | null
  notes: string | null
  invoice_pdf_url: string | null
  tax_invoice_url: string | null
}

export function VendorInvoiceForm({ po, onSubmit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const grn = po.completed_grn

  // Build auto-filled items.
  // 
  // DATA PRIORITY:
  // 1. GRN accepted items (if grn_items has rows with actual data)
  // 2. PO line items (always available from purchase_order_items)
  // 3. Empty — show error
  //
  // NOTE: GRN items may be empty if:
  //   a) The migration adding item_name/accepted_quantity hasn't been run, OR
  //   b) GRN was created before items were saved (product_id NOT NULL issue)
  // In those cases we fall back to PO items which always have the real data.

  const grnItems = grn?.grn_items ?? []
  const hasUsableGrnItems = grnItems.length > 0 && grnItems.some(
    (gi) => gi.unit_cost > 0 || (gi.item_name ?? gi.description ?? '') !== ''
  )

  const autoItems = hasUsableGrnItems
    ? grnItems.map((gi) => {
        const poItem = po.items.find(
          (pi) => pi.description === (gi.item_name ?? gi.description)
        ) ?? po.items[0]

        const displayName =
          gi.item_name ?? gi.description ?? poItem?.description ?? `Item ${grnItems.indexOf(gi) + 1}`

        return {
          description: displayName,
          quantity: Number(gi.accepted_quantity ?? gi.received_quantity) || 1,
          unit: gi.unit ?? poItem?.unit ?? null,
          unit_price: Number(gi.unit_cost) > 0 ? Number(gi.unit_cost) : Number(poItem?.unit_price) || 0,
          tax_percentage: Number(gi.tax_percentage) || 0,
          po_item_id: poItem?.id ?? null,
          ordered_quantity: Number(poItem?.quantity ?? gi.ordered_quantity) || 0,
          received_quantity: Number(gi.received_quantity) || 0,
        }
      })
    : po.items.map((pi) => ({
        // PO items fallback — use PO line items directly
        // quantity = ordered quantity (all goods were received per GRN completion)
        description: pi.description,
        quantity: Number(pi.quantity) || 1,
        unit: pi.unit ?? null,
        unit_price: Number(pi.unit_price) || 0,
        tax_percentage: 0,
        po_item_id: pi.id,
        ordered_quantity: Number(pi.quantity) || 0,
        received_quantity: Number(pi.quantity) || 0, // GRN confirmed delivery
      }))

  const subtotal = autoItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = autoItems.reduce(
    (s, i) => s + i.quantity * i.unit_price * (i.tax_percentage / 100),
    0,
  )
  const grandTotal = subtotal + taxAmount

  // Only validate / register the fields the vendor actually types
  const { register, handleSubmit, formState: { errors } } = useForm<VendorFields>({defaultValues: {
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: null,
      notes: null,
      invoice_pdf_url: null,
      tax_invoice_url: null,
    },
  })

  function handleSubmitForm(fields: VendorFields) {
    if (!fields.invoice_number?.trim()) {
      setError('Invoice number is required.')
      return
    }
    if (!fields.invoice_date?.trim()) {
      setError('Invoice date is required.')
      return
    }
    if (autoItems.length === 0) {
      setError('No line items found. Please go back and try again.')
      return
    }

    setError(null)

    // Build the full payload manually — don't rely on RHF for auto-filled items
    const payload: CreateVendorInvoiceInput = {
      invoice_number: fields.invoice_number.trim(),
      invoice_date: fields.invoice_date,
      due_date: fields.due_date || null,
      purchase_order_id: po.id,
      grn_id: grn?.id ?? null,
      currency: 'INR',
      discount_amount: 0,
      notes: fields.notes || null,
      invoice_pdf_url: fields.invoice_pdf_url || null,
      tax_invoice_url: fields.tax_invoice_url || null,
      items: autoItems,
    }

    // Validate with Zod before sending
    const parsed = createVendorInvoiceSchema.safeParse(payload)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
        ?? parsed.error.issues[0]?.message
        ?? 'Validation failed. Please check all fields.'
      setError(firstError)
      console.error('[VendorInvoiceForm] zod errors:', parsed.error.flatten())
      return
    }

    startTransition(async () => {
      try {
        await onSubmit(parsed.data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'An error occurred. Please try again.'
        setError(msg)
        console.error('[VendorInvoiceForm] submit error:', e)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PO + GRN summary banner */}
      <div className="rounded-xl border border-[--color-primary]/20 bg-[--color-primary]/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <h3 className="text-sm font-semibold text-[--color-foreground]">Invoice linked to PO &amp; GRN</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="space-y-0.5">
            <p className="text-[--color-foreground-muted] font-medium uppercase tracking-wide text-[10px]">Purchase Order</p>
            <p className="font-semibold text-[--color-foreground]">{po.po_number}</p>
            <p className="text-[--color-foreground-muted]">{po.vendor?.name ?? '—'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[--color-foreground-muted] font-medium uppercase tracking-wide text-[10px]">Goods Receipt Note</p>
            {grn ? (
              <>
                <p className="font-semibold text-[--color-foreground]">{grn.grn_number}</p>
                <p className="text-[--color-foreground-muted]">Received: {new Date(grn.received_date).toLocaleDateString()}</p>
              </>
            ) : (
              <p className="text-amber-600 font-medium">No completed GRN — items from PO</p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-[--color-foreground-muted] font-medium uppercase tracking-wide text-[10px]">Invoice Amount</p>
            <p className="font-bold text-lg text-[--color-foreground]">{formatCurrency(grandTotal)}</p>
            <p className="text-[--color-foreground-muted]">
              {autoItems.length} item{autoItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Vendor-filled fields */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Invoice Details — Fill These</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_number">Invoice Number *</Label>
            <Input
              id="invoice_number"
              {...register('invoice_number')}
              placeholder="e.g. INV-2024-001"
              autoFocus
            />
            {errors.invoice_number && (
              <p className="text-xs text-red-600">{errors.invoice_number.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice_date">Invoice Date *</Label>
            <Input id="invoice_date" type="date" {...register('invoice_date')} />
            {errors.invoice_date && (
              <p className="text-xs text-red-600">{errors.invoice_date.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_date">Payment Due Date</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Remarks / Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            rows={2}
            placeholder="Any additional notes for the finance team…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_pdf_url">Invoice PDF URL (optional)</Label>
            <Input
              id="invoice_pdf_url"
              type="url"
              {...register('invoice_pdf_url')}
              placeholder="https://…"
            />
            <p className="text-[10px] text-[--color-foreground-muted]">
              Upload to your file host and paste the link here.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tax_invoice_url">Tax Invoice URL (optional)</Label>
            <Input
              id="tax_invoice_url"
              type="url"
              {...register('tax_invoice_url')}
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      {/* Auto-filled line items — read-only */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-3 bg-[--color-background-subtle]">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
            <h3 className="text-sm font-semibold text-[--color-foreground]">
              Line Items
              <span className="ml-2 text-[10px] font-normal text-[--color-foreground-muted]">
                Auto-populated from {grn ? 'GRN' : 'PO'} — read-only
              </span>
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {autoItems.length} items
          </Badge>
        </div>

        <div className="divide-y divide-[--color-border]">
          {autoItems.map((item, i) => {
            const lineSubtotal = item.quantity * item.unit_price
            const lineTax = lineSubtotal * ((item.tax_percentage ?? 0) / 100)
            const lineTotal = lineSubtotal + lineTax
            const hasShortfall = item.received_quantity < item.ordered_quantity

            return (
              <div key={i} className="px-5 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[--color-foreground]">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-[--color-foreground-muted]">
                      {item.unit && <span>Unit: {item.unit}</span>}
                      <span>Ordered: {item.ordered_quantity}</span>
                      <span className={hasShortfall ? 'text-amber-600 font-medium' : ''}>
                        Received: {item.received_quantity}
                        {hasShortfall && ` (${item.ordered_quantity - item.received_quantity} short)`}
                      </span>
                      <span>Invoiced: <strong>{item.quantity}</strong></span>
                    </div>
                    {hasShortfall && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <p className="text-[10px] text-amber-600">
                          Partial delivery — Finance will be notified during 3-way match
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-sm font-semibold text-[--color-foreground]">
                      {formatCurrency(lineTotal)}
                    </p>
                    <p className="text-xs text-[--color-foreground-muted]">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                      {(item.tax_percentage ?? 0) > 0 && ` + ${item.tax_percentage}% tax`}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-[--color-border] px-5 py-4 bg-[--color-background-subtle]">
          <div className="ml-auto max-w-xs space-y-1.5">
            <div className="flex justify-between text-xs text-[--color-foreground-muted]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[--color-foreground-muted]">
              <span>Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[--color-foreground] border-t border-[--color-border] pt-1.5">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Submit Invoice'}
        </Button>
      </div>
    </form>
  )
}
