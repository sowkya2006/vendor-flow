import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getApprovalRequests } from '@/lib/supabase/approvals'
import { ApprovalList } from '@/components/approvals/approval-list'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import type { ApprovalRequestStatus, ApprovalEntityType } from '@/types/approval'

export const metadata: Metadata = { title: 'Approvals — VendorFlow' }

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-[--color-foreground-muted]">{label}</p>
          <p className="text-xl font-bold text-[--color-foreground]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-2.5 w-36" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Server data components
// ---------------------------------------------------------------------------

async function ApprovalStats({ companyId }: { companyId: string }) {
  const [all, pending, approved, rejected] = await Promise.all([
    getApprovalRequests(companyId, { pageSize: 1 }),
    getApprovalRequests(companyId, { pageSize: 1, status: 'pending_manager' }),
    getApprovalRequests(companyId, { pageSize: 1, status: 'approved' }),
    getApprovalRequests(companyId, { pageSize: 1, status: 'rejected' }),
  ])

  // Sum all pending statuses
  const [pendingProc, pendingFin, pendingFinal] = await Promise.all([
    getApprovalRequests(companyId, { pageSize: 1, status: 'pending_procurement' }),
    getApprovalRequests(companyId, { pageSize: 1, status: 'pending_finance' }),
    getApprovalRequests(companyId, { pageSize: 1, status: 'pending_final' }),
  ])

  const totalPending = pending.total + pendingProc.total + pendingFin.total + pendingFinal.total

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={ClipboardList} label="Total Requests" value={all.total}
        color="bg-[--color-primary]/10 text-[--color-primary]" />
      <StatCard icon={Clock} label="Pending" value={totalPending}
        color="bg-amber-100 text-amber-600" />
      <StatCard icon={CheckCircle2} label="Approved" value={approved.total}
        color="bg-green-100 text-green-600" />
      <StatCard icon={XCircle} label="Rejected" value={rejected.total}
        color="bg-red-100 text-red-600" />
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; entity_type?: string; page?: string }>
}

async function ApprovalListServer({
  companyId, search, status, entityType, page,
}: {
  companyId: string; search: string; status: string; entityType: string; page: number
}) {
  const result = await getApprovalRequests(companyId, {
    search: search || undefined,
    status: (status as ApprovalRequestStatus) || undefined,
    entity_type: (entityType as ApprovalEntityType) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <ApprovalList
      requests={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
      showNew
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const entityType = params.entity_type ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Approvals</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Manage procurement approval workflows
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/approvals/pending">Pending</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/approvals/history">History</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <ApprovalStats companyId={companyId} />
      </Suspense>

      {/* List */}
      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <ApprovalListServer
            companyId={companyId}
            search={search}
            status={status}
            entityType={entityType}
            page={page}
          />
        </Suspense>
      </div>
    </PageContainer>
  )
}
