'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, FileSearch } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/shared/loading-states'
import { EmptyState } from '@/components/shared/loading-states'
import { QuotationStatusBadge } from './quotation-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { QuotationSummary, QuotationStatus } from '@/types/quotation'
import { QUOTATION_STATUS_LABELS } from '@/types/quotation'

const STATUSES: { value: QuotationStatus; label: string }[] = (
  Object.entries(QUOTATION_STATUS_LABELS) as [QuotationStatus, string][]
).map(([value, label]) => ({ value, label }))

// ── Row Skeleton ──────────────────────────────────────────────────────────────

function QuotationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-2.5 w-32" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full hidden sm:block" />
      <Skeleton className="h-4 w-20 hidden md:block" />
      <Skeleton className="h-3 w-24 hidden lg:block" />
    </div>
  )
}

// ── Quotation Row ─────────────────────────────────────────────────────────────

function QuotationRow({ quotation }: { quotation: QuotationSummary }) {
  return (
    <Link
      href={`/quotations/${quotation.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
        <FileSearch className="h-4 w-4" />
      </div>

      {/* Title + vendor */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {quotation.quotation_number}
          {quotation.rfq && (
            <span className="ml-1.5 font-normal text-[--color-foreground-muted]">
              · {quotation.rfq.title}
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {quotation.vendor?.name ?? '—'}
          {' · '}
          {formatDistanceToNow(new Date(quotation.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Status */}
      <QuotationStatusBadge status={quotation.status} className="hidden sm:inline-flex" />

      {/* Grand Total */}
      <div className="hidden md:block text-sm font-semibold text-[--color-foreground] tabular-nums">
        {formatCurrency(quotation.grand_total)}
      </div>

      {/* Delivery days */}
      <div className="hidden lg:block text-xs text-[--color-foreground-muted]">
        {quotation.delivery_days != null ? `${quotation.delivery_days}d delivery` : '—'}
      </div>
    </Link>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface QuotationListProps {
  quotations: QuotationSummary[]
  total: number
  hasNextPage: boolean
  page: number
}

export function QuotationList({ quotations, total, hasNextPage, page }: QuotationListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(searchValue, 300)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key !== 'page') params.delete('page')
      startTransition(() => {
        router.push(`/quotations?${params.toString()}`)
      })
    },
    [router, searchParams],
  )

  useEffect(() => {
    updateParam('search', debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const status = searchParams.get('status') ?? ''
  const hasFilters = !!(searchValue || status)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <Input
            placeholder="Search by number or notes…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={status}
            onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild size="default">
            <Link href="/quotations/new">
              <Plus className="h-4 w-4" />
              New Quotation
            </Link>
          </Button>
        </div>
      </div>

      {/* Result count */}
      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} quotation{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <QuotationRowSkeleton key={i} />
          ))}
        </div>
      ) : quotations.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-8 w-8" />}
          title="No quotations found"
          description={
            hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first quotation or wait for vendors to respond to RFQs.'
          }
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href="/quotations/new">
                  <Plus className="h-4 w-4" />
                  New Quotation
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {quotations.map((q) => (
            <QuotationRow key={q.id} quotation={q} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => updateParam('page', String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
