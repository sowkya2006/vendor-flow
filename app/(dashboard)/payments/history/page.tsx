import { Suspense } from 'react'
import Link from 'next/link'
import { History, ArrowLeft, CreditCard } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { PaymentMethodBadge } from '@/components/invoices/invoice-status-badge'
import { PaymentHistoryDateFilter } from '@/components/invoices/payment-history-date-filter'
import { getPayments } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PaymentMethod } from '@/types/invoice'
import { PAYMENT_METHOD_LABELS } from '@/types/invoice'

interface PageProps {
  searchParams: Promise<{
    payment_method?: string
    from_date?: string
    to_date?: string
    page?: string
  }>
}

const METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]

async function PaymentList({
  companyId,
  paymentMethod,
  fromDate,
  toDate,
  page,
}: {
  companyId: string
  paymentMethod: string
  fromDate: string
  toDate: string
  page: number
}) {
  const result = await getPayments(companyId, {
    payment_method: (paymentMethod as PaymentMethod) || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    page,
    pageSize: 30,
  })

  const totalPaid = result.data.reduce((s, p) => s + p.amount, 0)

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="No payments found"
        description="Payments will appear here once invoices are settled."
      />
    )
  }

  const buildUrl = (p: number) => {
    const parts = [`page=${p}`]
    if (paymentMethod) parts.push(`payment_method=${paymentMethod}`)
    if (fromDate) parts.push(`from_date=${fromDate}`)
    if (toDate) parts.push(`to_date=${toDate}`)
    return `/payments/history?${parts.join('&')}`
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 flex items-center justify-between shadow-[--shadow-sm]">
        <div>
          <p className="text-xs font-medium text-[--color-foreground-muted]">
            Total Paid {fromDate || toDate ? '(filtered period)' : ''}
          </p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[--color-foreground-muted]">
            {result.total} payment{result.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="divide-y divide-[--color-border]">
          {result.data.map((payment) => (
            <div key={payment.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[--color-foreground]">
                  {payment.payment_reference}
                </p>
                <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                  {(payment.vendor as { name: string } | undefined)?.name ?? '—'}
                  {' · '}
                  <Link
                    href={`/payments/invoices/${payment.invoice_id}`}
                    className="hover:text-[--color-primary] hover:underline"
                  >
                    {(payment.invoice as { invoice_number: string } | undefined)?.invoice_number ?? '—'}
                  </Link>
                </p>
              </div>
              <PaymentMethodBadge
                method={payment.payment_method}
                className="hidden sm:inline-flex shrink-0"
              />
              <span className="hidden md:block text-xs text-[--color-foreground-muted] shrink-0">
                {formatDate(payment.payment_date)}
              </span>
              <span className="text-sm font-semibold text-emerald-600 shrink-0">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? <Link href={buildUrl(page - 1)}>Previous</Link> : <span>Previous</span>}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage ? <Link href={buildUrl(page + 1)}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function PaymentHistoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const paymentMethod = params.payment_method ?? ''
  const fromDate = params.from_date ?? ''
  const toDate = params.to_date ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  const buildFilter = (key: string, value: string) => {
    const parts: string[] = []
    if (key !== 'payment_method' && paymentMethod) parts.push(`payment_method=${paymentMethod}`)
    if (key !== 'from_date' && fromDate) parts.push(`from_date=${fromDate}`)
    if (key !== 'to_date' && toDate) parts.push(`to_date=${toDate}`)
    if (value) parts.push(`${key}=${value}`)
    return `/payments/history${parts.length ? '?' + parts.join('&') : ''}`
  }

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
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Payment History</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              All recorded payments across all invoices
            </p>
          </div>
        </div>
      </div>

      {/* Method filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={buildFilter('payment_method', '')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !paymentMethod
              ? 'bg-[--color-primary] text-white'
              : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
          }`}
        >
          All Methods
        </Link>
        {METHODS.map(([value, label]) => (
          <Link
            key={value}
            href={buildFilter('payment_method', value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              paymentMethod === value
                ? 'bg-[--color-primary] text-white'
                : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Date range filter — delegated to client component to allow onChange */}
      <PaymentHistoryDateFilter
        paymentMethod={paymentMethod}
        fromDate={fromDate}
        toDate={toDate}
        clearHref={buildFilter('from_date', '')}
      />

      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4"
              >
                <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                <Skeleton className="h-3 w-16 hidden md:block" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        }
      >
        <PaymentList
          companyId={companyId}
          paymentMethod={paymentMethod}
          fromDate={fromDate}
          toDate={toDate}
          page={page}
        />
      </Suspense>
    </PageContainer>
  )
}
