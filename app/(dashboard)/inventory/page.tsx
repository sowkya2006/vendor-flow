import { Suspense } from 'react'
import Link from 'next/link'
import { Warehouse, ClipboardList, ArrowRight, TrendingDown, XCircle } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { EmptyState } from '@/components/shared/loading-states'
import { StockStatusBadge } from '@/components/inventory/stock-status-badge'
import { InventoryStatsCards } from '@/components/inventory/inventory-stats'
import { getInventory, getInventoryStats, getWarehouses } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ warehouse_id?: string; filter?: string; page?: string }>
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
          <Skeleton className="h-3 w-16 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

async function StatsServer({ companyId }: { companyId: string }) {
  const stats = await getInventoryStats(companyId)
  return <InventoryStatsCards stats={stats} />
}

async function InventoryList({
  companyId,
  warehouseId,
  filter,
  page,
}: {
  companyId: string
  warehouseId: string
  filter: string
  page: number
}) {
  const result = await getInventory(companyId, {
    warehouse_id: warehouseId || undefined,
    low_stock: filter === 'low_stock',
    out_of_stock: filter === 'out_of_stock',
    page,
    pageSize: 20,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Warehouse className="h-8 w-8" />}
        title="No inventory records"
        description="Add products and receive goods via GRN to see stock levels here."
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/products/new">Add Product</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/inventory/grn/new">Create GRN</Link>
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">
        {result.total} stock record{result.total !== 1 ? 's' : ''}
      </p>
      <div className="space-y-2">
        {result.data.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.product_id}`}
            className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <Warehouse className="h-4 w-4" />
            </div>

            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                {item.product.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                {item.product.sku} · {item.warehouse.name}
              </p>
            </div>

            {/* Stock status */}
            <StockStatusBadge
              available={item.quantity_available}
              reorderLevel={item.product.reorder_level}
              className="hidden sm:inline-flex shrink-0"
            />

            {/* Qty on hand */}
            <div className="hidden md:block text-right shrink-0">
              <p className="text-sm font-semibold text-[--color-foreground]">
                {item.quantity_available} {item.product.unit}
              </p>
              <p className="text-xs text-[--color-foreground-muted]">available</p>
            </div>

            {/* Valuation */}
            <div className="hidden lg:block text-right shrink-0 min-w-[90px]">
              <p className="text-xs font-medium text-[--color-foreground]">
                {formatCurrency(item.valuation)}
              </p>
              <p className="text-xs text-[--color-foreground-muted]">value</p>
            </div>
          </Link>
        ))}
      </div>

      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1
              ? <Link href={`/inventory?page=${page - 1}${warehouseId ? `&warehouse_id=${warehouseId}` : ''}${filter ? `&filter=${filter}` : ''}`}>Previous</Link>
              : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage
              ? <Link href={`/inventory?page=${page + 1}${warehouseId ? `&warehouse_id=${warehouseId}` : ''}${filter ? `&filter=${filter}` : ''}`}>Next</Link>
              : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

async function WarehouseFilter({ companyId, current }: { companyId: string; current: string }) {
  const warehouses = await getWarehouses(companyId, true)
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/inventory"
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!current ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}
      >
        All Warehouses
      </Link>
      {warehouses.map((w) => (
        <Link
          key={w.id}
          href={`/inventory?warehouse_id=${w.id}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${current === w.id ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}
        >
          {w.name}
        </Link>
      ))}
    </div>
  )
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const warehouseId = params.warehouse_id ?? ''
  const filter = params.filter ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Inventory</h1>
            <p className="text-xs text-[--color-foreground-muted]">Real-time stock levels across all warehouses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory/warehouses">
              <Warehouse className="h-3.5 w-3.5 mr-1.5" />
              Warehouses
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inventory/grn/new">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              New GRN
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsServer companyId={companyId} />
      </Suspense>

      {/* Quick action links */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/inventory?filter=low_stock', label: 'Low Stock', icon: <TrendingDown className="h-4 w-4" />, active: filter === 'low_stock' },
          { href: '/inventory?filter=out_of_stock', label: 'Out of Stock', icon: <XCircle className="h-4 w-4" />, active: filter === 'out_of_stock' },
          { href: '/inventory/grn', label: 'GRN History', icon: <ClipboardList className="h-4 w-4" />, active: false },
          { href: '/inventory/transactions', label: 'Transactions', icon: <ArrowRight className="h-4 w-4" />, active: false },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              item.active
                ? 'border-[--color-primary] bg-[--color-primary]/10 text-[--color-primary]'
                : 'border-[--color-border] bg-[--color-card] text-[--color-foreground-muted] hover:border-[--color-primary]/50 hover:text-[--color-foreground]'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Warehouse filter */}
      <div className="mt-5">
        <Suspense fallback={<Skeleton className="h-7 w-64" />}>
          <WarehouseFilter companyId={companyId} current={warehouseId} />
        </Suspense>
      </div>

      {/* Stock list */}
      <div className="mt-4">
        <Suspense fallback={<ListSkeleton />}>
          <InventoryList companyId={companyId} warehouseId={warehouseId} filter={filter} page={page} />
        </Suspense>
      </div>
    </PageContainer>
  )
}
