import { Suspense } from 'react'
import Link from 'next/link'
import { Building2, ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { getVendorBalances } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

async function VendorBalanceList({
  companyId,
  page,
}: {
  companyId: string
  page: number
}) {
  const { data, total } = await getVendorBalances(companyId, page, 20)
  const hasNextPage = total > page * 20

  const grandTotal = data.reduce((s, v) => s + v.outstanding, 0)
  const grandOverdue = data.reduce((s, v) => s + v.overdue_amount, 0)

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No vendor balances"
        description="Outstanding balances appear here once you create and approve invoices."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{formatCurrency(grandTotal)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 shadow-[--shadow-sm] dark:border-red-800 dark:bg-red-900/10">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Total Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(grandOverdue)}</p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Active Vendors</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{total}</p>
        </div>
      </div>

      {/* Vendor cards */}
      <div className="space-y-3">
        {data.map((vendor) => {
          const paidPct =
            vendor.total_invoiced > 0
              ? Math.min(100, (vendor.total_paid / vendor.total_invoiced) * 100)
              : 0
          const hasOverdue = vendor.overdue_amount > 0

          return (
            <div
              key={vendor.vendor_id}
              className={cn(
                'rounded-xl border bg-[--color-card] p-5 shadow-[--shadow-sm]',
                hasOverdue ? 'border-red-200 dark:border-red-900/40' : 'border-[--color-border]',
              )}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[--color-foreground]">
                      {vendor.vendor_name}
                    </p>
                    {hasOverdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                    {vendor.invoice_count} invoice{vendor.invoice_count !== 1 ? 's' : ''}
                    {vendor.oldest_due_date
                      ? ` · Oldest due: ${formatDate(vendor.oldest_due_date)}`
                      : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-bold text-[--color-foreground]">
                      {formatCurrency(vendor.outstanding)}
                    </p>
                    <p className="text-xs text-[--color-foreground-muted]">outstanding</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/payments/invoices?vendor_id=${vendor.vendor_id}`}>
                      View Invoices
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-[--color-foreground-muted]">
                  <span>Paid {formatCurrency(vendor.total_paid)}</span>
                  <span>Total {formatCurrency(vendor.total_invoiced)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[--color-muted] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                {hasOverdue && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(vendor.overdue_amount)} overdue
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? <Link href={`/payments/vendors?page=${page - 1}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={hasNextPage} disabled={!hasNextPage}>
            {hasNextPage ? <Link href={`/payments/vendors?page=${page + 1}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function VendorBalancesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/payments"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />Back to Finance
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Vendor Balances</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Outstanding amounts owed to each vendor
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        }
      >
        <VendorBalanceList companyId={companyId} page={page} />
      </Suspense>
    </PageContainer>
  )
}
