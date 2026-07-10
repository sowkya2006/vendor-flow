import { Suspense } from 'react'
import Link from 'next/link'
import { FileText, Plus, Calendar } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { getInvoices } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { InvoiceStatus } from '@/types/invoice'
import { INVOICE_STATUS_LABELS } from '@/types/invoice'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{value}</p>
    </div>
  )
}

const STATUSES = Object.entries(INVOICE_STATUS_LABELS) as [InvoiceStatus, string][]

async function InvoiceStats({ companyId }: { companyId: string }) {
  const [all, pending, approved, paid] = await Promise.all([
    getInvoices(companyId, { pageSize: 1 }),
    getInvoices(companyId, { status: 'submitted', pageSize: 1 }),
    getInvoices(companyId, { status: 'approved', pageSize: 1 }),
    getInvoices(companyId, { status: 'paid', pageSize: 1 }),
  ])
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total" value={all.total} />
      <StatCard label="Pending Approval" value={pending.total} />
      <StatCard label="Approved" value={approved.total} />
      <StatCard label="Paid" value={paid.total} />
    </div>
  )
}

async function InvoiceList({
  companyId, search, status, page,
}: { companyId: string; search: string; status: string; page: number }) {
  const result = await getInvoices(companyId, {
    search: search || undefined,
    status: (status as InvoiceStatus) || undefined,
    page,
    pageSize: 20,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="No invoices found"
        description={search || status ? 'Try adjusting your filters.' : 'Create your first invoice to start tracking payments.'}
        action={!search && !status ? (
          <Button asChild><Link href="/payments/invoices/new"><Plus className="h-4 w-4 mr-1" />New Invoice</Link></Button>
        ) : undefined}
      />
    )
  }

  const buildUrl = (p: number) =>
    `/payments/invoices?page=${p}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`

  return (
    <div className="space-y-2">
      <p className="text-xs text-[--color-foreground-muted]">{result.total} invoice{result.total !== 1 ? 's' : ''}</p>
      {result.data.map((inv) => {
        const isOverdue =
          inv.due_date &&
          !['paid', 'cancelled'].includes(inv.status) &&
          new Date(inv.due_date) < new Date()
        return (
          <Link
            key={inv.id}
            href={`/payments/invoices/${inv.id}`}
            className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
                {inv.invoice_number}
              </p>
              <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
                {inv.vendor?.name ?? '—'} · {formatDate(inv.invoice_date)}
              </p>
            </div>
            <InvoiceStatusBadge status={inv.status} className="hidden sm:inline-flex shrink-0" />
            <div className="hidden md:flex items-center gap-1 text-xs text-[--color-foreground-muted] shrink-0">
              <Calendar className="h-3.5 w-3.5" />
              {inv.due_date ? (
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{formatDate(inv.due_date)}</span>
              ) : '—'}
            </div>
            <div className="hidden lg:block text-right shrink-0 min-w-[120px]">
              <p className="text-sm font-semibold text-[--color-foreground]">{formatCurrency(inv.total_amount)}</p>
              {inv.remaining_amount > 0 && inv.status !== 'cancelled' && (
                <p className="text-xs text-[--color-foreground-muted]">{formatCurrency(inv.remaining_amount)} due</p>
              )}
            </div>
          </Link>
        )
      })}
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

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = params.status ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Invoices</h1>
            <p className="text-xs text-[--color-foreground-muted]">All vendor invoices and payment status</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/payments/invoices/new"><Plus className="h-4 w-4 mr-1" />New Invoice</Link>
        </Button>
      </div>

      <Suspense fallback={<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>}>
        <InvoiceStats companyId={companyId} />
      </Suspense>

      {/* Status pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/payments/invoices" className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!status ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}>
          All
        </Link>
        {STATUSES.map(([s, label]) => (
          <Link
            key={s}
            href={`/payments/invoices?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'bg-[--color-primary] text-white' : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent]'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Suspense fallback={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
          <InvoiceList companyId={companyId} search={search} status={status} page={page} />
        </Suspense>
      </div>
    </PageContainer>
  )
}
