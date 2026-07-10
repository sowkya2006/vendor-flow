import { Suspense } from 'react'
import { FileText } from 'lucide-react'
import { RFQList } from '@/components/rfqs/rfq-list'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { getRFQs } from '@/lib/supabase/rfqs'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import type { RFQStatus, RFQPriority } from '@/types/rfq'

// ── Stat cards ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  sublabel?: string
}

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-[--color-foreground-subtle]">{sublabel}</p>
      )}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] space-y-2"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  )
}

// ── List skeleton (shown while RFQList suspends) ──────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4"
        >
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

// ── Data-fetching inner components ────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>
}

async function RFQStats({ companyId }: { companyId: string }) {
  // Fetch counts for each status in parallel
  const [all, draft, sent, underReview, awarded] = await Promise.all([
    getRFQs(companyId, { pageSize: 1 }),
    getRFQs(companyId, { status: 'draft', pageSize: 1 }),
    getRFQs(companyId, { status: 'sent', pageSize: 1 }),
    getRFQs(companyId, { status: 'under_review', pageSize: 1 }),
    getRFQs(companyId, { status: 'awarded', pageSize: 1 }),
  ])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total RFQs" value={all.total} />
      <StatCard label="Draft" value={draft.total} sublabel="Not yet sent" />
      <StatCard label="Under Review" value={sent.total + underReview.total} sublabel="Awaiting response" />
      <StatCard label="Awarded" value={awarded.total} sublabel="This period" />
    </div>
  )
}

async function RFQListServer({
  companyId,
  search,
  status,
  priority,
  page,
}: {
  companyId: string
  search: string
  status: string
  priority: string
  page: number
}) {
  const result = await getRFQs(companyId, {
    search: search || undefined,
    status: (status as RFQStatus) || undefined,
    priority: (priority as RFQPriority) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <RFQList
      rfqs={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RFQsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const priority = params.priority ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">
              Requests for Quotation
            </h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Manage and track vendor quote requests
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <RFQStats companyId={companyId} />
      </Suspense>

      {/* List */}
      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <RFQListServer
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
