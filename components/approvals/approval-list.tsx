'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, ClipboardList, Calendar } from 'lucide-react'
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
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { ApprovalStatusBadge, ApprovalPriorityBadge } from './approval-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ApprovalRequestSummary, ApprovalRequestStatus, ApprovalEntityType } from '@/types/approval'
import { APPROVAL_STATUS_LABELS, APPROVAL_ENTITY_LABELS, APPROVAL_PRIORITY_LABELS } from '@/types/approval'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUSES = Object.entries(APPROVAL_STATUS_LABELS).map(([value, label]) => ({
  value: value as ApprovalRequestStatus,
  label,
}))

const ENTITY_TYPES = Object.entries(APPROVAL_ENTITY_LABELS).map(([value, label]) => ({
  value: value as ApprovalEntityType,
  label,
}))

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function ApprovalRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-56" />
        <Skeleton className="h-2.5 w-36" />
      </div>
      <Skeleton className="h-5 w-28 rounded-full hidden sm:block" />
      <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
      <Skeleton className="h-3 w-20 hidden lg:block" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function ApprovalRow({ request, basePath }: { request: ApprovalRequestSummary; basePath: string }) {
  return (
    <Link
      href={`/approvals/${request.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
        <ClipboardList className="h-4 w-4" />
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {request.title}
          {request.entity_ref && (
            <span className="ml-1.5 font-normal text-[--color-foreground-muted]">
              · {request.entity_ref}
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {APPROVAL_ENTITY_LABELS[request.entity_type]}
          {request.requester?.full_name
            ? ` · ${request.requester.full_name}`
            : request.requester?.email
            ? ` · ${request.requester.email}`
            : ''}
          {' · '}
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Status */}
      <ApprovalStatusBadge status={request.status} className="hidden sm:inline-flex" />

      {/* Priority */}
      <ApprovalPriorityBadge priority={request.priority} className="hidden md:inline-flex" />

      {/* Amount */}
      {request.amount != null && (
        <div className="hidden lg:block text-sm font-semibold tabular-nums text-[--color-foreground]">
          {formatCurrency(request.amount)}
        </div>
      )}

      {/* Step progress */}
      {request.total_steps > 0 && (
        <div className="hidden xl:flex items-center gap-1 text-xs text-[--color-foreground-muted]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          {request.current_step}/{request.total_steps} steps
        </div>
      )}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ApprovalListProps {
  requests: ApprovalRequestSummary[]
  total: number
  hasNextPage: boolean
  page: number
  basePath?: string
  showNew?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function ApprovalList({
  requests,
  total,
  hasNextPage,
  page,
  basePath = '/approvals',
  showNew = false,
  emptyTitle = 'No approval requests found',
  emptyDescription = 'Try adjusting your search or filters.',
}: ApprovalListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(searchValue, 300)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      startTransition(() => router.push(`${basePath}?${params.toString()}`))
    },
    [router, searchParams, basePath],
  )

  useEffect(() => {
    updateParam('search', debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const status = searchParams.get('status') ?? ''
  const entityType = searchParams.get('entity_type') ?? ''
  const hasFilters = !!(searchValue || status || entityType)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <Input
            placeholder="Search by title or reference…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityType} onValueChange={(v) => updateParam('entity_type', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showNew && (
            <Button asChild>
              <Link href="/approvals/new">
                <Plus className="h-4 w-4" />
                New Request
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Count */}
      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} request{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <ApprovalRowSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={emptyTitle}
          description={hasFilters ? 'Try adjusting your search or filters.' : emptyDescription}
        />
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <ApprovalRow key={r.id} request={r} basePath={basePath} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}>
            Previous
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" disabled={!hasNextPage}
            onClick={() => updateParam('page', String(page + 1))}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
