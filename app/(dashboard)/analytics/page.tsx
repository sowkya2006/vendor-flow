import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  Building2, FileText, ShoppingCart, DollarSign,
  Warehouse, Clock, CheckCircle2, AlertTriangle,
  Receipt, TrendingDown, CreditCard, FileSearch,
} from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getExecutiveKpis, getExecutiveChartData } from '@/lib/supabase/analytics'
import { AnalyticsKpiCard } from '@/components/analytics/analytics-kpi-card'
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card'
import {
  SpendLineChart,
  CountBarChart,
  DonutChart,
  HorizontalBarChart,
} from '@/components/analytics/analytics-charts'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Executive Dashboard — Analytics — VendorFlow' }

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 space-y-2">
          <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton({ h = 260 }: { h?: number }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className={`w-full rounded-lg`} style={{ height: h }} />
    </div>
  )
}

async function ExecutiveKpis() {
  const companyId = await getCompanyId()
  const k = await getExecutiveKpis(companyId)

  const cards = [
    { label: 'Total Vendors',          value: k.total_vendors,                          icon: Building2,    accent: 'blue'    },
    { label: 'Active Vendors',         value: k.active_vendors,                         icon: Building2,    accent: 'green'   },
    { label: 'Total RFQs',             value: k.total_rfqs,                             icon: FileText,     accent: 'purple'  },
    { label: 'Active RFQs',            value: k.active_rfqs,                            icon: FileText,     accent: 'default' },
    { label: 'Total Quotations',       value: k.total_quotations,                       icon: FileSearch,   accent: 'cyan'    },
    { label: 'Quotation Acceptance',   value: `${k.quotation_acceptance_rate}%`,        icon: CheckCircle2, accent: 'green'   },
    { label: 'Purchase Orders',        value: k.total_pos,                              icon: ShoppingCart, accent: 'default' },
    { label: 'Procurement Spend',      value: formatCurrency(k.total_procurement_spend), icon: DollarSign,  accent: 'cyan'    },
    { label: 'Inventory Value',        value: formatCurrency(k.inventory_value),        icon: Warehouse,    accent: 'purple'  },
    { label: 'Low / Out-of-Stock',     value: k.low_stock_items,                        icon: AlertTriangle,accent: k.low_stock_items > 0 ? 'amber' : 'green' },
    { label: 'Pending Approvals',      value: k.pending_approvals,                      icon: Clock,        accent: k.pending_approvals > 0 ? 'amber' : 'green' },
    { label: 'Completed Approvals',    value: k.completed_approvals,                    icon: CheckCircle2, accent: 'green'   },
    { label: 'Total Invoices',         value: k.total_invoices,                         icon: Receipt,      accent: 'default' },
    { label: 'Outstanding Amount',     value: formatCurrency(k.outstanding_amount),     icon: TrendingDown, accent: k.outstanding_amount > 0 ? 'red' : 'green' },
    { label: 'Paid Amount',            value: formatCurrency(k.paid_amount),            icon: CheckCircle2, accent: 'green'   },
    { label: 'Payments This Month',    value: formatCurrency(k.payments_this_month),    icon: CreditCard,   accent: 'cyan'    },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <AnalyticsKpiCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
      ))}
    </div>
  )
}

async function ExecutiveCharts() {
  const companyId = await getCompanyId()
  const d = await getExecutiveChartData(companyId)

  return (
    <div className="space-y-5">
      {/* Row 1: line + bar */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="Monthly Procurement Spend" subtitle="Total payments recorded per month">
          <SpendLineChart data={d.monthly_spend} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Purchase Orders by Month" subtitle="Number of POs created">
          <CountBarChart data={d.monthly_po_count} label="POs" />
        </AnalyticsChartCard>
      </div>

      {/* Row 2: donut + donut + donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        <AnalyticsChartCard title="Vendor Categories" subtitle="Distribution by category">
          <DonutChart data={d.vendor_categories} innerRadius={0} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="RFQ Status" subtitle="Current status breakdown">
          <DonutChart data={d.rfq_status} innerRadius={52} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Invoice Status" subtitle="Invoice status distribution">
          <DonutChart data={d.invoice_status} innerRadius={52} />
        </AnalyticsChartCard>
      </div>

      {/* Row 3: approval donut + top products */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AnalyticsChartCard title="Approval Status" subtitle="All approval requests">
          <DonutChart data={d.approval_status} innerRadius={52} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Top Products by Inventory Value" subtitle="Highest-value stocked items">
          <HorizontalBarChart
            data={d.top_products_by_value.map((p) => ({ name: p.product_name, value: p.value }))}
            formatter="currency"
          />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

export default function AnalyticsExecutivePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<KpiSkeleton />}>
        <ExecutiveKpis />
      </Suspense>
      <Suspense fallback={<div className="space-y-5">{Array.from({length:3}).map((_,i)=><ChartSkeleton key={i}/>)}</div>}>
        <ExecutiveCharts />
      </Suspense>
    </div>
  )
}
