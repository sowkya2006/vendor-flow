import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ShoppingCart, DollarSign, TrendingUp, Building2 } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getProcurementAnalytics } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import { AnalyticsTable } from '@/components/analytics/analytics-table'
import { ExportButton } from '@/components/analytics/export-button'
import {
  SpendLineChart,
  CountBarChart,
  DonutChart,
  HorizontalBarChart,
} from '@/components/analytics/analytics-charts'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Procurement Analytics — VendorFlow' }

function SkeletonGrid() {
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

async function ProcurementContent() {
  const companyId = await getCompanyId()
  const d = await getProcurementAnalytics(companyId)

  const topSpendRows = d.top_vendors_by_spend.map((v, i) => ({
    rank: i + 1,
    vendor: v.vendor_name,
    spend: formatCurrency(v.spend),
  }))

  const topOrderRows = d.top_vendors_by_orders.map((v, i) => ({
    rank: i + 1,
    vendor: v.vendor_name,
    orders: v.orders,
  }))

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsKpiCard label="Avg PO Value" value={formatCurrency(d.avg_po_value)} icon={DollarSign} accent="cyan" />
        <AnalyticsKpiCard label="PO Statuses" value={d.po_by_status.length} icon={ShoppingCart} accent="default" sublabel="distinct statuses" />
        <AnalyticsKpiCard label="Top Vendor (Spend)" value={d.top_vendors_by_spend[0]?.vendor_name ?? '—'} icon={Building2} accent="blue" />
        <AnalyticsKpiCard label="Top Vendor (Orders)" value={d.top_vendors_by_orders[0]?.vendor_name ?? '—'} icon={TrendingUp} accent="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="Monthly Procurement Spend" subtitle="Payments recorded per month (last 12 months)">
          <SpendLineChart data={d.monthly_spend} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Purchase Orders by Month" subtitle="POs created per month (last 12 months)">
          <CountBarChart data={d.monthly_po_count} label="POs" color="#8b5cf6" />
        </AnalyticsChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="PO Status Distribution" subtitle="Current status of all purchase orders">
          <DonutChart data={d.po_by_status} innerRadius={52} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Top Vendors by Spend" subtitle="Vendors ranked by total payments made">
          <HorizontalBarChart
            data={d.top_vendors_by_spend.map((v) => ({ name: v.vendor_name, value: v.spend }))}
            formatter="currency"
          />
        </AnalyticsChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Top Vendors by Spend"
          subtitle="Ranked by total payment amount"
          action={
            <ExportButton
              rows={topSpendRows as Record<string, unknown>[]}
              filename="top-vendors-by-spend"
            />
          }
        >
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Total Spend', accessor: 'spend', align: 'right' },
            ]}
            rows={topSpendRows}
            keyField="rank"
            emptyMessage="No payment data yet"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Top Vendors by Orders"
          subtitle="Ranked by number of purchase orders"
          action={
            <ExportButton
              rows={topOrderRows as Record<string, unknown>[]}
              filename="top-vendors-by-orders"
            />
          }
        >
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Orders', accessor: 'orders', align: 'right' },
            ]}
            rows={topOrderRows}
            keyField="rank"
            emptyMessage="No purchase order data yet"
          />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

export default function ProcurementAnalyticsPage() {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <ProcurementContent />
    </Suspense>
  )
}
