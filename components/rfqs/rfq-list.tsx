'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Plus, FileText, Calendar,
  ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/shared/loading-states'
import { RFQStatusBadge, RFQPriorityBadge } from './rfq-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDate, cn } from '@/lib/utils'
import type { RFQSummary, RFQStatus, RFQPriority } from '@/types/rfq'

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

// Priority icon colors for visual emphasis
const PRIORITY_DOT: Record<RFQPriority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
}

function RFQRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-52" />
        <Skeleton className="h-2.5 w-36" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
      <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
      <Skeleton className="h-3 w-24 hidden lg:block" />
    </div>
  )
}

function RFQRow({ rfq }: { rfq: RFQSummary }) {
  const isOverdue =
    rfq.due_date &&
    rfq.status !== 'awarded' &&
    rfq.status !== 'cancelled' &&
    new Date(rfq.due_date) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/rfqs/${rfq.id}`}
        className={cn(
          'group flex items-center gap-4 rounded-2xl border px-5 py-4',
          'bg-white/[0.04]',
          'border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
          'transition-all duration-200',
          'hover:border-[--color-primary]/30 hover:shadow-[var(--shadow-md)]',
          'hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]',
        )}
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-primary]/10 to-indigo-500/10 border border-[--color-primary]/15 text-[--color-primary]">
          <FileText className="h-4 w-4" />
        </div>

        {/* Title + vendor */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
            {rfq.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
            {rfq.vendor?.name ?? 'No vendor assigned'}
            {' · '}
            <span className="text-[--color-foreground-subtle]">
              {formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true })}
            </span>
          </p>
        </div>

        {/* Status */}
        <RFQStatusBadge status={rfq.status} className="hidden sm:inline-flex" />

        {/* Priority with dot */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[rfq.priority])} />
          <RFQPriorityBadge priority={rfq.priority} />
        </div>

        {/* Due date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs shrink-0">
          <Calendar className="h-3.5 w-3.5 text-[--color-foreground-subtle]" />
          {rfq.due_date ? (
            <span className={cn(
              isOverdue ? 'font-semibold text-[--color-error]' : 'text-[--color-foreground-muted]',
            )}>
              {formatDate(rfq.due_date)}
            </span>
          ) : (
            <span className="text-[--color-foreground-subtle]">No due date</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

interface RFQListProps {
  rfqs: RFQSummary[]
  total: number
  hasNextPage: boolean
  page: number
  canCreate?: boolean
}

export function RFQList({ rfqs, total, hasNextPage, page, canCreate = true }: RFQListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(searchValue, 300)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      value ? params.set(key, value) : params.delete(key)
      if (key !== 'page') params.delete('page')
      startTransition(() => router.push(`/rfqs?${params.toString()}`))
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
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-subtle]" />
          <Input
            placeholder="Search RFQs by title or vendor…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[--color-foreground-subtle] shrink-0 hidden sm:block" />
          <Select value={status} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(v) => updateParam('priority', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canCreate && (
            <Button asChild size="default" className="shrink-0">
              <Link href="/rfqs/new">
                <Plus className="h-4 w-4" />
                New RFQ
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Result count ────────────────────────────────────── */}
      {total > 0 && (
        <p className="text-[13px] text-[--color-foreground-muted]">
          <span className="font-semibold text-[--color-foreground]">{total}</span>{' '}
          RFQ{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* ── List ────────────────────────────────────────────── */}
      {isPending ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <RFQRowSkeleton key={i} />)}
        </div>
      ) : rfqs.length === 0 ? (
        <EmptyRFQs hasFilters={hasFilters} canCreate={canCreate} />
      ) : (
        <div className="space-y-2.5">
          {rfqs.map((rfq) => <RFQRow key={rfq.id} rfq={rfq} />)}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">
            Page <span className="font-semibold text-[--color-foreground]">{page}</span>
          </span>
          <Button
            variant="outline" size="sm"
            disabled={!hasNextPage}
            onClick={() => updateParam('page', String(page + 1))}
            className="gap-1.5"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function EmptyRFQs({ hasFilters, canCreate }: { hasFilters: boolean; canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--color-background-muted]">
        <FileText className="h-7 w-7 text-[--color-foreground-subtle]" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[--color-foreground]">
          {hasFilters ? 'No RFQs match your filters' : 'No RFQs yet'}
        </p>
        <p className="mt-1 text-sm text-[--color-foreground-muted]">
          {hasFilters
            ? 'Try adjusting your search or filters.'
            : canCreate
              ? 'Create your first RFQ to start collecting vendor quotes.'
              : 'No RFQs to review yet. They will appear here once created.'}
        </p>
      </div>
      {!hasFilters && canCreate && (
        <Button asChild className="mt-1">
          <Link href="/rfqs/new">
            <Plus className="h-4 w-4" />
            Create your first RFQ
          </Link>
        </Button>
      )}
    </div>
  )
}
