import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getApprovalAnalytics } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import { ExportButton } from '@/components/analytics/export-button'
import { CountBarChart, DonutChart } from '@/components/analytics/analytics-charts'
import { AnalyticsTable } from '@/components/analytics/analytics-table'
import { Skeleton } from '@/components/shared/loading-states'

export const metadata: Metadata = { title: 'Approval Analytics — VendorFlow' }

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

async function ApprovalContent() {
  const companyId = await getCompanyId()
  const d = await getApprovalAnalytics(companyId)

  const summaryRows = d.by_status.map((s) => ({
    status: s.name,
    count: s.value,
    pct: d.total > 0 ? `${((s.value / d.total) * 100).toFixed(1)}%` : '0%',
  }))

  const typeRows = d.by_type.map((t) => ({
    type: t.name,
    count: t.value,
    pct: d.total > 0 ? `${((t.value / d.total) * 100).toFixed(1)}%` : '0%',
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnalyticsKpiCard
          label="Total Requests"
          value={d.total}
          icon={ClipboardList}
          accent="default"
        />
        <AnalyticsKpiCard
          label="Pending"
          value={d.pending}
          icon={Clock}
          accent={d.pending > 0 ? 'amber' : 'green'}
        />
        <AnalyticsKpiCard
          label="Approved"
          value={d.approved}
          icon={CheckCircle2}
          accent="green"
        />
        <AnalyticsKpiCard
          label="Completion Rate"
          value={`${d.completion_rate}%`}
          icon={XCircle}
          accent={d.completion_rate >= 80 ? 'green' : d.completion_rate >= 50 ? 'amber' : 'red'}
          sublabel={`${d.rejected} rejected`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Monthly Approval Requests"
          subtitle="Requests created per month (last 12 months)"
        >
          <CountBarChart data={d.monthly_requests} label="Requests" color="#8b5cf6" />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Approval Status Distribution"
          subtitle="Breakdown by current status"
        >
          <DonutChart data={d.by_status} innerRadius={52} />
        </AnalyticsChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Approvals by Request Type"
          subtitle="Distribution across different approval types"
        >
          <DonutChart data={d.by_type} innerRadius={0} />
        </AnalyticsChartCard>

        {/* Completion rate visual */}
        <AnalyticsChartCard
          title="Approval Performance"
          subtitle="Resolution summary"
        >
          <div className="space-y-4 pt-2">
            {[
              { label: 'Approved / Completed', value: d.approved, color: '#22c55e' },
              { label: 'Pending', value: d.pending, color: '#f59e0b' },
              { label: 'Rejected', value: d.rejected, color: '#ef4444' },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[--color-foreground-muted]">{item.label}</span>
                  <span className="font-semibold text-[--color-foreground] tabular-nums">
                    {item.value}
                    {d.total > 0 && (
                      <span className="ml-1 text-[--color-foreground-subtle]">
                        ({((item.value / d.total) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[--color-muted] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: d.total > 0 ? `${(item.value / d.total) * 100}%` : '0%',
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard
          title="Status Breakdown"
          action={<ExportButton rows={summaryRows as Record<string, unknown>[]} filename="approval-status-breakdown" />}
        >
          <AnalyticsTable
            columns={[
              { header: 'Status', accessor: 'status' },
              { header: 'Count', accessor: 'count', align: 'right' },
              { header: 'Share', accessor: 'pct', align: 'right' },
            ]}
            rows={summaryRows}
            keyField="status"
            emptyMessage="No approval data yet"
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="By Request Type"
          action={<ExportButton rows={typeRows as Record<string, unknown>[]} filename="approval-by-type" />}
        >
          <AnalyticsTable
            columns={[
              { header: 'Type', accessor: 'type' },
              { header: 'Count', accessor: 'count', align: 'right' },
              { header: 'Share', accessor: 'pct', align: 'right' },
            ]}
            rows={typeRows}
            keyField="type"
            emptyMessage="No approval data yet"
          />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

export default async function ApprovalAnalyticsPage() {
  const role = await getUserRole()
  if (!['administrator', 'admin', 'procurement_manager'].includes(role)) {
    const { getAnalyticsDefaultPath } = await import('@/config/nav-roles')
    redirect(getAnalyticsDefaultPath(role))
  }
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApprovalContent />
    </Suspense>
  )
}
