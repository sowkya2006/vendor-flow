import { Suspense } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { GrnStatusBadge } from '@/components/inventory/stock-status-badge'
import { getGrns } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { GrnStatus } from '@/types/inventory'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
          <Skeleton className="h-3 w-24 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  )
}

async function GrnStats({ companyId }: { companyId: string }) {
  const [all, draft, completed] = await Promise.all([
    getGrns(companyId, { pageSize: 1 }),
    getGrns(companyId, { status: 'draft', pageSize: 1 }),
    getGrns(companyId, { status: 'completed', pageSize: 1 }),
  ])
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Total GRNs', value: all.total },
        { label: 'Draft', value: draft.total },
        { label: 'Completed', value: completed.total },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
          <p className="text-xs font-medium text-[--color-foreground-muted]">{s.label}</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{s.value}</p>
        </div>
      ))}
    </div>
  )
}

async function GrnList({
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
  const result = await getGrns(companyId, {
    search: search || undefined,
    status: (status as GrnStatus) || undefined,
    page,
    pageSize: 20,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="No goods receipts found"
        description={search || status ? 'Try adjusting your filters.' : 'Create a GRN when you receive goods from a supplier.'}
        action={
          !search && !status ? (
            <Button asChild><Link href="/inventory/grn/new"><Plus className="h-4 w-4 mr-1" />New GRN</Link></Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">
        {result.total} receipt{result.total !== 1 ? 's' : ''}
      </p>
      <div className="space-y-2">
        {result.data.map((grn) => (
          <Link
            key={grn.id}
            href={`/inventory/grn/${grn.id}`}
            className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                {grn.grn_number}
              </p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                {(grn.warehouse as { name: string } | undefined)?.name ?? '—'}
                {grn.purchase_order ? ` · ${(grn.purchase_order as { po_number: string }).po_number}` : ''}
              </p>
            </div>
            <GrnStatusBadge status={grn.status} className="hidden sm:inline-flex shrink-0" />
            <div className="hidden md:block text-xs text-[--color-foreground-muted] shrink-0">
              {formatDate(grn.received_date)}
            </div>
          </Link>
        ))}
      </div>

      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? <Link href={`/inventory/grn?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage ? <Link href={`/inventory/grn?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function GrnListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
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
            <h1 className="text-xl font-semibold text-[--color-foreground]">Goods Received Notes</h1>
            <p className="text-xs text-[--color-foreground-muted]">Track incoming stock receipts</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventory/grn/new"><Plus className="h-4 w-4 mr-1" />New GRN</Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <GrnStats companyId={companyId} />
      </Suspense>

      {/* Status filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(['', 'draft', 'completed', 'cancelled'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={`/inventory/grn${s ? `?status=${s}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === s
                ? 'bg-[--color-primary] text-white'
                : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Suspense fallback={<ListSkeleton />}>
          <GrnList companyId={companyId} search={search} status={status} page={page} />
        </Suspense>
      </div>
    </PageContainer>
  )
}
