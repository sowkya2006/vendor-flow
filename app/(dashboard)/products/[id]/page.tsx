import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, Pencil, ArrowLeft, Warehouse, BarChart2 } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { ProductStatusBadge, StockStatusBadge } from '@/components/inventory/stock-status-badge'
import { getProductById, getInventoryByProduct, getWarehouses } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [product, inventoryRecords, warehouses] = await Promise.all([
    getProductById(id, companyId),
    getInventoryByProduct(id, companyId),
    getWarehouses(companyId, true),
  ])

  if (!product) notFound()

  const totalOnHand = inventoryRecords.reduce((s, r) => s + r.quantity_on_hand, 0)
  const totalAvailable = inventoryRecords.reduce((s, r) => s + r.quantity_available, 0)
  const totalValue = inventoryRecords.reduce((s, r) => s + r.valuation, 0)
  const defaultWarehouse = warehouses.find((w) => w.is_default)

  return (
    <PageContainer>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/products" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[--color-foreground]">{product.name}</h1>
                <ProductStatusBadge status={product.status} />
              </div>
              <p className="text-xs text-[--color-foreground-muted]">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdjustStockDialog
              productId={product.id}
              productName={product.name}
              warehouses={warehouses}
              defaultWarehouseId={defaultWarehouse?.id}
            />
            <Button asChild size="sm">
              <Link href={`/products/${product.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock summary */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">Stock Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'On Hand', value: `${totalOnHand} ${product.unit}` },
                { label: 'Available', value: `${totalAvailable} ${product.unit}` },
                { label: 'Total Value', value: formatCurrency(totalValue) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-[--color-background-subtle] px-4 py-3 text-center">
                  <p className="text-xs text-[--color-foreground-muted]">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-[--color-foreground]">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <StockStatusBadge
                available={totalAvailable}
                reorderLevel={product.reorder_level}
                maxStock={product.max_stock_level}
              />
              {totalAvailable <= product.reorder_level && totalAvailable > 0 && (
                <p className="text-xs text-amber-600">Below reorder level ({product.reorder_level} {product.unit})</p>
              )}
            </div>
          </div>

          {/* Warehouse breakdown */}
          {inventoryRecords.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-4 text-sm font-semibold text-[--color-foreground] flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Warehouse Breakdown
              </h2>
              <div className="space-y-2">
                {inventoryRecords.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg bg-[--color-background-subtle] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[--color-foreground]">
                        {(rec.warehouse as { name: string } | undefined)?.name ?? '—'}
                      </p>
                      <p className="text-xs text-[--color-foreground-muted]">
                        Reserved: {rec.quantity_reserved} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[--color-foreground]">{rec.quantity_available} {product.unit}</p>
                      <p className="text-xs text-[--color-foreground-muted]">{formatCurrency(rec.valuation)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Description</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>

        {/* Right: metadata */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Details</h2>
            {[
              { label: 'Category', value: product.category?.name ?? '—' },
              { label: 'Unit', value: product.unit },
              { label: 'Unit Cost', value: formatCurrency(product.unit_cost) },
              { label: 'Preferred Vendor', value: product.preferred_vendor?.name ?? '—' },
              { label: 'Lead Time', value: product.lead_time_days ? `${product.lead_time_days} days` : '—' },
              { label: 'Min Stock', value: `${product.min_stock_level} ${product.unit}` },
              { label: 'Reorder At', value: `${product.reorder_level} ${product.unit}` },
              { label: 'Max Stock', value: product.max_stock_level ? `${product.max_stock_level} ${product.unit}` : 'Unlimited' },
              { label: 'Created', value: formatDate(product.created_at) },
              { label: 'Updated', value: formatDate(product.updated_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-[--color-foreground-muted] shrink-0">{label}</span>
                <span className="text-right font-medium text-[--color-foreground]">{value}</span>
              </div>
            ))}
          </div>

          {product.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/inventory/transactions?product_id=${product.id}`}>
                <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                View Stock History
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
