'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileSearch, Building2, Package, Info, Loader2, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency } from '@/lib/utils'
import { createPurchaseOrderFromQuotationAction } from '@/app/(dashboard)/purchase-orders/actions'
import type { ApprovedQuotationForPO } from '@/lib/supabase/quotations'

interface Props {
  approvedQuotations: ApprovedQuotationForPO[]
  preselectedQuotationId: string | null
}

export function POFromQuotationClient({ approvedQuotations, preselectedQuotationId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string>(preselectedQuotationId ?? '')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)

  const selected = approvedQuotations.find((q) => q.id === selectedId) ?? null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) { setError('Please select an approved quotation'); return }
    setError(null)
    startTransition(async () => {
      try {
        await createPurchaseOrderFromQuotationAction({
          quotation_id: selectedId,
          due_date: dueDate || null,
          notes: notes || null,
        })
      } catch (err) {
        if (isRedirectError(err)) throw err
        setError(err instanceof Error ? err.message : 'Failed to create purchase order')
        toast.error('Failed to create purchase order')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Quotation selector ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="border-b border-[--color-border] px-5 py-4 flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[--color-primary]" />
          <h2 className="text-sm font-semibold text-[--color-foreground]">Select Approved Quotation</h2>
          <span className="ml-auto rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[11px] font-medium text-[--color-primary]">
            {approvedQuotations.length} available
          </span>
        </div>

        <div className="p-4 space-y-2">
          {approvedQuotations.map((q) => {
            const isSelected = q.id === selectedId
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => { setSelectedId(q.id); setError(null) }}
                className={cn(
                  'w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150',
                  isSelected
                    ? 'border-[--color-primary] bg-[--color-primary]/5 shadow-[0_0_0_2px_var(--color-primary)]'
                    : 'border-[--color-border] hover:border-[--color-primary]/40 hover:bg-[--color-background-subtle]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[--color-foreground]">
                        {q.quotation_number}
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold uppercase">
                        Approved
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[--color-foreground-muted]">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {q.vendor?.name ?? '—'}
                      </span>
                      {q.rfq && (
                        <span className="flex items-center gap-1">
                          <FileSearch className="h-3 w-3" />
                          RFQ: {q.rfq.rfq_number} — {q.rfq.title}
                        </span>
                      )}
                      {q.items.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {q.items.length} item{q.items.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {q.grand_total != null && (
                      <p className="text-sm font-bold text-[--color-foreground]">
                        {formatCurrency(q.grand_total)}
                      </p>
                    )}
                    {isSelected && (
                      <div className="flex justify-end mt-1">
                        <Check className="h-4 w-4 text-[--color-primary]" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Auto-populated PO details ──────────────────────────────────── */}
      {selected && (
        <>
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-[--color-primary]/20 bg-[--color-primary]/5 px-4 py-3.5">
            <Info className="h-4 w-4 text-[--color-primary] shrink-0 mt-0.5" />
            <div className="text-xs text-[--color-foreground-muted] leading-relaxed">
              <p className="font-semibold text-[--color-foreground] mb-0.5">Auto-filled from approved quotation</p>
              Vendor, products, quantities, and pricing are copied from{' '}
              <span className="font-medium">{selected.quotation_number}</span>.
              These fields are read-only. You can only set the delivery date and add notes.
            </div>
          </div>

          {/* Vendor info — read only */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="border-b border-[--color-border] px-5 py-3 bg-[--color-background-subtle]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
                Vendor — Read Only
              </h3>
            </div>
            <div className="p-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[--color-foreground-muted] mb-0.5">Vendor Name</p>
                <p className="text-sm font-medium text-[--color-foreground]">{selected.vendor?.name ?? '—'}</p>
              </div>
              {selected.vendor?.email && (
                <div>
                  <p className="text-xs text-[--color-foreground-muted] mb-0.5">Email</p>
                  <p className="text-sm font-medium text-[--color-foreground]">{selected.vendor.email}</p>
                </div>
              )}
              {selected.rfq && (
                <>
                  <div>
                    <p className="text-xs text-[--color-foreground-muted] mb-0.5">RFQ Number</p>
                    <p className="text-sm font-medium text-[--color-foreground]">{selected.rfq.rfq_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[--color-foreground-muted] mb-0.5">RFQ Title</p>
                    <p className="text-sm font-medium text-[--color-foreground]">{selected.rfq.title}</p>
                  </div>
                </>
              )}
              {selected.payment_terms && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[--color-foreground-muted] mb-0.5">Payment Terms</p>
                  <p className="text-sm font-medium text-[--color-foreground]">{selected.payment_terms}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line items — read only */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="border-b border-[--color-border] px-5 py-3 bg-[--color-background-subtle] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
                Products — Read Only ({selected.items.length} items)
              </h3>
              {selected.grand_total != null && (
                <p className="text-sm font-bold text-[--color-foreground]">
                  Total: {formatCurrency(selected.grand_total)}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">Description</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Qty</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">Unit</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Unit Price</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {selected.items.map((item, i) => (
                    <tr key={item.id ?? i} className="hover:bg-[--color-background-subtle] transition-colors">
                      <td className="px-5 py-3 text-[--color-foreground]">{item.item_name}</td>
                      <td className="px-4 py-3 text-right text-[--color-foreground]">{item.quantity}</td>
                      <td className="px-4 py-3 text-[--color-foreground-muted]">{item.unit ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-[--color-foreground]">{formatCurrency(item.unit_price)}</td>
                      <td className="px-5 py-3 text-right font-medium text-[--color-foreground]">
                        {item.line_total != null
                          ? formatCurrency(item.line_total)
                          : formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Editable fields */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[--color-foreground]">Delivery Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Expected Delivery Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal Notes / Special Instructions</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special delivery instructions or internal notes…"
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Error + Submit ─────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-[--color-border] pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !selectedId}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Purchase Order
        </Button>
      </div>
    </form>
  )
}
