import { Suspense } from 'react'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { EmptyState } from '@/components/shared/loading-states'
import { ProductStatusBadge } from '@/components/inventory/stock-status-badge'
import { getProducts, getProductCategories } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ProductStatus } from '@/types/inventory'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; category_id?: string; page?: string }>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{value}</p>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] space-y-2">
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
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

async function ProductStats({ companyId }: { companyId: string }) {
  const [all, active, inactive, discontinued] = await Promise.all([
    getProducts(companyId, { pageSize: 1 }),
    getProducts(companyId, { status: 'active', pageSize: 1 }),
    getProducts(companyId, { status: 'inactive', pageSize: 1 }),
    getProducts(companyId, { status: 'discontinued', pageSize: 1 }),
  ])
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total Products" value={all.total} />
      <StatCard label="Active" value={active.total} />
      <StatCard label="Inactive" value={inactive.total} />
      <StatCard label="Discontinued" value={discontinued.total} />
    </div>
  )
}

async function ProductList({
  companyId,
  search,
  status,
  category_id,
  page,
}: {
  companyId: string
  search: string
  status: string
  category_id: string
  page: number
}) {
  const result = await getProducts(companyId, {
    search: search || undefined,
    status: (status as ProductStatus) || undefined,
    category_id: category_id || undefined,
    page,
    pageSize: 20,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8" />}
        title="No products found"
        description={search || status ? 'Try adjusting your filters.' : 'Add your first product to start managing inventory.'}
        action={
          !search && !status ? (
            <Button asChild><Link href="/products/new"><Plus className="h-4 w-4 mr-1" />New Product</Link></Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">{result.total} product{result.total !== 1 ? 's' : ''} found</p>
      <div className="space-y-2">
        {result.data.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                {product.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                SKU: {product.sku}
                {product.category ? ` · ${product.category.name}` : ''}
              </p>
            </div>
            <ProductStatusBadge status={product.status} className="hidden sm:inline-flex" />
            <div className="hidden md:block text-xs font-medium text-[--color-foreground]">
              {formatCurrency(product.unit_cost)} / {product.unit}
            </div>
            {product.preferred_vendor && (
              <div className="hidden lg:block text-xs text-[--color-foreground-muted] truncate max-w-[140px]">
                {product.preferred_vendor.name}
              </div>
            )}
          </Link>
        ))}
      </div>
      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? <Link href={`/products?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage ? <Link href={`/products?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const category_id = params.category_id ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Products</h1>
            <p className="text-xs text-[--color-foreground-muted]">Manage your product catalog</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/products/new"><Plus className="h-4 w-4 mr-1" />New Product</Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <ProductStats companyId={companyId} />
      </Suspense>

      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <ProductList companyId={companyId} search={search} status={status} category_id={category_id} page={page} />
        </Suspense>
      </div>
    </PageContainer>
  )
}
