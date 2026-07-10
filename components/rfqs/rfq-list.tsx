'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, FileText, Calendar, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/shared/loading-states'
import { EmptyState } from '@/components/shared/loading-states'
import { RFQStatusBadge, RFQPriorityBadge } from './rfq-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDate } from '@/lib/utils'
import type { RFQSummary, RFQStatus, RFQPriority } from '@/types/rfq'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: { value: RFQStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PRIORITIES: { value: RFQPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

// ── Row skeleton ──────────────────────────────────────────────────────────────

function RFQRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-2.5 w-32" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
      <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
      <Skeleton className="h-3 w-24 hidden lg:block" />
    </div>
  )
}

// ── RFQ row ───────────────────────────────────────────────────────────────────

interface RFQRowProps {
  rfq: RFQSummary
}

function RFQRow({ rfq }: RFQRowProps) {
  const isOverdue =
    rfq.due_date && rfq.status !== 'awarded' && rfq.status !== 'cancelled'
      ? new Date(rfq.due_date) < new Date()
      : false

  return (
    <Link
      href={`/rfqs/${rfq.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
        <FileText className="h-4 w-4" />
      </div>

      {/* Title + vendor */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {rfq.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {rfq.vendor?.name ?? '—'}
          {' · '}
          {formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Status */}
      <RFQStatusBadge status={rfq.status} className="hidden sm:inline-flex" />

      {/* Priority */}
      <RFQPriorityBadge priority={rfq.priority} className="hidden md:inline-flex" />

      {/* Due date */}
      <div className="hidden lg:flex items-center gap-1 text-xs text-[--color-foreground-muted]">
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
        {rfq.due_date ? (
          <span className={isOverdue ? 'text-[--color-error] font-medium' : ''}>
            {formatDate(rfq.due_date)}
          </span>
        ) : (
          <span>No due date</span>
        )}
      </div>
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface RFQListProps {
  rfqs: RFQSummary[]
  total: number
  hasNextPage: boolean
  page: number
}

export function RFQList({ rfqs, total, hasNextPage, page }: RFQListProps) {
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
        router.push(`/rfqs?${params.toString()}`)
      })
    },
    [router, searchParams],
  )

  useEffect(() => {
    updateParam('search', debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const status = searchParams.get('status') ?? ''
  const priority = searchParams.get('priority') ?? ''

  const hasFilters = !!(searchValue || status || priority)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <Input
            placeholder="Search RFQs…"
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
            <SelectTrigger className="w-40">
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

          <Select
            value={priority}
            onValueChange={(v) => updateParam('priority', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild size="default">
            <Link href="/rfqs/new">
              <Plus className="h-4 w-4" />
              New RFQ
            </Link>
          </Button>
        </div>
      </div>

      {/* Result count */}
      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} RFQ{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <RFQRowSkeleton key={i} />
          ))}
        </div>
      ) : rfqs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No RFQs found"
          description={
            hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first RFQ to start requesting quotes from vendors.'
          }
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href="/rfqs/new">
                  <Plus className="h-4 w-4" />
                  New RFQ
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {rfqs.map((rfq) => (
            <RFQRow key={rfq.id} rfq={rfq} />
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
