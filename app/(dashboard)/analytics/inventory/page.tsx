import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Warehouse, AlertTriangle, XCircle, Package } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getInventoryAnalytics } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import { AnalyticsTable } from '@/components/analytics/analytics-table'
import { ExportButton } from '@/components/analytics/export-button'
import { HorizontalBarChart } from '@/components/analytics/analytics-charts'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inventory Analytics — VendorFlow' }

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 space-y-2">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
            <Skeleton className="h-4 w-40" /><Skeleton className="h-56 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function InventoryContent() {
  const companyId = await getCompanyId()
  const d = await getInventoryAnalytics(companyId)

  const lowStockRows = d.low_stock_products.map((p, i) => ({
    rank: i + 1,
    product: p.product_name,
    sku: p.sku,
    available: p.available,
    reorder: p.reorder_level,
  }))

  const topValueRows = d.top_products_by_value.map((p, i) => ({
    rank: i + 1,
    product: p.product_name,
    sku: p.sku,
    value: formatCurrency(p.value),
  }))

  const warehouseRows = d.by_warehouse.map((w, i) => ({
    rank: i + 1,
    warehouse: w.warehouse_name,
    value: formatCurrency(w.value),
    qty: w.qty.toFixed(2),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsKpiCard
          label="Total Inventory Value"
          value={formatCurrency(d.total_value)}
          icon={Warehouse}
          accent="cyan"
        />
        <AnalyticsKpiCard
          label="Total Products"
          value={d.total_products}
          icon={Package}
          accent="default"
          sublabel="unique SKUs in stock"
        />
        <AnalyticsKpiCard
          label="Low Stock Items"
          value={d.low_stock_count}
          icon={AlertTriangle}
          accent={d.low_stock_count > 0 ? 'amber' : 'green'}
        />
        <AnalyticsKpiCard
          label="Out of Stock"
          value={d.out_of_stock_count}
          icon={XCircle}
          accent={d.out_of_stock_count > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Stock Value by Warehouse"
          subtitle="Total inventory valuation per location"
        >
          <HorizontalBarChart
            data={d.by_warehouse.map((w) => ({ name: w.warehouse_name, value: w.value }))}
            formatter="currency"
            color="#06b6d4"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Top Products by Inventory Value"
          subtitle="Highest-value stocked products"
        >
          <HorizontalBarChart
            data={d.top_products_by_value.map((p) => ({ name: p.product_name, value: p.value }))}
            formatter="currency"
            color="#8b5cf6"
          />
        </AnalyticsChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Low Stock Products"
          subtitle="Products at or below reorder level"
          action={<ExportButton rows={lowStockRows as Record<string, unknown>[]} filename="low-stock-products" />}
        >
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Product', accessor: 'product' },
              { header: 'SKU', accessor: 'sku' },
              { header: 'Available', accessor: 'available', align: 'right' },
              { header: 'Reorder At', accessor: 'reorder', align: 'right' },
            ]}
            rows={lowStockRows}
            keyField="rank"
            emptyMessage="No low-stock products — great!"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Top Products by Value"
          subtitle="Highest inventory value items"
          action={<ExportButton rows={topValueRows as Record<string, unknown>[]} filename="top-products-by-value" />}
        >
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Product', accessor: 'product' },
              { header: 'SKU', accessor: 'sku' },
              { header: 'Value', accessor: 'value', align: 'right' },
            ]}
            rows={topValueRows}
            keyField="rank"
            emptyMessage="No inventory data yet"
          />
        </AnalyticsChartCard>
      </div>

      <AnalyticsChartCard
        title="Warehouse Inventory Summary"
        subtitle="Stock value and quantity by warehouse"
        action={<ExportButton rows={warehouseRows as Record<string, unknown>[]} filename="warehouse-inventory-summary" />}
      >
        <AnalyticsTable
          columns={[
            { header: '#', accessor: 'rank', align: 'center' },
            { header: 'Warehouse', accessor: 'warehouse' },
            { header: 'Total Value', accessor: 'value', align: 'right' },
            { header: 'Total Qty', accessor: 'qty', align: 'right' },
          ]}
          rows={warehouseRows}
          keyField="rank"
          emptyMessage="No warehouse data yet"
        />
      </AnalyticsChartCard>
    </div>
  )
}

export default async function InventoryAnalyticsPage() {
  const role = await getUserRole()
  if (!['administrator', 'admin', 'warehouse_manager'].includes(role)) {
    const { getAnalyticsDefaultPath } = await import('@/config/nav-roles')
    redirect(getAnalyticsDefaultPath(role))
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InventoryContent />
    </Suspense>
  )
}
