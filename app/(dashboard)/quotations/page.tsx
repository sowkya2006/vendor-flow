import { Suspense } from 'react'
import type { Metadata } from 'next'
import { FileSearch } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getQuotations, getQuotationStats } from '@/lib/supabase/quotations'
import { QuotationList } from '@/components/quotations/quotation-list'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'
import type { QuotationStatus } from '@/types/quotation'

export const metadata: Metadata = { title: 'Quotations — VendorFlow' }

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, highlight }: {
  label: string
  value: string | number
  sublabel?: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border px-5 py-4 shadow-[--shadow-sm] ${highlight ? 'border-[--color-primary]/30 bg-[--color-primary]/5' : 'border-[--color-border] bg-[--color-card]'}`}>
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-[--color-primary]' : 'text-[--color-foreground]'}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-[--color-foreground-subtle]">{sublabel}</p>}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-14" />
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
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

// ── Server data components ────────────────────────────────────────────────────

async function QuotationStats({ companyId }: { companyId: string }) {
  const stats = await getQuotationStats(companyId)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="Pending Review" value={stats.pending_review} sublabel="Submitted / In Review" />
      <StatCard label="Approved" value={stats.approved} />
      <StatCard label="Rejected" value={stats.rejected} />
      <StatCard
        label="Lowest Bid"
        value={stats.lowest_bid != null ? formatCurrency(stats.lowest_bid) : '—'}
        highlight={stats.lowest_bid != null}
      />
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

async function QuotationListServer({
  companyId,
  search,
  status,
  page,
}: {
  companyId: string
  search: string
  status: string
  page: number
}) {
  const result = await getQuotations(companyId, {
    search: search || undefined,
    status: (status as QuotationStatus) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <QuotationList
      quotations={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function QuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <FileSearch className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Quotations</h1>
          <p className="text-xs text-[--color-foreground-muted]">
            Review and manage vendor quotations
          </p>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <QuotationStats companyId={companyId} />
      </Suspense>

      {/* List */}
      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <QuotationListServer
            companyId={companyId}
            search={search}
            status={status}
            page={page}
          />
        </Suspense>
      </div>
    </PageContainer>
  )
}
