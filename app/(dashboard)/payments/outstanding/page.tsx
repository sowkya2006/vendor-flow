import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingDown, ArrowLeft, CreditCard, Calendar } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { getInvoices } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

async function OutstandingList({ companyId }: { companyId: string }) {
  const result = await getInvoices(companyId, {
    status: 'approved',
    pageSize: 100,
  })
  const partial = await getInvoices(companyId, {
    status: 'partially_paid',
    pageSize: 100,
  })

  const all = [...result.data, ...partial.data].sort(
    (a, b) => (a.due_date ?? '9999') > (b.due_date ?? '9999') ? 1 : -1,
  )

  const totalOutstanding = all.reduce((s, inv) => s + inv.remaining_amount, 0)

  if (all.length === 0) {
    return (
      <EmptyState
        icon={<TrendingDown className="h-8 w-8" />}
        title="No outstanding invoices"
        description="All approved invoices have been fully paid."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 flex items-center justify-between shadow-[--shadow-sm]">
        <div>
          <p className="text-xs font-medium text-[--color-foreground-muted]">Total Outstanding</p>
          <p className="text-2xl font-bold text-[--color-foreground]">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[--color-foreground-muted]">{all.length} invoice{all.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-2">
        {all.map((inv) => {
          const isOverdue = inv.due_date && new Date(inv.due_date) < new Date()
          return (
            <Link
              key={inv.id}
              href={`/payments/invoices/${inv.id}`}
              className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
                <TrendingDown className="h-4 w-4" />
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
                <Calendar className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
                {inv.due_date ? (
                  <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-[--color-foreground-muted]'}>
                    {formatDate(inv.due_date)}
                    {isOverdue ? ' (Overdue)' : ''}
                  </span>
                ) : <span className="text-[--color-foreground-muted]">No due date</span>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[--color-foreground]">{formatCurrency(inv.remaining_amount)}</p>
                <p className="text-xs text-[--color-foreground-muted]">of {formatCurrency(inv.total_amount)}</p>
              </div>
              <Button asChild size="sm" className="hidden lg:inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link href={`/payments/invoices/${inv.id}/pay`}>
                  <CreditCard className="h-3.5 w-3.5 mr-1" />Pay
                </Link>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default async function OutstandingPage() {
  const companyId = await getCompanyId()
  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/payments" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Finance
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Outstanding Invoices</h1>
            <p className="text-xs text-[--color-foreground-muted]">Approved invoices with unpaid balance</p>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <OutstandingList companyId={companyId} />
      </Suspense>
    </PageContainer>
  )
}
