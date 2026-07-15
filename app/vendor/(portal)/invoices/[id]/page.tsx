import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Receipt, CheckCircle2 } from 'lucide-react'
import { getVendorUser, getVendorInvoiceById } from '@/lib/supabase/vendor-portal'
import { formatDate, formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Invoice Details' }
interface PageProps { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-amber-100 text-amber-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700', partially_paid: 'bg-cyan-100 text-cyan-700',
  paid: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function VendorInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  // Use admin client for reliability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await import('@/lib/supabase/admin')).createAdminClient() as any
  const { data: invoice } = await db
    .from('invoices')
    .select('*, purchase_order:purchase_orders(id, po_number), items:invoice_items(*), payments(*)')
    .eq('id', id)
    .maybeSingle()

  if (!invoice) notFound()

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/invoices" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><Receipt className="h-5 w-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[--color-foreground]">{invoice.invoice_number}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[invoice.status] ?? 'bg-gray-100 text-gray-600'}`}>{invoice.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-[--color-foreground-muted]">{formatDate(invoice.invoice_date)}</p>
          </div>
        </div>
      </div>

      {/* Payment progress */}
      {!['draft', 'cancelled'].includes(invoice.status) && invoice.total_amount > 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[--color-foreground-muted]">Payment Progress</span>
            <span className="font-semibold">{formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="h-2 rounded-full bg-[--color-muted] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (invoice.paid_amount / invoice.total_amount) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-[--color-foreground-muted]">{formatCurrency(invoice.remaining_amount)} remaining</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {(invoice.items ?? []).length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-5 py-3"><h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2></div>
              <table className="w-full">
                <thead className="bg-[--color-background-subtle]">
                  <tr>{['Description', 'Qty', 'Unit Price', 'Tax %', 'Total'].map((h) => <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[--color-foreground-muted]">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {(invoice.items ?? []).map((item: { id: string; description: string; quantity: number; unit_price: number; tax_percentage: number; line_total: number }) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.description}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{item.tax_percentage > 0 ? `${item.tax_percentage}%` : '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment history */}
          {(invoice.payments ?? []).length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-5 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-[--color-foreground]">Payment History</h2>
              </div>
              <ul className="divide-y divide-[--color-border]">
                {(invoice.payments ?? []).map((pay: { id: string; payment_reference: string; payment_date: string; payment_method: string; amount: number }) => (
                  <li key={pay.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[--color-foreground]">{pay.payment_reference}</p>
                      <p className="text-xs text-[--color-foreground-muted]">{formatDate(pay.payment_date)} · {pay.payment_method.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(pay.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Invoice Details</h2>
          {[
            { label: 'Invoice #', value: invoice.invoice_number },
            { label: 'Status', value: invoice.status.replace(/_/g, ' ') },
            { label: 'Date', value: formatDate(invoice.invoice_date) },
            { label: 'Due Date', value: invoice.due_date ? formatDate(invoice.due_date) : '—' },
            { label: 'Total', value: formatCurrency(invoice.total_amount) },
            { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
            { label: 'Remaining', value: formatCurrency(invoice.remaining_amount) },
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
