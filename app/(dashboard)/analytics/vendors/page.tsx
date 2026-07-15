import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getVendorAnalytics } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import { AnalyticsTable } from '@/components/analytics/analytics-table'
import { ExportButton } from '@/components/analytics/export-button'
import { DonutChart, HorizontalBarChart } from '@/components/analytics/analytics-charts'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Vendor Analytics — VendorFlow' }

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

async function VendorContent() {
  const companyId = await getCompanyId()
  const d = await getVendorAnalytics(companyId)

  const topSpendRows = d.top_by_spend.map((v, i) => ({ rank: i + 1, vendor: v.vendor_name, spend: formatCurrency(v.spend) }))
  const topOrderRows = d.top_by_orders.map((v, i) => ({ rank: i + 1, vendor: v.vendor_name, orders: v.orders }))
  const topQuoteRows = d.top_by_quotations.map((v, i) => ({ rank: i + 1, vendor: v.vendor_name, quotations: v.quotations }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsKpiCard label="Total Vendors" value={d.total} icon={Building2} accent="blue" />
        <AnalyticsKpiCard label="Active" value={d.active} icon={CheckCircle2} accent="green" />
        <AnalyticsKpiCard label="Pending" value={d.pending} icon={Clock} accent={d.pending > 0 ? 'amber' : 'green'} />
        <AnalyticsKpiCard label="Inactive / Suspended" value={d.inactive + d.suspended} icon={XCircle} accent={d.inactive + d.suspended > 0 ? 'red' : 'green'} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="Vendor Category Distribution" subtitle="Breakdown by category">
          <DonutChart data={d.by_category} innerRadius={0} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Top Vendors by Spend" subtitle="Vendors with highest total payments">
          <HorizontalBarChart
            data={d.top_by_spend.map((v) => ({ name: v.vendor_name, value: v.spend }))}
            formatter="currency"
            color="#4350ed"
          />
        </AnalyticsChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="Top Vendors by Orders" subtitle="Most purchase orders placed">
          <HorizontalBarChart
            data={d.top_by_orders.map((v) => ({ name: v.vendor_name, value: v.orders }))}
            color="#8b5cf6"
          />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Top Vendors by Quotations" subtitle="Most quotations submitted">
          <HorizontalBarChart
            data={d.top_by_quotations.map((v) => ({ name: v.vendor_name, value: v.quotations }))}
            color="#22c55e"
          />
        </AnalyticsChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-3">
        <AnalyticsChartCard title="Top by Spend" action={<ExportButton rows={topSpendRows as Record<string, unknown>[]} filename="vendors-by-spend" />}>
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Spend', accessor: 'spend', align: 'right' },
            ]}
            rows={topSpendRows}
            keyField="rank"
            emptyMessage="No data"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard title="Top by Orders" action={<ExportButton rows={topOrderRows as Record<string, unknown>[]} filename="vendors-by-orders" />}>
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Orders', accessor: 'orders', align: 'right' },
            ]}
            rows={topOrderRows}
            keyField="rank"
            emptyMessage="No data"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard title="Top by Quotations" action={<ExportButton rows={topQuoteRows as Record<string, unknown>[]} filename="vendors-by-quotations" />}>
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Quotes', accessor: 'quotations', align: 'right' },
            ]}
            rows={topQuoteRows}
            keyField="rank"
            emptyMessage="No data"
          />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

export default async function VendorAnalyticsPage() {
  const role = await getUserRole()
  if (!['administrator', 'admin', 'procurement_manager', 'procurement_officer'].includes(role)) {
    const { getAnalyticsDefaultPath } = await import('@/config/nav-roles')
    redirect(getAnalyticsDefaultPath(role))
  }
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <VendorContent />
    </Suspense>
  )
}
