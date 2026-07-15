import { Suspense } from 'react'
import Link from 'next/link'
import {
  CreditCard, Plus, FileText, AlertTriangle,
  TrendingDown, History, Building2, ArrowRight,
} from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { FinanceKpiCards } from '@/components/invoices/finance-kpi-cards'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { getInvoiceStats, getInvoices, getPayments, getAgingReport } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-2.5 w-28" /></div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

async function KpiSection({ companyId }: { companyId: string }) {
  const stats = await getInvoiceStats(companyId)
  return <FinanceKpiCards stats={stats} />
}

async function RecentInvoices({ companyId }: { companyId: string }) {
  const { data } = await getInvoices(companyId, { pageSize: 6 })
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-sm text-[--color-foreground-muted] py-4 text-center">No invoices yet.</p>
      ) : (
        data.map((inv) => (
          <Link
            key={inv.id}
            href={`/payments/invoices/${inv.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-[#4F8CFF]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-0.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                {inv.invoice_number}
              </p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                {inv.vendor?.name ?? '—'} · {formatDate(inv.invoice_date)}
              </p>
            </div>
            <InvoiceStatusBadge status={inv.status} className="hidden sm:inline-flex shrink-0" />
            <div className="hidden md:block text-right shrink-0">
              <p className="text-sm font-semibold text-[--color-foreground]">{formatCurrency(inv.total_amount)}</p>
              {inv.remaining_amount > 0 && (
                <p className="text-xs text-[--color-foreground-muted]">{formatCurrency(inv.remaining_amount)} due</p>
              )}
            </div>
          </Link>
        ))
      )}
      <div className="pt-1">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/payments/invoices">View all invoices <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>
    </div>
  )
}

async function RecentPayments({ companyId }: { companyId: string }) {
  const { data } = await getPayments(companyId, { pageSize: 5 })
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-sm text-[--color-foreground-muted] py-4 text-center">No payments recorded yet.</p>
      ) : (
        data.map((pay) => (
          <div key={pay.id} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground]">{pay.payment_reference}</p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                {pay.vendor?.name ?? '—'} · {(pay.invoice as { invoice_number: string } | undefined)?.invoice_number ?? '—'}
              </p>
            </div>
            <span className="text-xs text-[--color-foreground-muted] hidden sm:block shrink-0">{formatDate(pay.payment_date)}</span>
            <span className="text-sm font-semibold text-emerald-600 shrink-0">{formatCurrency(pay.amount)}</span>
          </div>
        ))
      )}
      <div className="pt-1">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/payments/history">Full payment history <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>
    </div>
  )
}

async function AgingSection({ companyId }: { companyId: string }) {
  const aging = await getAgingReport(companyId)
  const buckets = [
    aging.current,
    aging.days_1_30,
    aging.days_31_60,
    aging.days_61_90,
    aging.over_90,
  ]
  const maxAmt = Math.max(...buckets.map((b) => b.amount), 1)

  return (
    <div className="space-y-3">
      {buckets.map((bucket) => (
        <div key={bucket.label}>
          <div className="flex justify-between mb-1 text-xs">
            <span className="text-[--color-foreground-muted]">{bucket.label}</span>
            <span className="font-medium text-[--color-foreground]">
              {formatCurrency(bucket.amount)}
              <span className="text-[--color-foreground-muted] ml-1">({bucket.count})</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[--color-muted] overflow-hidden">
            <div
              className="h-full rounded-full bg-[--color-primary] transition-all"
              style={{ width: `${(bucket.amount / maxAmt) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function PaymentsDashboardPage() {
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-primary]/10 to-indigo-500/10 border border-[--color-primary]/15 text-[--color-primary]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[--color-foreground]">Finance</h1>
            <p className="text-xs text-[--color-foreground-muted]">Invoice management and payment tracking</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/payments/invoices/new"><Plus className="h-4 w-4 mr-1" />New Invoice</Link>
        </Button>
      </div>

      {/* KPI cards */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection companyId={companyId} />
      </Suspense>

      {/* Quick nav */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/payments/invoices', label: 'All Invoices', icon: <FileText className="h-4 w-4" /> },
          { href: '/payments/outstanding', label: 'Outstanding', icon: <TrendingDown className="h-4 w-4" /> },
          { href: '/payments/overdue', label: 'Overdue', icon: <AlertTriangle className="h-4 w-4" /> },
          { href: '/payments/vendors', label: 'Vendor Balances', icon: <Building2 className="h-4 w-4" /> },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3 text-sm font-medium text-[--color-foreground-muted] transition-colors hover:border-[--color-primary]/50 hover:text-[--color-foreground]"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent invoices */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Recent Invoices</h2>
          <Suspense fallback={<ListSkeleton />}>
            <RecentInvoices companyId={companyId} />
          </Suspense>
        </div>

        {/* Right column: recent payments + aging */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Recent Payments</h2>
            <Suspense fallback={<ListSkeleton />}>
              <RecentPayments companyId={companyId} />
            </Suspense>
          </div>

          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
            <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">Accounts Payable Aging</h2>
            <Suspense fallback={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>}>
              <AgingSection companyId={companyId} />
            </Suspense>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
