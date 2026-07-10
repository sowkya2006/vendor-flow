import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { getVendorUser, getVendorRfqById } from '@/lib/supabase/vendor-portal'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'RFQ Details' }

interface PageProps { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700', under_review: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
}

export default async function VendorRfqDetailPage({ params }: PageProps) {
  const { id } = await params
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const rfq = await getVendorRfqById(id, vu.vendor_id)
  if (!rfq) notFound()

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <Link href="/vendor/rfqs" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]">
          <ArrowLeft className="h-3.5 w-3.5" />Back to RFQs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[--color-foreground]">{rfq.rfq_number}</h1>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[rfq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {rfq.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[--color-foreground-muted]">{rfq.title}</p>
            </div>
          </div>
          {['sent', 'under_review'].includes(rfq.status) && (
            <Button asChild size="sm">
              <Link href={`/vendor/quotations/new?rfq_id=${rfq.id}`}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Submit Quotation
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {rfq.description && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Description</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{rfq.description}</p>
            </div>
          )}

          {(rfq.items ?? []).length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
              <div className="border-b border-[--color-border] px-5 py-3">
                <h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2>
              </div>
              <table className="w-full">
                <thead className="bg-[--color-background-subtle]">
                  <tr>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[--color-foreground-muted]">Description</th>
                    <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase text-[--color-foreground-muted]">Qty</th>
                    <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase text-[--color-foreground-muted]">Unit</th>
                    <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase text-[--color-foreground-muted]">Est. Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {(rfq.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.description}</td>
                      <td className="px-4 py-3 text-right text-sm text-[--color-foreground]">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-[--color-foreground-muted]">{item.unit ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-sm text-[--color-foreground-muted]">{item.estimated_unit_price != null ? `₹${item.estimated_unit_price}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Details</h2>
          {[
            { label: 'RFQ Number', value: rfq.rfq_number },
            { label: 'Status', value: rfq.status.replace(/_/g, ' ') },
            { label: 'Priority', value: rfq.priority ?? '—' },
            { label: 'Due Date', value: rfq.due_date ? formatDate(rfq.due_date) : '—' },
            { label: 'Created', value: formatDate(rfq.created_at) },
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
