'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Building2, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { VendorCard } from './vendor-card'
import { Skeleton } from '@/components/shared/loading-states'
import { cn } from '@/lib/utils'
import type { VendorSummary, VendorStatus, VendorCategory } from '@/types/vendor'
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
  canCreate?: boolean
}

export function VendorList({ vendors, total, hasNextPage, page, canCreate = true }: VendorListProps) {
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
      startTransition(() => router.push(`/vendors?${params.toString()}`))
    },
    [router, searchParams],
  )

  useEffect(() => {
    updateParam('search', debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const status = searchParams.get('status') ?? ''
  const category = searchParams.get('category') ?? ''
  const hasFilters = !!(searchValue || status || category)

  return (
    <div className="space-y-5">
      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-subtle]" />
          <Input
            placeholder="Search vendors by name, email…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filters + CTA */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[--color-foreground-subtle] shrink-0 hidden sm:block" />

          <Select value={status} onValueChange={(v) => updateParam('status', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(v) => updateParam('category', v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canCreate && (
            <Button asChild size="default" className="shrink-0">
              <Link href="/vendors/new">
                <Plus className="h-4 w-4" />
                Add vendor
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────── */}
      {total > 0 && (
        <p className="text-[13px] text-[--color-foreground-muted]">
          <span className="font-semibold text-[--color-foreground]">{total}</span>{' '}
          vendor{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* ── Grid ──────────────────────────────────────────── */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyVendors hasFilters={hasFilters} canCreate={canCreate} />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {vendors.map((vendor) => (
            <motion.div
              key={vendor.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.22 }}
            >
              <VendorCard vendor={vendor} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ────────────────────────────────────── */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between border-t border-[--color-border] pt-4">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
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
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function EmptyVendors({ hasFilters, canCreate }: { hasFilters: boolean; canCreate: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--color-background-muted]">
        <Building2 className="h-7 w-7 text-[--color-foreground-subtle]" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[--color-foreground]">
          {hasFilters ? 'No vendors match your filters' : 'No vendors yet'}
        </p>
        <p className="mt-1 text-sm text-[--color-foreground-muted]">
          {hasFilters
            ? 'Try adjusting your search or filter criteria.'
            : canCreate
              ? 'Add your first vendor to start building your supplier network.'
              : 'No vendors have been added yet. Check back later.'}
        </p>
      </div>
      {!hasFilters && canCreate && (
        <Button asChild className="mt-1">
          <Link href="/vendors/new">
            <Plus className="h-4 w-4" />
            Add your first vendor
          </Link>
        </Button>
      )}
    </div>
  )
}
