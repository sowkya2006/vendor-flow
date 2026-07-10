import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ClipboardList,
  User,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  AlertTriangle,
  GitBranch,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { getApprovalRequestById } from '@/lib/supabase/approvals'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  ApprovalStatusBadge,
  ApprovalPriorityBadge,
} from '@/components/approvals/approval-status-badge'
import { ApprovalStepProgress, ApprovalActionTimeline } from '@/components/approvals/approval-timeline'
import { ApprovalActionButtons } from '@/components/approvals/approval-action-buttons'
import { formatDate, formatCurrency } from '@/lib/utils'
import { APPROVAL_ENTITY_LABELS } from '@/types/approval'

// UUID v4 pattern — rejects "new" and any other non-UUID segment
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  if (!UUID_RE.test(id)) return { title: 'Approval Request — VendorFlow' }
  const companyId = await getCompanyId()
  const request = await getApprovalRequestById(id, companyId)
  return {
    title: request
      ? `${request.title} — VendorFlow`
      : 'Approval Request — VendorFlow',
  }
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function StepProgressBar({ current, total }: { current: number; total: number }) {
  if (total === 0) return null
  const pct = Math.min(100, Math.round((current / total) * 100))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-[--color-foreground-muted]">
        <span>Progress</span>
        <span>{current}/{total} steps</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[--color-border]">
        <div
          className="h-full rounded-full bg-[--color-primary] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Guard against non-UUID segments (e.g. "new") falling through to this route
  if (!UUID_RE.test(id)) notFound()

  const companyId = await getCompanyId()
  const user = await getUser()

  const request = await getApprovalRequestById(id, companyId)
  if (!request) notFound()

  // Find the pending step that belongs to the current user
  const activeStep = request.steps?.find(
    (s) => s.status === 'pending' && s.approver_id === user.id,
  )
  const isRequester = request.requested_by === user.id

  const entityHref: Record<string, string> = {
    vendor: `/vendors/${request.entity_id}`,
    rfq: `/rfqs/${request.entity_id}`,
    quotation: `/quotations/${request.entity_id}`,
    purchase_order: `/purchase-orders/${request.entity_id}`,
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={request.title}
        description={`Approval Request · ${formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/approvals">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {entityHref[request.entity_type] && (
              <Button variant="outline" size="sm" asChild>
                <Link href={entityHref[request.entity_type]}>
                  <GitBranch className="h-4 w-4" />
                  View {APPROVAL_ENTITY_LABELS[request.entity_type]}
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
            {!['approved', 'rejected', 'cancelled', 'completed'].includes(request.status) && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                  Actions
                </h3>
                <ApprovalActionButtons
                  requestId={request.id}
                  status={request.status}
                  activeStep={activeStep}
                  isRequester={isRequester}
                />
              </div>
            )}

            {/* Rejection / Return reason */}
            {request.rejection_reason && (
              <div className="rounded-xl border border-[--color-error]/30 bg-[--color-error-bg] p-5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-[--color-error]" />
                  <p className="text-xs font-semibold text-[--color-error]">Rejection Reason</p>
                </div>
                <p className="text-sm text-[--color-foreground-muted]">{request.rejection_reason}</p>
              </div>
            )}
            {request.return_reason && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-semibold text-blue-700 mb-1">Returned for Revision</p>
                <p className="text-sm text-blue-600">{request.return_reason}</p>
              </div>
            )}

            {/* Description */}
            {request.description && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {request.description}
                </p>
              </div>
            )}

            {/* Approval Steps */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-6 py-4">
                <h2 className="text-sm font-semibold text-[--color-foreground]">Approval Steps</h2>
                <p className="text-xs text-[--color-foreground-muted] mt-0.5">
                  Workflow progress through all required approvers
                </p>
              </div>
              <div className="p-6">
                {request.steps && request.steps.length > 0 ? (
                  <>
                    <div className="mb-5">
                      <StepProgressBar
                        current={request.steps.filter((s) => s.status === 'approved').length}
                        total={request.steps.length}
                      />
                    </div>
                    <ApprovalStepProgress
                      steps={request.steps}
                      currentStep={request.current_step}
                    />
                  </>
                ) : (
                  <p className="text-xs text-[--color-foreground-muted]">
                    No workflow steps configured. The request can be approved directly.
                  </p>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="border-b border-[--color-border] px-6 py-4">
                <h2 className="text-sm font-semibold text-[--color-foreground]">Activity</h2>
                <p className="text-xs text-[--color-foreground-muted] mt-0.5">
                  Full audit trail of all actions
                </p>
              </div>
              <div className="p-6">
                <ApprovalActionTimeline actions={request.actions ?? []} />
              </div>
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <ApprovalStatusBadge status={request.status} />
                <ApprovalPriorityBadge priority={request.priority} />
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Details
              </h3>
              <Separator className="mb-3" />
              <div className="divide-y divide-[--color-border]">
                <InfoRow
                  icon={Tag}
                  label="Type"
                  value={APPROVAL_ENTITY_LABELS[request.entity_type]}
                />
                {request.entity_ref && (
                  <InfoRow icon={ClipboardList} label="Reference" value={request.entity_ref} />
                )}
                {request.requester && (
                  <InfoRow
                    icon={User}
                    label="Requested By"
                    value={request.requester.full_name ?? request.requester.email ?? '—'}
                  />
                )}
                {request.amount != null && (
                  <InfoRow
                    icon={DollarSign}
                    label="Amount"
                    value={formatCurrency(request.amount)}
                  />
                )}
                {request.due_date && (
                  <InfoRow
                    icon={Calendar}
                    label="Due Date"
                    value={formatDate(request.due_date)}
                  />
                )}
                {request.submitted_at && (
                  <InfoRow
                    icon={Clock}
                    label="Submitted"
                    value={formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                  />
                )}
                <InfoRow
                  icon={Clock}
                  label="Created"
                  value={formatDate(request.created_at)}
                />
              </div>
            </div>

            {/* Workflow */}
            {request.workflow && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                  Workflow
                </h3>
                <p className="text-sm font-medium text-[--color-foreground]">
                  {request.workflow.name}
                </p>
                {request.total_steps > 0 && (
                  <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                    {request.total_steps} step{request.total_steps !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
