import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { FileDown, ChartBar as BarChart3, TrendingUp, ShoppingCart, Building2, CreditCard, Warehouse, ClipboardList, FileSpreadsheet, FileText, CalendarDays, ArrowRight } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getExecutiveKpis } from '@/lib/supabase/analytics'
import { Skeleton } from '@/components/shared/loading-states'
import { PageContainer } from '@/components/shared/page-container'
import { ExportButton } from '@/components/analytics/export-button'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reports — VendorFlow' }

// ── Report card ───────────────────────────────────────────────────────────────

interface ReportCardProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  badge?: string
  accent?: string
}

function ReportCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
  accent = 'bg-[--color-primary]/10 text-[--color-primary]',
}: ReportCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm] transition-all hover:shadow-[--shadow-md] hover:border-[--color-primary]/30 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className="rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary]">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted] leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-[--color-primary] group-hover:gap-2 transition-all mt-auto">
        View Report <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  )
}

// ── Quick export rows ─────────────────────────────────────────────────────────

const QUICK_EXPORTS = [
  {
    label: 'Vendor List Export',
    description: 'All vendors with status, category, and contract value',
    icon: Building2,
    href: '/analytics/vendors',
  },
  {
    label: 'Purchase Orders Export',
    description: 'All POs with vendor, amount, status, and dates',
    icon: ShoppingCart,
    href: '/analytics/procurement',
  },
  {
    label: 'Invoice & Payment Report',
    description: 'Outstanding invoices, payments, and aging summary',
    icon: CreditCard,
    href: '/analytics/finance',
  },
  {
    label: 'Inventory Stock Report',
    description: 'Current stock levels, valuations, low-stock items',
    icon: Warehouse,
    href: '/analytics/inventory',
  },
  {
    label: 'Approval Activity Report',
    description: 'All approval requests, decisions, and cycle times',
    icon: ClipboardList,
    href: '/analytics/approvals',
  },
  {
    label: 'RFQ & Quotation Report',
    description: 'Active RFQs, submitted quotations, and awarded bids',
    icon: FileSpreadsheet,
    href: '/analytics/procurement',
  },
]

// ── KPI snapshot ──────────────────────────────────────────────────────────────

async function KpiSnapshot() {
  let kpis
  try {
    const companyId = await getCompanyId()
    kpis = await getExecutiveKpis(companyId)
  } catch {
    kpis = null
  }

  if (!kpis) return null

  const rows = [
    { label: 'Total Procurement Spend', value: formatCurrency(kpis.total_procurement_spend) },
    { label: 'Outstanding Amount', value: formatCurrency(kpis.outstanding_amount) },
    { label: 'Inventory Value', value: formatCurrency(kpis.inventory_value) },
    { label: 'Paid Amount', value: formatCurrency(kpis.paid_amount) },
    { label: 'Total Purchase Orders', value: kpis.total_pos.toLocaleString() },
    { label: 'Active Vendors', value: kpis.active_vendors.toLocaleString() },
    { label: 'Total RFQs', value: kpis.total_rfqs.toLocaleString() },
    { label: 'Total Invoices', value: kpis.total_invoices.toLocaleString() },
  ]

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">Platform Snapshot</h2>
        <ExportButton
          rows={rows as Record<string, unknown>[]}
          filename="vendorflow-kpi-snapshot"
        />
      </div>
      <div className="grid grid-cols-2 gap-px bg-[--color-border] sm:grid-cols-4">
        {rows.map(({ label, value }) => (
          <div key={label} className="bg-[--color-card] px-5 py-4">
            <p className="text-xs text-[--color-foreground-muted]">{label}</p>
            <p className="mt-1 text-lg font-bold text-[--color-foreground] tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const REPORT_CATEGORIES = [
  {
    category: 'Procurement',
    icon: ShoppingCart,
    accent: 'bg-[--color-primary]/10 text-[--color-primary]',
    reports: [
      {
        title: 'Procurement Summary',
        description: 'Monthly spend trends, top vendors by volume, PO status breakdown.',
        href: '/analytics/procurement',
        badge: 'Live',
      },
      {
        title: 'Purchase Order Report',
        description: 'All POs with amounts, statuses, and delivery performance.',
        href: '/analytics/procurement',
      },
      {
        title: 'RFQ & Quotation Analysis',
        description: 'RFQ response rates, lowest bids, vendor selection patterns.',
        href: '/analytics/procurement',
      },
    ],
  },
  {
    category: 'Vendors',
    icon: Building2,
    accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    reports: [
      {
        title: 'Vendor Performance Report',
        description: 'Spend, order volume, and quotation activity per vendor.',
        href: '/analytics/vendors',
        badge: 'Live',
      },
      {
        title: 'Vendor Category Breakdown',
        description: 'Distribution of vendors by category and status.',
        href: '/analytics/vendors',
      },
      {
        title: 'Vendor Onboarding Summary',
        description: 'New vendor registrations, pending approvals, and active relationships.',
        href: '/vendors',
      },
    ],
  },
  {
    category: 'Finance',
    icon: CreditCard,
    accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    reports: [
      {
        title: 'Invoice & Payment Report',
        description: 'All invoices with status, aging buckets, and payment history.',
        href: '/analytics/finance',
        badge: 'Live',
      },
      {
        title: 'Vendor Balance Report',
        description: 'Outstanding amounts owed per vendor with overdue flags.',
        href: '/payments/vendors',
      },
      {
        title: 'Accounts Payable Aging',
        description: 'Current, 1–30, 31–60, 61–90, and 90+ day overdue buckets.',
        href: '/payments/outstanding',
      },
    ],
  },
  {
    category: 'Inventory',
    icon: Warehouse,
    accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    reports: [
      {
        title: 'Stock Valuation Report',
        description: 'Total inventory value by warehouse and product category.',
        href: '/analytics/inventory',
        badge: 'Live',
      },
      {
        title: 'Low Stock Alert Report',
        description: 'Products at or below reorder level requiring restocking.',
        href: '/inventory?filter=low_stock',
      },
      {
        title: 'GRN & Transaction History',
        description: 'All goods receipts and inventory movements with dates.',
        href: '/inventory/transactions',
      },
    ],
  },
  {
    category: 'Approvals & Compliance',
    icon: ClipboardList,
    accent: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    reports: [
      {
        title: 'Approval Activity Report',
        description: 'All requests, decisions, cycle times, and completion rates.',
        href: '/analytics/approvals',
        badge: 'Live',
      },
      {
        title: 'Audit Log Export',
        description: 'Immutable history of all platform actions for compliance.',
        href: '/audit-log',
      },
      {
        title: 'Pending Approvals Summary',
        description: 'Items currently awaiting decision by approver.',
        href: '/approvals/pending',
      },
    ],
  },
]

export default async function ReportsPage() {
  const thisMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Reports</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Live analytics and exportable reports · {thisMonth}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/analytics"
            className="flex items-center gap-1.5 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-1.5 text-sm font-medium text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Snapshot */}
      <div className="mb-6">
        <Suspense
          fallback={
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            </div>
          }
        >
          <KpiSnapshot />
        </Suspense>
      </div>

      {/* Quick Exports */}
      <div className="mb-8 rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
        <div className="border-b border-[--color-border] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-[--color-foreground-muted]" />
            <h2 className="text-sm font-semibold text-[--color-foreground]">Quick Exports</h2>
          </div>
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
            Navigate to any analytics page and use the export button to download CSV/JSON
          </p>
        </div>
        <div className="divide-y divide-[--color-border]">
          {QUICK_EXPORTS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-4 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--color-background-subtle] text-[--color-foreground-muted] group-hover:bg-[--color-primary]/10 group-hover:text-[--color-primary] transition-colors">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-[--color-foreground-muted]">{item.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[--color-foreground-subtle] group-hover:text-[--color-primary] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Report categories */}
      <div className="space-y-8">
        {REPORT_CATEGORIES.map(({ category, icon: CatIcon, accent, reports }) => (
          <div key={category}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
                <CatIcon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[--color-foreground]">{category}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.title}
                  {...report}
                  icon={CatIcon}
                  accent={accent}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scheduled reports note */}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed border-[--color-border] bg-[--color-background-subtle] px-5 py-4">
        <CalendarDays className="h-5 w-5 shrink-0 text-[--color-foreground-muted] mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[--color-foreground]">Scheduled Reports</p>
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
            Automated PDF/Excel report delivery via email is planned for a future release. All
            current reports are available in real-time from the Analytics section and can be
            exported to CSV or JSON.
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
