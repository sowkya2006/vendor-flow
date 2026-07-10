import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Receipt, TrendingDown, CheckCircle2, CreditCard } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getFinanceAnalytics } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import { AnalyticsTable } from '@/components/analytics/analytics-table'
import { ExportButton } from '@/components/analytics/export-button'
import { SpendLineChart, DonutChart, HorizontalBarChart } from '@/components/analytics/analytics-charts'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Finance Analytics — VendorFlow' }

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

async function FinanceContent() {
  const companyId = await getCompanyId()
  const d = await getFinanceAnalytics(companyId)

  const vendorOutstandingRows = d.vendor_outstanding.map((v, i) => ({
    rank: i + 1,
    vendor: v.vendor_name,
    outstanding: formatCurrency(v.outstanding),
  }))

  const agingRows = d.aging.map((a) => ({
    period: a.label,
    invoices: a.count,
    amount: formatCurrency(a.amount),
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsKpiCard
          label="Total Invoiced"
          value={formatCurrency(d.total_invoiced)}
          icon={Receipt}
          accent="default"
          sublabel={`${d.total_invoices} invoices`}
        />
        <AnalyticsKpiCard
          label="Total Paid"
          value={formatCurrency(d.total_paid)}
          icon={CheckCircle2}
          accent="green"
        />
        <AnalyticsKpiCard
          label="Outstanding"
          value={formatCurrency(d.outstanding)}
          icon={TrendingDown}
          accent={d.outstanding > 0 ? 'red' : 'green'}
        />
        <AnalyticsKpiCard
          label="Avg Invoice Value"
          value={formatCurrency(d.avg_invoice_value)}
          icon={CreditCard}
          accent="cyan"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Monthly Payments"
          subtitle="Total payments recorded per month (last 12 months)"
        >
          <SpendLineChart data={d.monthly_payments} color="#22c55e" label="Paid" />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Invoice Status Distribution"
          subtitle="Breakdown by current status"
        >
          <DonutChart data={d.by_status} innerRadius={52} />
        </AnalyticsChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Vendor Outstanding Balances"
          subtitle="Vendors with highest unpaid invoice totals"
        >
          <HorizontalBarChart
            data={d.vendor_outstanding.map((v) => ({ name: v.vendor_name, value: v.outstanding }))}
            formatter="currency"
            color="#ef4444"
          />
        </AnalyticsChartCard>

        {/* Aging visual */}
        <AnalyticsChartCard
          title="Accounts Payable Aging"
          subtitle="Outstanding amounts by days past due"
        >
          <HorizontalBarChart
            data={d.aging.map((a) => ({ name: a.label, value: a.amount }))}
            formatter="currency"
            color="#f59e0b"
          />
        </AnalyticsChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Vendor Outstanding Balances"
          subtitle="Ranked by outstanding amount"
          action={<ExportButton rows={vendorOutstandingRows as Record<string, unknown>[]} filename="vendor-outstanding-balances" />}
        >
          <AnalyticsTable
            columns={[
              { header: '#', accessor: 'rank', align: 'center' },
              { header: 'Vendor', accessor: 'vendor' },
              { header: 'Outstanding', accessor: 'outstanding', align: 'right' },
            ]}
            rows={vendorOutstandingRows}
            keyField="rank"
            emptyMessage="No outstanding balances"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Invoice Aging Report"
          subtitle="Overdue invoice buckets"
          action={<ExportButton rows={agingRows as Record<string, unknown>[]} filename="invoice-aging-report" />}
        >
          <AnalyticsTable
            columns={[
              { header: 'Period', accessor: 'period' },
              { header: 'Invoices', accessor: 'invoices', align: 'center' },
              { header: 'Amount', accessor: 'amount', align: 'right' },
            ]}
            rows={agingRows}
            keyField="period"
            emptyMessage="No aging data"
          />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

export default function FinanceAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FinanceContent />
    </Suspense>
  )
}
