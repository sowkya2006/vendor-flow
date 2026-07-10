import type { Metadata } from 'next'
import { Suspense } from 'react'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import {
  ProcurementSpendChart,
  PurchaseTrendChart,
  VendorCategoriesChart,
  RfqStatusChart,
} from '@/components/dashboard/charts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import {
  RecentVendorsTable,
  RecentRfqsTable,
  RecentPurchaseOrdersTable,
} from '@/components/dashboard/data-tables'
import { NotificationsPanel } from '@/components/dashboard/notifications-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { CalendarWidget } from '@/components/dashboard/calendar-widget'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { QuotationStatsWidget } from '@/components/dashboard/quotation-stats-widget'
import { ApprovalStatsWidget } from '@/components/dashboard/approval-stats-widget'
import { RoleDashboardRouter } from '@/components/dashboard/role-dashboard-router'
import { Skeleton } from '@/components/shared/loading-states'

export const metadata: Metadata = { title: 'Dashboard — VendorFlow' }

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[240px] w-full" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
      <div className="border-b border-[--color-border] px-5 py-4 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
      <div className="border-b border-[--color-border] px-5 py-4">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-lg mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-52" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuotationStatsSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3.5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalStatsSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3.5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-full">
      <DashboardHeader />

      <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
        {/* KPI Cards — live data */}
        <Suspense fallback={<KpiSkeleton />}>
          <KpiGrid />
        </Suspense>

        {/* Quick Actions */}
        <QuickActions />

        {/* Role-contextual quick links */}
        <RoleDashboardRouter />

        {/* Quotation Stats — live data */}
        <Suspense fallback={<QuotationStatsSkeleton />}>
          <QuotationStatsWidget />
        </Suspense>

        {/* Approval Stats — live data */}
        <Suspense fallback={<ApprovalStatsSkeleton />}>
          <ApprovalStatsWidget />
        </Suspense>

        {/* Charts — 2 columns, live data */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <ProcurementSpendChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <PurchaseTrendChart />
          </Suspense>
        </div>

        {/* Pie / Donut + Notifications — live data */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Suspense fallback={<ChartSkeleton />}>
            <VendorCategoriesChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <RfqStatusChart />
          </Suspense>
          <Suspense fallback={<PanelSkeleton />}>
            <NotificationsPanel />
          </Suspense>
        </div>

        {/* Activity + Calendar — live data */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<PanelSkeleton />}>
              <RecentActivity />
            </Suspense>
          </div>
          <Suspense fallback={<PanelSkeleton />}>
            <CalendarWidget />
          </Suspense>
        </div>

        {/* Tables — live data */}
        <Suspense fallback={<TableSkeleton />}>
          <RecentVendorsTable />
        </Suspense>

        <div className="grid gap-5 lg:grid-cols-2">
          <Suspense fallback={<TableSkeleton />}>
            <RecentRfqsTable />
          </Suspense>
          <Suspense fallback={<TableSkeleton />}>
            <RecentPurchaseOrdersTable />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
