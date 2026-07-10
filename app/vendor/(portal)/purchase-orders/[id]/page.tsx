import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { getVendorUser, getVendorPurchaseOrderById } from '@/lib/supabase/vendor-portal'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Purchase Order' }
interface PageProps { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', approved: 'bg-blue-100 text-blue-700',
  sent: 'bg-cyan-100 text-cyan-700', in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
}

export default async function VendorPoDetailPage({ params }: PageProps) {
  const { id } = await params
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const po = await getVendorPurchaseOrderById(id, vu.vendor_id)
  if (!po) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (po as any).items ?? []

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link href="/vendor/purchase-orders" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><ShoppingCart className="h-5 w-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[--color-foreground]">{po.po_number}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[po.status] ?? 'bg-gray-100 text-gray-600'}`}>{po.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-[--color-foreground-muted]">Purchase Order</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {items.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-5 py-3"><h2 className="text-sm font-semibold text-[--color-foreground]">Items</h2></div>
              <table className="w-full">
                <thead className="bg-[--color-background-subtle]">
                  <tr>{['Description', 'Qty', 'Unit', 'Unit Price', 'Total'].map((h) => <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[--color-foreground-muted]">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {items.map((item: { id: string; description: string; quantity: number; unit: string | null; unit_price: number; total_price: number }) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.description}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{item.unit ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {po.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Details</h2>
          {[
            { label: 'PO Number', value: po.po_number },
            { label: 'Status', value: po.status.replace(/_/g, ' ') },
            { label: 'Total Amount', value: po.total_amount != null ? formatCurrency(po.total_amount) : '—' },
            { label: 'Currency', value: po.currency },
            { label: 'Due Date', value: po.due_date ? formatDate(po.due_date) : '—' },
            { label: 'Expected Delivery', value: po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—' },
            { label: 'Created', value: formatDate(po.created_at) },
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
