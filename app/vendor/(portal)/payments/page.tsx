import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { getVendorUser, getVendorPayments } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Payments' }
interface PageProps { searchParams: Promise<{ page?: string }> }

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer', upi: 'UPI', cheque: 'Cheque', cash: 'Cash', card: 'Card',
}

async function PaymentList({ page }: { page: number }) {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const result = await getVendorPayments(vu.vendor_id, { page, pageSize: 30 })

  const totalReceived = result.data.reduce((s, p) => s + p.amount, 0)

  if (result.data.length === 0) return <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payments yet" description="Payments recorded against your invoices will appear here." />

  const buildUrl = (p: number) => `/vendor/payments?page=${p}`

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 flex items-center justify-between shadow-[--shadow-sm]">
        <div>
          <p className="text-xs font-medium text-[--color-foreground-muted]">Total Received</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[--color-foreground-muted]">{result.total} payment{result.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="divide-y divide-[--color-border]">
          {result.data.map((pay) => (
            <div key={pay.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[--color-foreground] truncate">{pay.payment_reference}</p>
                <p className="text-xs text-[--color-foreground-muted]">
                  {METHOD_LABELS[pay.payment_method] ?? pay.payment_method} · {formatDate(pay.payment_date)}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(pay as any).invoice?.invoice_number ? ` · ${(pay as any).invoice.invoice_number}` : ''}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 shrink-0">{formatCurrency(pay.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={buildUrl(page - 1)}>Previous</Link> : <span>Previous</span>}</Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>{result.hasNextPage ? <Link href={buildUrl(page + 1)}>Next</Link> : <span>Next</span>}</Button>
        </div>
      )}
    </div>
  )
}

export default async function VendorPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><CreditCard className="h-5 w-5" /></div>
        <div><h1 className="text-xl font-semibold text-[--color-foreground]">Payments</h1><p className="text-xs text-[--color-foreground-muted]">Read-only — view payments received from the buyer</p></div>
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>}>
        <PaymentList page={page} />
      </Suspense>
    </div>
  )
}
