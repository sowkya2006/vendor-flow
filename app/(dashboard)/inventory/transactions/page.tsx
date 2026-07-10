import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { TransactionTypeBadge } from '@/components/inventory/stock-status-badge'
import { getInventoryTransactions, getWarehouses, getProducts } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{
    product_id?: string
    warehouse_id?: string
    transaction_type?: string
    page?: string
  }>
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
          <Skeleton className="h-4 w-16 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

async function TransactionList({
  companyId,
  productId,
  warehouseId,
  transactionType,
  page,
}: {
  companyId: string
  productId: string
  warehouseId: string
  transactionType: string
  page: number
}) {
  const result = await getInventoryTransactions(companyId, {
    product_id: productId || undefined,
    warehouse_id: warehouseId || undefined,
    transaction_type: transactionType || undefined,
    page,
    pageSize: 30,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="h-8 w-8" />}
        title="No transactions found"
        description="Stock movements will appear here when you adjust inventory or complete GRNs."
      />
    )
  }

  const buildHref = (p: number) => {
    const parts: string[] = [`page=${p}`]
    if (productId) parts.push(`product_id=${productId}`)
    if (warehouseId) parts.push(`warehouse_id=${warehouseId}`)
    if (transactionType) parts.push(`transaction_type=${transactionType}`)
    return `/inventory/transactions?${parts.join('&')}`
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">
        {result.total} transaction{result.total !== 1 ? 's' : ''}
      </p>

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
        <div className="divide-y divide-[--color-border]">
          {result.data.map((tx) => {
            const isPositive = tx.quantity > 0
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                {/* Type badge */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-background-subtle]">
                  <ArrowLeftRight className="h-4 w-4 text-[--color-foreground-muted]" />
                </div>

                {/* Product + warehouse */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[--color-foreground]">
                    {tx.product?.name ?? '—'}
                    <span className="ml-1.5 text-xs font-normal text-[--color-foreground-muted]">
                      ({tx.product?.sku ?? '—'})
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                    {tx.warehouse?.name ?? '—'} · {formatDate(tx.created_at)}
                    {tx.notes ? ` · ${tx.notes}` : ''}
                  </p>
                </div>

                {/* Type */}
                <TransactionTypeBadge type={tx.transaction_type} className="hidden sm:inline-flex shrink-0" />

                {/* Quantity delta */}
                <div className="hidden md:block text-right shrink-0 min-w-[80px]">
                  <p className={cn('text-sm font-bold', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                    {isPositive ? '+' : ''}{tx.quantity}
                  </p>
                  <p className="text-xs text-[--color-foreground-muted]">
                    {tx.quantity_before} → {tx.quantity_after}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? <Link href={buildHref(page - 1)}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage ? <Link href={buildHref(page + 1)}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

const TX_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'stock_in', label: 'Stock In' },
  { value: 'stock_out', label: 'Stock Out' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'grn', label: 'GRN Receipt' },
  { value: 'reservation', label: 'Reservation' },
  { value: 'reservation_release', label: 'Release' },
]

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const productId = params.product_id ?? ''
  const warehouseId = params.warehouse_id ?? ''
  const transactionType = params.transaction_type ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  // Load warehouses for filter bar
  const warehouses = await getWarehouses(companyId, true)

  const buildFilterHref = (key: string, value: string) => {
    const parts: string[] = []
    if (key !== 'product_id' && productId) parts.push(`product_id=${productId}`)
    if (key !== 'warehouse_id' && warehouseId) parts.push(`warehouse_id=${warehouseId}`)
    if (key !== 'transaction_type' && transactionType) parts.push(`transaction_type=${transactionType}`)
    if (value) parts.push(`${key}=${value}`)
    return `/inventory/transactions${parts.length ? '?' + parts.join('&') : ''}`
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Stock Transactions</h1>
            <p className="text-xs text-[--color-foreground-muted]">Full audit trail of all inventory movements</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Transaction type pills */}
        <div className="flex flex-wrap gap-2">
          {TX_TYPES.map(({ value, label }) => (
            <Link
              key={value || 'all'}
              href={buildFilterHref('transaction_type', value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                transactionType === value
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Warehouse filter */}
        {warehouses.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFilterHref('warehouse_id', '')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !warehouseId
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
              }`}
            >
              All Warehouses
            </Link>
            {warehouses.map((w) => (
              <Link
                key={w.id}
                href={buildFilterHref('warehouse_id', w.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  warehouseId === w.id
                    ? 'bg-[--color-primary] text-white'
                    : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
                }`}
              >
                {w.name}
              </Link>
            ))}
          </div>
        )}

        {/* Active filters summary */}
        {productId && (
          <p className="text-xs text-[--color-foreground-muted]">
            Filtered by product ·{' '}
            <Link href={buildFilterHref('product_id', '')} className="text-[--color-primary] hover:underline">
              Clear
            </Link>
          </p>
        )}
      </div>

      <div className="mt-4">
        <Suspense fallback={<ListSkeleton />}>
          <TransactionList
            companyId={companyId}
            productId={productId}
            warehouseId={warehouseId}
            transactionType={transactionType}
            page={page}
          />
        </Suspense>
      </div>
    </PageContainer>
  )
}
