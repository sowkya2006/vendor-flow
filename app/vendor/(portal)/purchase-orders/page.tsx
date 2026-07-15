import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getVendorUser, getVendorPurchaseOrders } from '@/lib/supabase/vendor-portal'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Purchase Orders' }
interface PageProps { searchParams: Promise<{ status?: string; page?: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700', sent: 'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

async function PoList({ status, page }: { status: string; page: number }) {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const result = await getVendorPurchaseOrders(vu.vendor_id, { status: status || undefined, page, pageSize: 20 })

  if (result.data.length === 0) return <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="No purchase orders" description="Purchase orders assigned to you will appear here." />

  const buildUrl = (p: number) => `/vendor/purchase-orders?page=${p}${status ? `&status=${status}` : ''}`

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">{result.total} order{result.total !== 1 ? 's' : ''}</p>
      {result.data.map((po) => (
        <Link key={po.id} href={`/vendor/purchase-orders/${po.id}`}
          className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><ShoppingCart className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] truncate">{po.po_number}</p>
            <p className="text-xs text-[--color-foreground-muted]">{formatDate(po.created_at)}{po.due_date ? ` · Due ${formatDate(po.due_date)}` : ''}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[po.status] ?? 'bg-gray-100 text-gray-600'}`}>{po.status.replace(/_/g, ' ')}</span>
          <span className="hidden md:block text-sm font-semibold text-[--color-foreground] shrink-0">{po.total_amount != null ? formatCurrency(po.total_amount) : '—'}</span>
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

export default async function VendorPurchaseOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><ShoppingCart className="h-5 w-5" /></div>
        <div><h1 className="text-xl font-semibold text-[--color-foreground]">Purchase Orders</h1><p className="text-xs text-[--color-foreground-muted]">View-only — managed by the procurement team</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['', 'approved', 'sent', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
          <Link key={s || 'all'} href={`/vendor/purchase-orders${s ? `?status=${s}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}>
            {s === '' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        ))}
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <PoList status={status} page={page} />
      </Suspense>
    </div>
  )
}
