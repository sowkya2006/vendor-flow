'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VendorCard } from './vendor-card'
import { EmptyState } from '@/components/shared/loading-states'
import { Skeleton } from '@/components/shared/loading-states'
import type { VendorSummary, VendorStatus, VendorCategory } from '@/types/vendor'
import { Building2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

const STATUSES: { value: VendorStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'services', label: 'Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
]

interface VendorListProps {
  vendors: VendorSummary[]
  total: number
  hasNextPage: boolean
  page: number
}

export function VendorList({ vendors, total, hasNextPage, page }: VendorListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for the search input so typing feels instant
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
      // Reset to page 1 when filter changes
      if (key !== 'page') params.delete('page')
      startTransition(() => {
        router.push(`/vendors?${params.toString()}`)
      })
    },
    [router, searchParams],
  )

  // Push debounced search to URL
  useEffect(() => {
    updateParam('search', debouncedSearch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const status = searchParams.get('status') ?? ''
  const category = searchParams.get('category') ?? ''

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <Input
            placeholder="Search vendors…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36">
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
            value={category}
            onValueChange={(v) => updateParam('category', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild size="default">
            <Link href="/vendors/new">
              <Plus className="h-4 w-4" />
              Add vendor
            </Link>
          </Button>
        </div>
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="text-xs text-[--color-foreground-muted]">
          {total} vendor{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Grid */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No vendors found"
          description={
            searchValue || status || category
              ? 'Try adjusting your filters.'
              : 'Add your first vendor to get started.'
          }
          action={
            !searchValue && !status && !category ? (
              <Button asChild>
                <Link href="/vendors/new">
                  <Plus className="h-4 w-4" />
                  Add vendor
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
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
