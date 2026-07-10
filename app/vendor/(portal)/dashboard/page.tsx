import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import {
  FileText, FileSearch, ShoppingCart, Receipt,
  CreditCard, Bell, TrendingDown, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { getVendorUser, getVendorDashboardStats, getVendorRfqs, getVendorInvoices, getVendorPayments } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

function StatCard({ label, value, icon: Icon, href, accent = 'default' }: {
  label: string; value: string | number; icon: LucideIcon
  href?: string; accent?: 'default' | 'green' | 'amber' | 'red' | 'blue' | 'cyan'
}) {
  const accentMap: Record<string, string> = {
    default: 'bg-[--color-primary]/10 text-[--color-primary]',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  }
  const card = (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground] truncate">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block transition-shadow hover:shadow-[--shadow-md]">{card}</Link> : card
}

async function DashboardContent() {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const stats = await getVendorDashboardStats(vu.vendor_id)

  const [recentRfqs, recentInvoices, recentPayments] = await Promise.all([
    getVendorRfqs(vu.vendor_id, { pageSize: 4 }),
    getVendorInvoices(vu.vendor_id, { pageSize: 4 }),
    getVendorPayments(vu.vendor_id, { pageSize: 4 }),
  ])

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-[--color-foreground]">Welcome, {vu.full_name ?? vu.vendor?.name ?? 'Vendor'}</h1>
        <p className="text-xs text-[--color-foreground-muted] mt-0.5">Here's your portal overview</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Assigned RFQs" value={stats.assigned_rfqs} icon={FileText} href="/vendor/rfqs" accent="blue" />
        <StatCard label="Quotations" value={stats.submitted_quotations} icon={FileSearch} href="/vendor/quotations" accent="default" />
        <StatCard label="Approved Quotations" value={stats.approved_quotations} icon={CheckCircle2} accent="green" />
        <StatCard label="Purchase Orders" value={stats.purchase_orders} icon={ShoppingCart} href="/vendor/purchase-orders" accent="blue" />
        <StatCard label="Total Invoices" value={stats.total_invoices} icon={Receipt} href="/vendor/invoices" accent="default" />
        <StatCard label="Payments Received" value={formatCurrency(stats.payments_received)} icon={CreditCard} href="/vendor/payments" accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(stats.outstanding_amount)} icon={TrendingDown} href="/vendor/invoices" accent={stats.outstanding_amount > 0 ? 'amber' : 'green'} />
        <StatCard label="Notifications" value={stats.unread_notifications} icon={Bell} href="/vendor/notifications" accent={stats.unread_notifications > 0 ? 'red' : 'default'} />
      </div>

      {/* Two-column activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent RFQs */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-3">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Recent RFQs</h2>
            <Link href="/vendor/rfqs" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {recentRfqs.data.length === 0 ? (
            <p className="px-5 py-6 text-sm text-center text-[--color-foreground-muted]">No RFQs assigned yet.</p>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {recentRfqs.data.map((rfq) => (
                <li key={rfq.id}>
                  <Link href={`/vendor/rfqs/${rfq.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[--color-background-subtle] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[--color-foreground] truncate">{rfq.rfq_number}</p>
                      <p className="text-xs text-[--color-foreground-muted] truncate">{rfq.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${rfq.status === 'sent' ? 'bg-blue-100 text-blue-700' : rfq.status === 'awarded' ? 'bg-green-100 text-green-700' : 'bg-[--color-muted] text-[--color-foreground-muted]'}`}>
                      {rfq.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-3">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Recent Payments</h2>
            <Link href="/vendor/payments" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {recentPayments.data.length === 0 ? (
            <p className="px-5 py-6 text-sm text-center text-[--color-foreground-muted]">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {recentPayments.data.map((pay) => (
                <li key={pay.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[--color-foreground] truncate">{pay.payment_reference}</p>
                    <p className="text-xs text-[--color-foreground-muted]">{formatDate(pay.payment_date)} · {pay.payment_method.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 shrink-0">{formatCurrency(pay.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-3">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Recent Invoices</h2>
          <Link href="/vendor/invoices" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {recentInvoices.data.length === 0 ? (
          <p className="px-5 py-6 text-sm text-center text-[--color-foreground-muted]">No invoices yet. <Link href="/vendor/invoices/new" className="text-[--color-primary] hover:underline">Create one</Link></p>
        ) : (
          <div className="divide-y divide-[--color-border]">
            {recentInvoices.data.map((inv) => (
              <Link key={inv.id} href={`/vendor/invoices/${inv.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[--color-background-subtle] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[--color-foreground] truncate">{inv.invoice_number}</p>
                  <p className="text-xs text-[--color-foreground-muted]">{formatDate(inv.invoice_date)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'approved' ? 'bg-blue-100 text-blue-700' : inv.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-[--color-muted] text-[--color-foreground-muted]'}`}>
                  {inv.status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-[--color-foreground] shrink-0">{formatCurrency(inv.total_amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-60" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
