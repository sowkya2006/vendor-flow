import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  Building2,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Package,
} from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getRFQById } from '@/lib/supabase/rfqs'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { RFQStatusBadge, RFQPriorityBadge } from '@/components/rfqs/rfq-status-badge'
import { RFQDeleteButton } from '@/components/rfqs/rfq-delete-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatCurrency } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const rfq = await getRFQById(id, companyId)
  return { title: rfq ? `${rfq.title} — VendorFlow` : 'RFQ Not Found — VendorFlow' }
}

// ── Info row helper ───────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[--color-accent] text-[--color-foreground-muted]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[--color-foreground-muted]">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-[--color-foreground]">{value}</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const companyId = await getCompanyId()
  const rfq = await getRFQById(id, companyId)

  if (!rfq) notFound()

  const isOverdue =
    rfq.due_date &&
    rfq.status !== 'awarded' &&
    rfq.status !== 'cancelled' &&
    new Date(rfq.due_date) < new Date()

  const totalEstimated =
    rfq.items?.reduce(
      (sum, item) => sum + (item.estimated_unit_price ?? 0) * item.quantity,
      0,
    ) ?? 0

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={rfq.title}
        description={`RFQ · Created ${formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true })}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/rfqs">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/rfqs/${rfq.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <RFQDeleteButton rfqId={rfq.id} />
          </div>
        }
      />

      <PageContainer className="max-w-5xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left: main content ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {rfq.description && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">
                  Description
                </h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {rfq.description}
                </p>
              </div>
            )}

            {/* Line Items */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="flex items-center justify-between border-b border-[--color-border] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[--color-foreground-muted]" />
                  <h2 className="text-sm font-semibold text-[--color-foreground]">
                    Line Items
                  </h2>
                </div>
                {rfq.items && rfq.items.length > 0 && (
                  <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-xs text-[--color-foreground-muted]">
                    {rfq.items.length} item{rfq.items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {rfq.items && rfq.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
                        <th className="px-6 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">
                          Description
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">
                          Qty
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">
                          Unit
                        </th>
                        <th className="px-6 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">
                          Est. Unit Price
                        </th>
                        <th className="px-6 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">
                          Est. Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                      {rfq.items.map((item, i) => {
                        const lineTotal =
                          item.estimated_unit_price != null
                            ? item.estimated_unit_price * item.quantity
                            : null
                        return (
                          <tr
                            key={item.id ?? i}
                            className="hover:bg-[--color-background-subtle] transition-colors"
                          >
                            <td className="px-6 py-3 text-[--color-foreground]">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-right text-[--color-foreground]">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-[--color-foreground-muted]">
                              {item.unit}
                            </td>
                            <td className="px-6 py-3 text-right text-[--color-foreground]">
                              {item.estimated_unit_price != null
                                ? formatCurrency(item.estimated_unit_price)
                                : <span className="text-[--color-foreground-subtle]">—</span>}
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-[--color-foreground]">
                              {lineTotal != null
                                ? formatCurrency(lineTotal)
                                : <span className="text-[--color-foreground-subtle]">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {totalEstimated > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-[--color-border] bg-[--color-background-subtle]">
                          <td
                            colSpan={4}
                            className="px-6 py-3 text-right text-xs font-semibold text-[--color-foreground-muted]"
                          >
                            Estimated Total
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-[--color-foreground]">
                            {formatCurrency(totalEstimated)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="mb-2 h-7 w-7 text-[--color-foreground-subtle]" />
                  <p className="text-sm text-[--color-foreground-muted]">No line items added</p>
                </div>
              )}
            </div>

            {/* Terms */}
            {rfq.terms && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">
                  Terms &amp; Conditions
                </h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {rfq.terms}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4">
            {/* Status card */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <RFQStatusBadge status={rfq.status} />
                <RFQPriorityBadge priority={rfq.priority} />
              </div>
            </div>

            {/* Details card */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Details
              </h3>
              <Separator className="mb-3" />

              <div className="divide-y divide-[--color-border]">
                {rfq.vendor && (
                  <InfoRow
                    icon={Building2}
                    label="Vendor"
                    value={rfq.vendor.name}
                  />
                )}
                <InfoRow
                  icon={Calendar}
                  label="Closing Date"
                  value={
                    rfq.due_date ? (
                      <span
                        className={
                          isOverdue ? 'text-[--color-error]' : undefined
                        }
                      >
                        {formatDate(rfq.due_date)}
                        {isOverdue && ' · Overdue'}
                      </span>
                    ) : (
                      <span className="text-[--color-foreground-subtle]">Not set</span>
                    )
                  }
                />
                <InfoRow
                  icon={Clock}
                  label="Created"
                  value={formatDate(rfq.created_at)}
                />
                <InfoRow
                  icon={Clock}
                  label="Last updated"
                  value={formatDistanceToNow(new Date(rfq.updated_at), {
                    addSuffix: true,
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
