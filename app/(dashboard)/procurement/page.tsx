import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getPurchaseRequests, getPRStats } from '@/lib/supabase/purchase-requests'
import { PRList } from '@/components/procurement/pr-list'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import type { PRStatus, PRPriority } from '@/types/purchase-request'

export const metadata: Metadata = { title: 'Purchase Requests — VendorFlow' }

function StatCard({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-[--color-foreground-subtle]">{sublabel}</p>}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
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
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>
}

async function PRStats({ companyId }: { companyId: string }) {
  const stats = await getPRStats(companyId)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="Draft" value={stats.draft} sublabel="Not submitted" />
      <StatCard label="Submitted" value={stats.submitted} />
      <StatCard label="Under Review" value={stats.under_review} />
      <StatCard label="Approved" value={stats.approved} />
      <StatCard label="Rejected" value={stats.rejected} />
      <StatCard label="Converted" value={stats.converted} sublabel="To PO / RFQ" />
    </div>
  )
}

async function PRListServer({
  companyId, search, status, priority, page,
}: {
  companyId: string
  search: string
  status: string
  priority: string
  page: number
}) {
  const result = await getPurchaseRequests(companyId, {
    search: search || undefined,
    status: (status as PRStatus) || undefined,
    priority: (priority as PRPriority) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <PRList
      prs={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
    />
  )
}

export default async function ProcurementPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const priority = params.priority ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Purchase Requests</h1>
            <p className="text-xs text-[--color-foreground-muted]">Raise and track procurement requests</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/procurement/new">
            <Plus className="h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <PRStats companyId={companyId} />
      </Suspense>

      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <PRListServer
            companyId={companyId}
            search={search}
            status={status}
            priority={priority}
            page={page}
          />
        </Suspense>
      </div>
    </PageContainer>
  )
}
