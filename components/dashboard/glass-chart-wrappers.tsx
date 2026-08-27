/**
 * glass-chart-wrappers.tsx — Server components that fetch real Supabase data
 * and pass it to the client-side Recharts components in glass-charts.tsx.
 *
 * Usage: import these wrappers in dashboard/page.tsx instead of the bare chart
 * components. Each wrapper is async and handles its own error boundary via a
 * safe fallback (returns empty / zero data on error, never throws).
 */
import { getCompanyId } from '@/lib/supabase/get-company-id'
import {
  getMonthlySpendTrend,
  getProcurementStatusCounts,
  getVendorPerformanceTrend,
  getInventoryHealthSnapshot,
} from '@/lib/supabase/dashboard'
import {
  GlassSpendChart,
  GlassProcurementDonut,
  GlassVendorPerformance,
  GlassInventoryHealth,
} from './glass-charts'

// ── Monthly Spend ─────────────────────────────────────────────
export async function SpendChartWrapper() {
  try {
    const companyId = await getCompanyId()
    const data = await getMonthlySpendTrend(companyId, 6)
    return <GlassSpendChart data={data} />
  } catch {
    return <GlassSpendChart />
  }
}

// ── Procurement Status Donut ──────────────────────────────────
export async function ProcurementDonutWrapper() {
  try {
    const companyId = await getCompanyId()
    const data = await getProcurementStatusCounts(companyId)
    return <GlassProcurementDonut data={data} />
  } catch {
    return <GlassProcurementDonut />
  }
}

// ── Vendor Performance ────────────────────────────────────────
export async function VendorPerformanceWrapper() {
  try {
    const companyId = await getCompanyId()
    const data = await getVendorPerformanceTrend(companyId, 6)
    return <GlassVendorPerformance data={data} />
  } catch {
    return <GlassVendorPerformance />
  }
}

// ── Inventory Health ──────────────────────────────────────────
export async function InventoryHealthWrapper() {
  try {
    const companyId = await getCompanyId()
    const data = await getInventoryHealthSnapshot(companyId)
    return <GlassInventoryHealth data={data} />
  } catch {
    return <GlassInventoryHealth />
  }
}
