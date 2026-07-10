import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Search, Star, Building2, Globe, Mail, Phone, MapPin, Package, ChevronRight, Sparkles, ShieldCheck, Plus, ListFilter as Filter } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'
import { Skeleton, EmptyState } from '@/components/shared/loading-states'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { VENDOR_CATEGORY_LABELS } from '@/types/vendor'
import type { VendorSummary, VendorCategory } from '@/types/vendor'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Vendor Marketplace — VendorFlow' }

// ── Category filter pills ─────────────────────────────────────────────────────

const CATEGORIES: { value: VendorCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
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

const CATEGORY_COLORS: Record<VendorCategory, string> = {
  software: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  hardware: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  services: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  consulting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  logistics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  finance: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  legal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  other: 'bg-[--color-muted] text-[--color-foreground-muted]',
}

// ── Vendor card ───────────────────────────────────────────────────────────────

function VendorMarketplaceCard({ vendor }: { vendor: VendorSummary }) {
  const initials = vendor.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const catColor =
    vendor.category ? CATEGORY_COLORS[vendor.category] : CATEGORY_COLORS.other

  return (
    <Link
      href={`/vendors/${vendor.id}`}
      className="group relative flex flex-col gap-4 rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm] transition-all hover:shadow-[--shadow-md] hover:border-[--color-primary]/30 hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Active badge */}
      {vendor.status === 'active' && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--color-primary]/10 text-sm font-bold text-[--color-primary]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
            {vendor.name}
          </p>
          {vendor.category && (
            <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', catColor)}>
              {VENDOR_CATEGORY_LABELS[vendor.category]}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 text-xs text-[--color-foreground-muted]">
        {vendor.email && (
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vendor.email}</span>
          </div>
        )}
        {vendor.website && (
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[--color-border] pt-3 mt-auto">
        {vendor.contract_value ? (
          <div>
            <p className="text-[10px] text-[--color-foreground-muted]">Contract Value</p>
            <p className="text-xs font-semibold text-[--color-foreground]">
              {formatCurrency(vendor.contract_value)}/yr
            </p>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 text-xs font-medium text-[--color-primary] opacity-0 group-hover:opacity-100 transition-opacity">
          View Profile <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

async function MarketplaceStats({ companyId }: { companyId: string }) {
  const [all, active, pending] = await Promise.all([
    getVendors(companyId, { pageSize: 1 }),
    getVendors(companyId, { status: 'active', pageSize: 1 }),
    getVendors(companyId, { status: 'pending', pageSize: 1 }),
  ])

  const stats = [
    { label: 'Total Vendors', value: all.total },
    { label: 'Active', value: active.total },
    { label: 'Pending Verification', value: pending.total },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-3 text-center shadow-[--shadow-sm]">
          <p className="text-2xl font-bold text-[--color-foreground]">{s.value}</p>
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Vendor grid ───────────────────────────────────────────────────────────────

async function VendorGrid({
  companyId,
  category,
  search,
  page,
}: {
  companyId: string
  category: string
  search: string
  page: number
}) {
  const result = await getVendors(companyId, {
    category: (category as VendorCategory) || undefined,
    search: search || undefined,
    status: 'active',
    page,
    pageSize: 12,
  })

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No vendors found"
        description={
          search || category
            ? 'Try adjusting your filters or search terms.'
            : 'Add vendors to start building your supplier network.'
        }
        action={
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Vendor
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[--color-foreground-muted]">
        {result.total} vendor{result.total !== 1 ? 's' : ''} found
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.data.map((vendor) => (
          <VendorMarketplaceCard key={vendor.id} vendor={vendor} />
        ))}
      </div>

      {/* Pagination */}
      {(page > 1 || result.hasNextPage) && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-[--color-border]">
          <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? (
              <Link href={`/vendors/marketplace?page=${page - 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}>
                Previous
              </Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-xs text-[--color-foreground-muted]">Page {page}</span>
          <Button variant="outline" size="sm" asChild={result.hasNextPage} disabled={!result.hasNextPage}>
            {result.hasNextPage ? (
              <Link href={`/vendors/marketplace?page=${page + 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}>
                Next
              </Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

export default async function VendorMarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = params.category ?? ''
  const search = params.search ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      {/* Hero */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[--color-primary]/10 via-[--color-card] to-[--color-background-subtle] border border-[--color-border] px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[--color-primary]" />
              <span className="text-xs font-semibold text-[--color-primary] uppercase tracking-wide">
                Vendor Marketplace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[--color-foreground]">
              Discover & Manage Suppliers
            </h1>
            <p className="mt-1 text-sm text-[--color-foreground-muted]">
              Browse your approved vendor network, compare capabilities, and start procurement workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/vendors">
                <Filter className="h-4 w-4 mr-1" />
                All Vendors
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/vendors/new">
                <Plus className="h-4 w-4 mr-1" />
                Add Vendor
              </Link>
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            { icon: ShieldCheck, label: 'Verified Vendors Only' },
            { icon: Star, label: 'Rated by your team' },
            { icon: Package, label: 'Full catalog access' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-[--color-border] bg-[--color-card] px-3 py-1.5 text-xs font-medium text-[--color-foreground-muted]"
            >
              <Icon className="h-3.5 w-3.5 text-[--color-primary]" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <Suspense fallback={<div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
          <MarketplaceStats companyId={companyId} />
        </Suspense>
      </div>

      {/* Search bar */}
      <form method="GET" action="/vendors/marketplace" className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search vendors by name…"
            className="flex h-9 w-full rounded-md border border-[--color-input] bg-transparent pl-9 pr-3 text-sm placeholder:text-[--color-foreground-subtle] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => (
          <Link
            key={value || 'all'}
            href={`/vendors/marketplace${value ? `?category=${value}` : ''}${search ? `${value ? '&' : '?'}search=${search}` : ''}`}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              category === value
                ? 'bg-[--color-primary] text-white'
                : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent] hover:text-[--color-foreground]',
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Vendor grid */}
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        }
      >
        <VendorGrid companyId={companyId} category={category} search={search} page={page} />
      </Suspense>
    </PageContainer>
  )
}
