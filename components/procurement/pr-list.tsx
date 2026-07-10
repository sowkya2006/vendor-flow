'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, ClipboardList, Calendar, DollarSign } from 'lucide-react'
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
import { PRStatusBadge, PRPriorityBadge } from './pr-status-badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PR_STATUS_LABELS, PR_PRIORITY_LABELS } from '@/types/purchase-request'
import type { PRSummary, PRStatus, PRPriority } from '@/types/purchase-request'

const STATUSES = Object.entries(PR_STATUS_LABELS).map(([v, l]) => ({
  value: v as PRStatus,
  label: l,
}))

const PRIORITIES = Object.entries(PR_PRIORITY_LABELS).map(([v, l]) => ({
  value: v as PRPriority,
  label: l,
}))

function PRRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-52" />
        <Skeleton className="h-2.5 w-36" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full hidden sm:block" />
      <Skeleton className="h-5 w-16 rounded-full hidden md:block" />
      <Skeleton className="h-3 w-20 hidden lg:block" />
    </div>
  )
}

function PRRow({ pr }: { pr: PRSummary }) {
  return (
    <Link
      href={`/procurement/${pr.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
        <ClipboardList className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {pr.title}
          {pr.pr_number && (
            <span className="ml-1.5 font-mono text-xs font-normal text-[--color-foreground-muted]">
              {pr.pr_number}
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-[--color-foreground-muted]">
          {pr.department ? `${pr.department} · ` : ''}
          {pr.requester?.full_name ?? pr.requester?.email ?? 'Unknown'}
          {' · '}
          {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}
        </p>
      </div>

      <PRStatusBadge status={pr.status} className="hidden sm:inline-flex" />
      <PRPriorityBadge priority={pr.priority} className="hidden md:inline-flex" />

      {pr.budget_amount != null && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-[--color-foreground-muted]">
          <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
          {formatCurrency(pr.budget_amount)}
        </div>
      )}

      {pr.required_date && (
        <div className="hidden xl:flex items-center gap-1 text-xs text-[--color-foreground-muted]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          {formatDate(pr.required_date)}
        </div>
      )}
    </Link>
  )
}

interface PRListProps {
  prs: PRSummary[]
  total: number
  hasNextPage: boolean
  page: number
}

export function PRList({ prs, total, hasNextPage, page }: PRListProps) {
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
      startTransition(() => router.push(`/procurement?${params.toString()}`))
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <Input
            placeholder="Search purchase requests…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44">
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
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/procurement/new">
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} request{total !== 1 ? 's' : ''} found
        </p>
      )}

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <PRRowSkeleton key={i} />)}
        </div>
      ) : prs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No purchase requests found"
          description={
            hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first purchase request to get started.'
          }
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href="/procurement/new">
                  <Plus className="h-4 w-4" />
                  New Request
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {prs.map((pr) => <PRRow key={pr.id} pr={pr} />)}
        </div>
      )}

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
