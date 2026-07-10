import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, LocationEdit as Edit, Calendar, Clock, User, Building2, DollarSign, Tag, TriangleAlert as AlertTriangle, Package, Send, CircleCheck as CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { getPRById } from '@/lib/supabase/purchase-requests'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { PRStatusBadge, PRPriorityBadge } from '@/components/procurement/pr-status-badge'
import { PRActionButtons } from '@/components/procurement/pr-action-buttons'
import { formatDate, formatCurrency } from '@/lib/utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: 'Purchase Request — VendorFlow' }
  const companyId = await getCompanyId()
  const pr = await getPRById(id, companyId)
  return {
    title: pr ? `${pr.pr_number} — VendorFlow` : 'Purchase Request — VendorFlow',
  }
}

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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--color-accent] text-[--color-foreground-muted]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[--color-foreground-muted]">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-[--color-foreground]">{value}</div>
      </div>
    </div>
  )
}

export default async function PRDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const companyId = await getCompanyId()
  const user = await getUser()
  const pr = await getPRById(id, companyId)
  if (!pr) notFound()

  const isRequester = pr.requested_by === user.id
  const canEdit = pr.status === 'draft'
  const totalEstimated =
    pr.items?.reduce(
      (sum, item) => sum + (item.estimated_unit_price ?? 0) * item.quantity,
      0,
    ) ?? 0

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={pr.title}
        description={`${pr.pr_number} · Created ${formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/procurement">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/procurement/${pr.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <PageContainer className="max-w-5xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left: main content ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Actions */}
            {!['approved', 'rejected', 'cancelled', 'converted'].includes(pr.status) && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                  Actions
                </h3>
                <PRActionButtons
                  requestId={pr.id}
                  status={pr.status}
                  isRequester={isRequester}
                />
              </div>
            )}

            {/* Status banners */}
            {pr.rejection_reason && (
              <div className="rounded-xl border border-[--color-error]/30 bg-[--color-error-bg] p-5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-[--color-error]" />
                  <p className="text-xs font-semibold text-[--color-error]">Rejection Reason</p>
                </div>
                <p className="text-sm text-[--color-foreground-muted]">{pr.rejection_reason}</p>
              </div>
            )}

            {/* Description */}
            {pr.description && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {pr.description}
                </p>
              </div>
            )}

            {/* Line Items */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="flex items-center justify-between border-b border-[--color-border] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[--color-foreground-muted]" />
                  <h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2>
                </div>
                {pr.items && pr.items.length > 0 && (
                  <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-xs text-[--color-foreground-muted]">
                    {pr.items.length} item{pr.items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {pr.items && pr.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
                        {['Description', 'Qty', 'Unit', 'Est. Unit Price', 'Est. Total'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                      {pr.items.map((item, i) => {
                        const lineTotal =
                          item.estimated_unit_price != null
                            ? item.estimated_unit_price * item.quantity
                            : null
                        return (
                          <tr key={item.id ?? i} className="hover:bg-[--color-background-subtle] transition-colors">
                            <td className="px-4 py-3 text-[--color-foreground]">
                              <p className="font-medium">{item.description}</p>
                              {item.notes && (
                                <p className="mt-0.5 text-xs text-[--color-foreground-muted] italic">{item.notes}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                            <td className="px-4 py-3 text-[--color-foreground-muted]">{item.unit}</td>
                            <td className="px-4 py-3 text-right tabular-nums">
                              {item.estimated_unit_price != null
                                ? formatCurrency(item.estimated_unit_price)
                                : <span className="text-[--color-foreground-subtle]">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums">
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
                          <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold text-[--color-foreground-muted]">
                            Estimated Total
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-[--color-foreground]">
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

            {/* Notes */}
            {pr.notes && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {pr.notes}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <PRStatusBadge status={pr.status} />
                <PRPriorityBadge priority={pr.priority} />
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Details
              </h3>
              <Separator className="mb-3" />
              <div className="divide-y divide-[--color-border]">
                <InfoRow icon={Tag} label="PR Number" value={
                  <span className="font-mono text-xs">{pr.pr_number}</span>
                } />
                {pr.department && (
                  <InfoRow icon={Building2} label="Department" value={pr.department} />
                )}
                {pr.requester && (
                  <InfoRow
                    icon={User}
                    label="Requested By"
                    value={pr.requester.full_name ?? pr.requester.email ?? '—'}
                  />
                )}
                {pr.budget_amount != null && (
                  <InfoRow
                    icon={DollarSign}
                    label="Budget"
                    value={formatCurrency(pr.budget_amount)}
                  />
                )}
                {pr.required_date && (
                  <InfoRow
                    icon={Calendar}
                    label="Required By"
                    value={formatDate(pr.required_date)}
                  />
                )}
                {pr.submitted_at && (
                  <InfoRow
                    icon={Send}
                    label="Submitted"
                    value={formatDistanceToNow(new Date(pr.submitted_at), { addSuffix: true })}
                  />
                )}
                {pr.approved_at && pr.approver && (
                  <InfoRow
                    icon={CheckCircle2}
                    label="Approved By"
                    value={pr.approver.full_name ?? pr.approver.email ?? '—'}
                  />
                )}
                <InfoRow icon={Clock} label="Created" value={formatDate(pr.created_at)} />
                <InfoRow
                  icon={Clock}
                  label="Last Updated"
                  value={formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })}
                />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
