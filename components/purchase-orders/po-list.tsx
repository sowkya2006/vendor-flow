'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, ShoppingCart, Calendar, DollarSign } from 'lucide-react'
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
import { POStatusBadge } from '@/components/rfqs/rfq-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PurchaseOrderSummary, POStatus } from '@/types/purchase-order'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: { value: POStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ── Row skeleton ──────────────────────────────────────────────────────────────

function PORowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-2.5 w-28" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full hidden sm:block" />
      <Skeleton className="h-3 w-20 hidden md:block" />
      <Skeleton className="h-3 w-24 hidden lg:block" />
    </div>
  )
}

// ── PO row ────────────────────────────────────────────────────────────────────

interface PORowProps {
  po: PurchaseOrderSummary
}

function PORow({ po }: PORowProps) {
  const isOverdue =
    po.due_date && po.status !== 'completed' && po.status !== 'cancelled'
      ? new Date(po.due_date) < new Date()
      : false

  return (
    <Link
      href={`/purchase-orders/${po.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
        <ShoppingCart className="h-4 w-4" />
      </div>

      {/* PO number + vendor */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {po.po_number}
        </p>
        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {po.vendor?.name ?? '—'}
          {' · '}
          {formatDistanceToNow(new Date(po.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Status */}
      <POStatusBadge status={po.status} className="hidden sm:inline-flex" />

      {/* Total amount */}
      {po.total_amount != null && (
        <div className="hidden md:flex items-center gap-1 text-xs font-medium text-[--color-foreground]">
          <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-[--color-foreground-muted]" />
          {formatCurrency(po.total_amount)}
        </div>
      )}

      {/* Due date */}
      <div className="hidden lg:flex items-center gap-1 text-xs text-[--color-foreground-muted]">
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
        {po.due_date ? (
          <span className={isOverdue ? 'text-[--color-error] font-medium' : ''}>
            {formatDate(po.due_date)}
          </span>
        ) : (
          <span>No due date</span>
        )}
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface POListProps {
  orders: PurchaseOrderSummary[]
  total: number
  hasNextPage: boolean
  page: number
}

export function POList({ orders, total, hasNextPage, page }: POListProps) {
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
        router.push(`/purchase-orders?${params.toString()}`)
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
            placeholder="Search by PO number…"
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
            <Link href="/purchase-orders/new">
              <Plus className="h-4 w-4" />
              New PO
            </Link>
          </Button>
        </div>
      </div>

      {/* Result count */}
      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} purchase order{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <PORowSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="No purchase orders found"
          description={
            hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first purchase order to start tracking procurement.'
          }
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href="/purchase-orders/new">
                  <Plus className="h-4 w-4" />
                  New PO
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {orders.map((po) => (
            <PORow key={po.id} po={po} />
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
