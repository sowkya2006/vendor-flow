import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CreditCard, Calendar } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { getInvoices } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function daysPastDue(dueDateStr: string): number {
  const diff = Date.now() - new Date(dueDateStr).getTime()
  return Math.floor(diff / 86400000)
}

async function OverdueList({ companyId }: { companyId: string }) {
  const result = await getInvoices(companyId, { overdue: true, pageSize: 100 })

  const totalOverdue = result.data.reduce((s, inv) => s + inv.remaining_amount, 0)

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-8 w-8" />}
        title="No overdue invoices"
        description="All invoices are within their payment terms."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center justify-between dark:border-red-800 dark:bg-red-900/10">
        <div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Total Overdue Amount</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalOverdue)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-red-500">{result.data.length} overdue invoice{result.data.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-2">
        {result.data.map((inv) => {
          const days = inv.due_date ? daysPastDue(inv.due_date) : 0
          return (
            <Link
              key={inv.id}
              href={`/payments/invoices/${inv.id}`}
              className="group flex items-center gap-4 rounded-xl border border-red-200 bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] dark:border-red-900/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                  {inv.invoice_number}
                </p>
                <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                  {inv.vendor?.name ?? '—'}
                </p>
              </div>
              <InvoiceStatusBadge status={inv.status} className="hidden sm:inline-flex shrink-0" />
              <div className="hidden md:flex items-center gap-1 text-xs shrink-0">
                <Calendar className="h-3.5 w-3.5 text-red-500" />
                <span className="text-red-600 font-semibold">
                  {inv.due_date ? formatDate(inv.due_date) : '—'}
                  {days > 0 ? ` (${days}d overdue)` : ''}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-red-600">{formatCurrency(inv.remaining_amount)}</p>
                <p className="text-xs text-[--color-foreground-muted]">outstanding</p>
              </div>
              <Button asChild size="sm" className="hidden lg:inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link href={`/payments/invoices/${inv.id}/pay`}>
                  <CreditCard className="h-3.5 w-3.5 mr-1" />Pay Now
                </Link>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default async function OverduePage() {
  const companyId = await getCompanyId()
  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/payments" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Finance
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Overdue Invoices</h1>
            <p className="text-xs text-[--color-foreground-muted]">Invoices past their due date with outstanding balance</p>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <OverdueList companyId={companyId} />
      </Suspense>
    </PageContainer>
  )
}
