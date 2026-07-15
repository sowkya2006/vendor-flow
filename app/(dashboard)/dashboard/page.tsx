import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getPreviewRole } from '@/app/actions/role-preview'

// Role-specific dashboards
import { ProcurementOfficerDashboard } from '@/components/dashboard/role-dashboards/procurement-officer-dashboard'
import { ProcurementManagerDashboard } from '@/components/dashboard/role-dashboards/procurement-manager-dashboard'
import { WarehouseManagerDashboard } from '@/components/dashboard/role-dashboards/warehouse-manager-dashboard'
import { FinanceManagerDashboard } from '@/components/dashboard/role-dashboards/finance-manager-dashboard'

// Premium glass dashboard components
import { GlassDashboardHeader } from '@/components/dashboard/glass-dashboard-header'
import { GlassKpiGrid } from '@/components/dashboard/glass-kpi-grid'
import { GlassQuickActions } from '@/components/dashboard/glass-quick-actions'
import { GlassActivityFeed } from '@/components/dashboard/glass-activity-feed'
import { GlassRecentTable } from '@/components/dashboard/glass-recent-table'
import { ProcurementWorkflow } from '@/components/dashboard/procurement-workflow'
import {
  GlassSpendChart,
  GlassProcurementDonut,
  GlassVendorPerformance,
  GlassInventoryHealth,
} from '@/components/dashboard/glass-charts'
import { Skeleton } from '@/components/shared/loading-states'

export const metadata: Metadata = { title: 'Dashboard — VendorFlow' }

function GlassSkeleton({ h = 'h-40' }: { h?: string }) {
  return (
    <div
      className={`${h} rounded-2xl animate-pulse`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  )
}

function AdminDashboard() {
  return (
    <div className="dash-dark relative min-h-full">
      <div className="relative z-10 mx-auto max-w-screen-2xl space-y-5 p-6">

        {/* Hero header */}
        <Suspense fallback={<GlassSkeleton h="h-28" />}>
          <GlassDashboardHeader />
        </Suspense>

        {/* KPI cards */}
        <Suspense fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <GlassSkeleton key={i} h="h-[120px]" />)}
          </div>
        }>
          <GlassKpiGrid />
        </Suspense>

        {/* Main grid: charts + workflow */}
        <div className="grid gap-5 xl:grid-cols-4">
          {/* Charts column — 3 cols */}
          <div className="xl:col-span-3 space-y-5">
            {/* Spend + Donut row */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Suspense fallback={<GlassSkeleton h="h-64" />}>
                <GlassSpendChart />
              </Suspense>
              <Suspense fallback={<GlassSkeleton h="h-64" />}>
                <GlassProcurementDonut />
              </Suspense>
            </div>

            {/* Vendor perf + Inventory row */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Suspense fallback={<GlassSkeleton h="h-56" />}>
                <GlassVendorPerformance />
              </Suspense>
              <Suspense fallback={<GlassSkeleton h="h-56" />}>
                <GlassInventoryHealth />
              </Suspense>
            </div>
          </div>

          {/* Right column — workflow + quick actions */}
          <div className="space-y-5">
            <ProcurementWorkflow />
            <GlassQuickActions />
          </div>
        </div>

        {/* Bottom grid: table + activity */}
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Suspense fallback={<GlassSkeleton h="h-64" />}>
              <GlassRecentTable />
            </Suspense>
          </div>
          <Suspense fallback={<GlassSkeleton h="h-64" />}>
            <GlassActivityFeed />
          </Suspense>
        </div>

      </div>
    </div>
  )
}

export default async function DashboardPage() {
  let realRole = 'viewer'
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('users').select('role').eq('id', user.id).single()
      realRole = (data as { role: string } | null)?.role ?? 'viewer'
    }
  } catch { /* not authenticated */ }

  const previewRole = (realRole === 'administrator' || realRole === 'admin')
    ? await getPreviewRole()
    : null

  const effectiveRole = previewRole ?? realRole

  switch (effectiveRole) {
    case 'procurement_officer':  return <ProcurementOfficerDashboard />
    case 'procurement_manager':  return <ProcurementManagerDashboard />
    case 'warehouse_manager':    return <WarehouseManagerDashboard />
    case 'finance_manager':      return <FinanceManagerDashboard />
    default:
      return <AdminDashboard />
  }
}
