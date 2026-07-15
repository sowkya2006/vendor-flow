import { Suspense } from 'react'
import Link from 'next/link'
import { Receipt, TrendingDown, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

async function FMDashboardContent() {
  const companyId = await getCompanyId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const todayStr = today.toISOString().slice(0, 10)

  const [pendingInvoices, overdueInvoices, monthlyPayments, todayPayments, recentInvoices] = await Promise.all([
    supabase.from('invoices').select('id, remaining_amount').eq('company_id', companyId).in('status', ['approved', 'partially_paid']),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId).lt('due_date', todayStr).not('status', 'in', '("paid","cancelled","draft")'),
    supabase.from('payments').select('amount').eq('company_id', companyId).gte('payment_date', monthStart),
    supabase.from('payments').select('amount').eq('company_id', companyId).eq('payment_date', todayStr),
    supabase.from('invoices').select('id, invoice_number, status, total_amount, remaining_amount, due_date, vendor:vendors(name)').eq('company_id', companyId).not('status', 'in', '("paid","cancelled")').order('due_date', { ascending: true }).limit(6),
  ])

  const outstanding = (pendingInvoices.data ?? []).reduce((s: number, r: { remaining_amount: number }) => s + r.remaining_amount, 0)
  const monthSpend = (monthlyPayments.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  const todaySpend = (todayPayments.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  const INV_STATUS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700', partially_paid: 'bg-cyan-100 text-cyan-700',
    paid: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Finance Manager</h1>
          <p className="text-xs text-[--color-foreground-muted]">Verify invoices, approve payments and monitor cash flow</p>
        </div>
        <Button asChild size="sm">
          <Link href="/payments/invoices">View All Invoices</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/payments/outstanding" className="block rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Outstanding</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{formatCurrency(outstanding)}</p>
          <p className="text-xs text-[--color-foreground-muted]">{pendingInvoices.data?.length ?? 0} invoices</p>
        </Link>
        <Link href="/payments/overdue" className={cn('block rounded-xl border px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow', (overdueInvoices.count ?? 0) > 0 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : 'border-[--color-border] bg-[--color-card]')}>
          <p className="text-xs font-medium text-[--color-foreground-muted]">Overdue</p>
          <p className={cn('mt-1 text-3xl font-bold', (overdueInvoices.count ?? 0) > 0 ? 'text-red-600' : 'text-[--color-primary]')}>{overdueInvoices.count ?? 0}</p>
          <p className="text-xs text-[--color-foreground-muted]">invoices past due</p>
        </Link>
        <Link href="/payments/history" className="block rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Paid This Month</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{formatCurrency(monthSpend)}</p>
        </Link>
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Today's Payments</p>
          <p className="mt-1 text-3xl font-bold text-[--color-primary]">{formatCurrency(todaySpend)}</p>
        </div>
      </div>

      {/* Invoices requiring action */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[--color-foreground-muted]" /><h2 className="text-sm font-semibold text-[--color-foreground]">Invoices Requiring Action</h2></div>
          <Link href="/payments/invoices" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {(recentInvoices.data ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[--color-foreground-muted]">No pending invoices.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-[--color-background-subtle]">
                <tr>{['Invoice', 'Vendor', 'Status', 'Due Date', 'Remaining'].map(h => <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[--color-foreground-muted]">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {(recentInvoices.data ?? []).map((inv: { id: string; invoice_number: string; status: string; total_amount: number; remaining_amount: number; due_date: string | null; vendor: { name: string } | null }) => (
                  <tr key={inv.id} className="hover:bg-[--color-background-subtle] transition-colors">
                    <td className="px-4 py-3"><Link href={`/payments/invoices/${inv.id}`} className="text-sm font-medium text-[--color-primary] hover:underline">{inv.invoice_number}</Link></td>
                    <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{inv.vendor?.name ?? '—'}</td>
                    <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', INV_STATUS[inv.status] ?? 'bg-gray-100 text-gray-600')}>{inv.status.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[--color-foreground]">{formatCurrency(inv.remaining_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function FinanceManagerDashboard() {
  return (
    <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div><Skeleton className="h-80 rounded-xl" /></div>}>
      <FMDashboardContent />
    </Suspense>
  )
}
