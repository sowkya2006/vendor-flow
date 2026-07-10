import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  MessageSquare,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getAuditLog } from '@/lib/supabase/approvals'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APPROVAL_ACTION_LABELS, APPROVAL_ENTITY_LABELS } from '@/types/approval'
import type { ApprovalActionType, ApprovalEntityType } from '@/types/approval'

export const metadata: Metadata = { title: 'Audit Log — VendorFlow' }

// ---------------------------------------------------------------------------
// Action icon/color map
// ---------------------------------------------------------------------------

const ACTION_ICON: Record<ApprovalActionType, React.ElementType> = {
  submitted: Send,
  approved: CheckCircle2,
  rejected: XCircle,
  returned: RotateCcw,
  cancelled: AlertTriangle,
  reassigned: UserCheck,
  escalated: AlertTriangle,
  commented: MessageSquare,
  reopened: RotateCcw,
}

const ACTION_COLOR: Record<ApprovalActionType, string> = {
  submitted: 'bg-[--color-primary]/10 text-[--color-primary]',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  returned: 'bg-blue-100 text-blue-600',
  cancelled: 'bg-orange-100 text-orange-600',
  reassigned: 'bg-purple-100 text-purple-600',
  escalated: 'bg-amber-100 text-amber-600',
  commented: 'bg-[--color-background-subtle] text-[--color-foreground-muted]',
  reopened: 'bg-cyan-100 text-cyan-600',
}

// ---------------------------------------------------------------------------
// Log entry row
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string
  action_type: ApprovalActionType
  comment: string | null
  is_internal: boolean
  old_status: string | null
  new_status: string | null
  performed_at: string
  actor: { id: string; full_name: string | null; email: string | null } | null
  request: {
    id: string
    title: string
    entity_type: ApprovalEntityType
    entity_ref: string | null
  } | null
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const Icon = ACTION_ICON[entry.action_type] ?? MessageSquare
  const color = ACTION_COLOR[entry.action_type] ?? ACTION_COLOR.commented

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[--color-foreground]">
            {APPROVAL_ACTION_LABELS[entry.action_type]}
          </span>
          {entry.is_internal && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Internal
            </span>
          )}
          {entry.request && (
            <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-[10px] text-[--color-foreground-muted]">
              {APPROVAL_ENTITY_LABELS[entry.request.entity_type]}
            </span>
          )}
        </div>

        {entry.request && (
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
            {entry.request.title}
            {entry.request.entity_ref && ` · ${entry.request.entity_ref}`}
          </p>
        )}

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[--color-foreground-muted]">
          <span>{entry.actor?.full_name ?? entry.actor?.email ?? 'System'}</span>
          {entry.old_status && entry.new_status && (
            <span>
              {entry.old_status.replace(/_/g, ' ')} → {entry.new_status.replace(/_/g, ' ')}
            </span>
          )}
          <span>{formatDistanceToNow(new Date(entry.performed_at), { addSuffix: true })}</span>
        </div>

        {entry.comment && (
          <p className="mt-1.5 rounded border border-[--color-border] bg-[--color-background-subtle] px-3 py-1.5 text-xs text-[--color-foreground-muted] italic">
            {entry.comment}
          </p>
        )}
      </div>

      <span className="hidden shrink-0 text-xs text-[--color-foreground-subtle] xl:block">
        {new Date(entry.performed_at).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AuditSkeleton() {
  return (
    <div className="divide-y divide-[--color-border]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-2.5 w-64" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Server data
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ page?: string; entity_type?: string }>
}

async function AuditLogServer({
  companyId, page, entityType,
}: { companyId: string; page: number; entityType: string }) {
  const result = await getAuditLog(companyId, {
    entity_type: entityType || undefined,
    page,
    pageSize: 30,
  })

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
      {result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="mb-3 h-8 w-8 text-[--color-foreground-subtle]" />
          <p className="text-sm font-medium text-[--color-foreground]">No audit records yet</p>
          <p className="mt-1 text-xs text-[--color-foreground-muted]">
            All approval workflow actions will be recorded here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[--color-border]">
          {(result.data as AuditEntry[]).map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] px-5 py-3">
          <form method="GET">
            <input type="hidden" name="page" value={String(page - 1)} />
            {entityType && <input type="hidden" name="entity_type" value={entityType} />}
            <Button type="submit" variant="outline" size="sm" disabled={page <= 1}>
              Previous
            </Button>
          </form>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <form method="GET">
            <input type="hidden" name="page" value={String(page + 1)} />
            {entityType && <input type="hidden" name="entity_type" value={entityType} />}
            <Button type="submit" variant="outline" size="sm" disabled={!result.hasNextPage}>
              Next
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const entityType = params.entity_type ?? ''
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Audit Log</h1>
          <p className="text-xs text-[--color-foreground-muted]">
            Immutable record of all approval workflow activity
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <form method="GET" className="mb-4 flex items-center gap-3">
        <select
          name="entity_type"
          defaultValue={entityType}
          className="h-9 rounded-md border border-[--color-border] bg-[--color-background] px-3 text-sm text-[--color-foreground] focus:outline-none focus:ring-2 focus:ring-[--color-ring]"
        >
          <option value="">All entity types</option>
          {Object.entries(APPROVAL_ENTITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
      </form>

      <Suspense fallback={<AuditSkeleton />}>
        <AuditLogServer companyId={companyId} page={page} entityType={entityType} />
      </Suspense>
    </PageContainer>
  )
}
