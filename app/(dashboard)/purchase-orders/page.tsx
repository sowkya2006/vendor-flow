import { Suspense } from 'react'
import { ShoppingCart } from 'lucide-react'
import { POList } from '@/components/purchase-orders/po-list'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { getPurchaseOrders } from '@/lib/supabase/purchase-orders'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency } from '@/lib/utils'
import type { POStatus } from '@/types/purchase-order'

// ── Stat cards ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
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

// ── List skeleton ─────────────────────────────────────────────────────────────

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
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-3 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

// ── Data-fetching inner components ────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

async function POStats({ companyId }: { companyId: string }) {
  const [all, pending, approved, inProgress] = await Promise.all([
    getPurchaseOrders(companyId, { pageSize: 1 }),
    getPurchaseOrders(companyId, { status: 'pending_approval', pageSize: 1 }),
    getPurchaseOrders(companyId, { status: 'approved', pageSize: 1 }),
    getPurchaseOrders(companyId, { status: 'in_progress', pageSize: 1 }),
  ])

  // Fetch a page of all orders to sum total_amount for a spend snapshot
  // (server-side only; replace with an RPC/aggregate when available)
  const { data: recentOrders } = await getPurchaseOrders(companyId, { pageSize: 100 })
  const totalSpend = recentOrders.reduce((sum, po) => sum + (po.total_amount ?? 0), 0)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total POs" value={all.total} />
      <StatCard label="Pending Approval" value={pending.total} sublabel="Awaiting sign-off" />
      <StatCard
        label="Active"
        value={approved.total + inProgress.total}
        sublabel="Approved or in progress"
      />
      <StatCard
        label="Total Spend"
        value={formatCurrency(totalSpend)}
        sublabel="Across visible orders"
      />
    </div>
  )
}

async function POListServer({
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
  const result = await getPurchaseOrders(companyId, {
    search: search || undefined,
    status: (status as POStatus) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <POList
      orders={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">
              Purchase Orders
            </h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Track and manage vendor purchase orders
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <POStats companyId={companyId} />
      </Suspense>

      {/* List */}
      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <POListServer
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
