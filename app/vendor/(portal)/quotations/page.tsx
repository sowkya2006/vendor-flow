import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { FileSearch, Plus } from 'lucide-react'
import { getVendorUser, getVendorQuotations } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Quotations' }
interface PageProps { searchParams: Promise<{ status?: string; page?: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-amber-100 text-amber-700',
}

async function QuotationList({ status, page }: { status: string; page: number }) {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const result = await getVendorQuotations(vu.vendor_id, { status: status || undefined, page, pageSize: 20 })

  if (result.data.length === 0) {
    return <EmptyState icon={<FileSearch className="h-8 w-8" />} title="No quotations found" description={status ? 'Try adjusting filters.' : 'Create your first quotation.'} action={!status ? <Button asChild><Link href="/vendor/quotations/new"><Plus className="h-4 w-4 mr-1" />New Quotation</Link></Button> : undefined} />
  }

  const buildUrl = (p: number) => `/vendor/quotations?page=${p}${status ? `&status=${status}` : ''}`

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">{result.total} quotation{result.total !== 1 ? 's' : ''}</p>
      {result.data.map((q) => (
        <Link key={q.id} href={`/vendor/quotations/${q.id}`}
          className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><FileSearch className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] truncate">{q.quotation_number}</p>
            <p className="text-xs text-[--color-foreground-muted] truncate">{(q.rfq as { title: string } | null)?.title ?? 'No RFQ'} · {formatDate(q.created_at)}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[q.status] ?? 'bg-gray-100 text-gray-600'}`}>{q.status}</span>
          <span className="hidden md:block text-sm font-semibold text-[--color-foreground] shrink-0">{formatCurrency((q as { grand_total?: number; total_amount?: number }).grand_total ?? (q as { grand_total?: number; total_amount?: number }).total_amount ?? 0)}</span>
        </Link>
      ))}
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

export default async function VendorQuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><FileSearch className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-semibold text-[--color-foreground]">Quotations</h1><p className="text-xs text-[--color-foreground-muted]">Your submitted and draft quotations</p></div>
        </div>
        <Button asChild><Link href="/vendor/quotations/new"><Plus className="h-4 w-4 mr-1" />New Quotation</Link></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['', 'draft', 'submitted', 'approved', 'rejected', 'withdrawn'] as const).map((s) => (
          <Link key={s || 'all'} href={`/vendor/quotations${s ? `?status=${s}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <QuotationList status={status} page={page} />
      </Suspense>
    </div>
  )
}
