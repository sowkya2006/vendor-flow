// Server component — fetches live data, passes to client chart renderers
import {
  getMonthlySpendTrend,
  getVendorCategoryDistribution,
  getRfqStatusDistribution,
} from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { SpendBarChartClient } from './charts-client'
import { SpendLineChartClient } from './charts-client'
import { DonutChartClient } from './charts-client'

// ── Procurement Spend (Bar) ───────────────────────────────────────────────────
export async function ProcurementSpendChart() {
  let data: { month: string; spend: number }[] = []
  try {
    const companyId = await getCompanyId()
    data = await getMonthlySpendTrend(companyId, 6)
  } catch { /* not authenticated */ }
  return <SpendBarChartClient data={data} />
}

// ── Monthly Purchase Trend (Line) ─────────────────────────────────────────────
export async function PurchaseTrendChart() {
  let data: { month: string; spend: number }[] = []
  try {
    const companyId = await getCompanyId()
    data = await getMonthlySpendTrend(companyId, 8)
  } catch { /* not authenticated */ }
  return <SpendLineChartClient data={data} />
}

// ── Vendor Categories (Pie) ───────────────────────────────────────────────────
export async function VendorCategoriesChart() {
  let data: { name: string; value: number; color: string }[] = []
  try {
    const companyId = await getCompanyId()
    data = await getVendorCategoryDistribution(companyId)
  } catch { /* not authenticated */ }
  return (
    <DonutChartClient
      data={data}
      title="Vendor Categories"
      subtitle="Distribution by category"
      innerRadius={0}
      delay={0.3}
    />
  )
}

// ── RFQ Status (Donut) ────────────────────────────────────────────────────────
export async function RfqStatusChart() {
  let data: { name: string; value: number; color: string }[] = []
  try {
    const companyId = await getCompanyId()
    data = await getRfqStatusDistribution(companyId)
  } catch { /* not authenticated */ }
  return (
    <DonutChartClient
      data={data}
      title="RFQ Status"
      subtitle="Current status breakdown"
      innerRadius={48}
      delay={0.4}
    />
  )
}
