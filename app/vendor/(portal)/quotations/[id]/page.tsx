import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileSearch, Send, XCircle } from 'lucide-react'
import { getVendorUser, getVendorQuotationById } from '@/lib/supabase/vendor-portal'
import { submitVendorQuotationAction, withdrawVendorQuotationAction } from '@/app/vendor/actions'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Quotation Details' }
export const dynamic = 'force-dynamic'
interface PageProps { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', withdrawn: 'bg-amber-100 text-amber-700',
}

export default async function VendorQuotationDetailPage({ params }: PageProps) {
  const { id } = await params
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const q = await getVendorQuotationById(id, vu.vendor_id)
  if (!q) notFound()

  const isDraft = q.status === 'draft'
  const canWithdraw = ['draft', 'submitted'].includes(q.status)

  // Fallback: if DB totals are 0 (trigger was blocked by RLS), compute from items
  const items = q.items ?? []
  const computedSubtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price), 0)
  const computedTax      = items.reduce((s, i) => s + (i.tax_amount ?? (i.quantity * i.unit_price * ((i.tax_pct ?? 0) / 100))), 0)
  const computedDiscount = q.discount_amount ?? 0
  const computedTotal    = computedSubtotal + computedTax - computedDiscount

  const displaySubtotal = (q.subtotal && q.subtotal > 0) ? q.subtotal : computedSubtotal
  const displayTax      = (q.tax_amount && q.tax_amount > 0) ? q.tax_amount : computedTax
  const displayDiscount = q.discount_amount ?? 0
  const displayTotal    = (q.grand_total && q.grand_total > 0) ? q.grand_total : (q.total_amount && q.total_amount > 0) ? q.total_amount : computedTotal

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/quotations" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><FileSearch className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[--color-foreground]">{q.quotation_number}</h1>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[q.status] ?? ''}`}>{q.status}</span>
              </div>
              <p className="text-xs text-[--color-foreground-muted]">{(q.rfq as { title: string } | null)?.title ?? 'No RFQ'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <form action={submitVendorQuotationAction.bind(null, id)}>
                <Button type="submit" size="sm"><Send className="h-3.5 w-3.5 mr-1.5" />Submit</Button>
              </form>
            )}
            {isDraft && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/vendor/quotations/${id}/edit`}>Edit</Link>
              </Button>
            )}
            {canWithdraw && (
              <form action={withdrawVendorQuotationAction.bind(null, id)}>
                <Button type="submit" size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"><XCircle className="h-3.5 w-3.5 mr-1.5" />Withdraw</Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Items table */}
          {(q.items ?? []).length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-5 py-3"><h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2></div>
              <table className="w-full">
                <thead className="bg-[--color-background-subtle]">
                  <tr>
                    {['Description', 'Qty', 'Unit Price', 'Tax %', 'Line Total'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[--color-foreground-muted] last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {(q.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.item_name ?? item.description ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{(item.tax_pct ?? 0) > 0 ? `${item.tax_pct}%` : '—'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-[--color-foreground]">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[--color-border] bg-[--color-background-subtle]">
                  <tr><td colSpan={4} className="px-4 py-2 text-right text-xs text-[--color-foreground-muted]">Subtotal</td><td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(displaySubtotal)}</td></tr>
                  <tr><td colSpan={4} className="px-4 py-2 text-right text-xs text-[--color-foreground-muted]">Tax</td><td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(displayTax)}</td></tr>
                  {displayDiscount > 0 && <tr><td colSpan={4} className="px-4 py-2 text-right text-xs text-emerald-600">Discount</td><td className="px-4 py-2 text-right text-sm text-emerald-600">−{formatCurrency(displayDiscount)}</td></tr>}
                  <tr><td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-[--color-foreground]">Total</td><td className="px-4 py-3 text-right text-base font-bold text-[--color-foreground]">{formatCurrency(displayTotal)}</td></tr>
                </tfoot>
              </table>
            </div>
          )}
          {q.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{q.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Details</h2>
          {[
            { label: 'Number', value: q.quotation_number },
            { label: 'Status', value: q.status },
            { label: 'Valid Until', value: q.valid_until ? formatDate(q.valid_until) : '—' },
            { label: 'Created', value: formatDate(q.created_at) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-[--color-foreground-muted]">{label}</span>
              <span className="font-medium text-[--color-foreground] capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
