import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { getVendorUser, getVendorRfqs } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'RFQs' }

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  under_review: 'bg-purple-100 text-purple-700', awarded: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

async function RfqList({ status, search, page }: { status: string; search: string; page: number }) {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  const result = await getVendorRfqs(vu.vendor_id, {
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 20,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="No RFQs found"
        description={search || status ? 'Try adjusting your filters.' : 'RFQs assigned to you will appear here.'}
      />
    )
  }

  const buildUrl = (p: number) =>
    `/vendor/rfqs?page=${p}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">{result.total} RFQ{result.total !== 1 ? 's' : ''}</p>
      {result.data.map((rfq) => (
        <Link key={rfq.id} href={`/vendor/rfqs/${rfq.id}`}
          className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors truncate">{rfq.rfq_number}</p>
            <p className="text-xs text-[--color-foreground-muted] truncate">{rfq.title}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[rfq.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {rfq.status.replace(/_/g, ' ')}
          </span>
          <span className="hidden md:block text-xs text-[--color-foreground-muted] shrink-0">
            {rfq.due_date ? `Due ${formatDate(rfq.due_date)}` : '—'}
          </span>
        </Link>
      ))}
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

export default async function VendorRfqsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? ''
  const search = params.search ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">RFQs</h1>
          <p className="text-xs text-[--color-foreground-muted]">Requests for quotation assigned to you</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {(['', 'sent', 'under_review', 'awarded', 'cancelled'] as const).map((s) => (
          <Link key={s || 'all'} href={`/vendor/rfqs${s ? `?status=${s}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}>
            {s === '' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </div>

      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <RfqList status={status} search={search} page={page} />
      </Suspense>
    </div>
  )
}
