'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  Sparkles,
  TrendingDown,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuotationStatusBadge } from './quotation-status-badge'
import { formatCurrency } from '@/lib/utils'
import type { QuotationSummary, QuotationComparisonRow } from '@/types/quotation'
import { cn } from '@/lib/utils'

// ── Build comparison rows ─────────────────────────────────────────────────────

function buildRows(quotations: QuotationSummary[]): QuotationComparisonRow[] {
  if (quotations.length === 0) return []

  const eligible = quotations.filter((q) =>
    ['submitted', 'under_review', 'shortlisted', 'approved'].includes(q.status),
  )

  const lowestPrice = eligible.length
    ? Math.min(...eligible.map((q) => q.grand_total))
    : Infinity

  // Best value = lowest grand_total relative to delivery speed (simple heuristic)
  const scores = eligible.map((q) => {
    const priceScore = lowestPrice > 0 ? lowestPrice / (q.grand_total || 1) : 1
    const deliveryScore = q.delivery_days ? 1 / q.delivery_days : 0.5
    return { id: q.id, score: priceScore * 0.7 + deliveryScore * 0.3 }
  })
  const bestValueId = scores.sort((a, b) => b.score - a.score)[0]?.id
  const recommendedId = eligible.find((q) => q.status === 'approved')?.id
    ?? eligible.find((q) => q.status === 'shortlisted')?.id
    ?? bestValueId

  return quotations.map((q) => ({
    quotation: q,
    vendor_name: q.vendor?.name ?? '—',
    grand_total: q.grand_total,
    discount_amount: q.discount_amount,
    tax_amount: q.tax_amount,
    delivery_days: q.delivery_days,
    warranty_months: q.warranty_months,
    lead_time_days: q.lead_time_days,
    vendor_rating: null,
    status: q.status,
    is_lowest_price: q.grand_total === lowestPrice,
    is_best_value: q.id === bestValueId,
    is_recommended: q.id === recommendedId,
  }))
}

// ── Sort logic ────────────────────────────────────────────────────────────────

type SortKey = 'grand_total' | 'discount_amount' | 'tax_amount' | 'delivery_days' | 'warranty_months' | 'lead_time_days'
type SortDir = 'asc' | 'desc'

function sortRows(rows: QuotationComparisonRow[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = a[key] ?? Infinity
    const bv = b[key] ?? Infinity
    return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  active: boolean
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
      >
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

// ── Badge chips ───────────────────────────────────────────────────────────────

function HighlightBadge({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface QuotationCompareProps {
  quotations: QuotationSummary[]
  rfqTitle?: string
}

export function QuotationCompare({ quotations, rfqTitle }: QuotationCompareProps) {
  const [sortKey, setSortKey] = useState<SortKey>('grand_total')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(() => {
    const built = buildRows(quotations)
    return sortRows(built, sortKey, sortDir)
  }, [quotations, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[--color-border] py-16 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-[--color-foreground-subtle]" />
        <p className="text-sm font-medium text-[--color-foreground]">No quotations to compare</p>
        <p className="mt-1 text-xs text-[--color-foreground-muted]">
          Quotations must be submitted or under review to appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <HighlightBadge icon={TrendingDown} label="Lowest Price" color="bg-green-100 text-green-700" />
        <HighlightBadge icon={Sparkles} label="Best Value" color="bg-blue-100 text-blue-700" />
        <HighlightBadge icon={Trophy} label="Recommended" color="bg-amber-100 text-amber-700" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Quotation
              </th>
              <ColHeader label="Grand Total" sortKey="grand_total" active={sortKey === 'grand_total'} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Discount" sortKey="discount_amount" active={sortKey === 'discount_amount'} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Tax" sortKey="tax_amount" active={sortKey === 'tax_amount'} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Delivery" sortKey="delivery_days" active={sortKey === 'delivery_days'} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Warranty" sortKey="warranty_months" active={sortKey === 'warranty_months'} dir={sortDir} onSort={handleSort} />
              <ColHeader label="Lead Time" sortKey="lead_time_days" active={sortKey === 'lead_time_days'} dir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border]">
            {rows.map((row) => (
              <tr
                key={row.quotation.id}
                className={cn(
                  'transition-colors hover:bg-[--color-background-subtle]',
                  row.is_recommended && 'bg-amber-50/40',
                )}
              >
                {/* Vendor */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-[--color-foreground]">{row.vendor_name}</span>
                    <span className="text-xs text-[--color-foreground-muted]">
                      {row.quotation.vendor?.category ?? ''}
                    </span>
                  </div>
                </td>

                {/* Quotation number + highlights */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-[--color-foreground]">
                      {row.quotation.quotation_number}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {row.is_lowest_price && (
                        <HighlightBadge icon={TrendingDown} label="Lowest" color="bg-green-100 text-green-700" />
                      )}
                      {row.is_best_value && (
                        <HighlightBadge icon={Sparkles} label="Best Value" color="bg-blue-100 text-blue-700" />
                      )}
                      {row.is_recommended && (
                        <HighlightBadge icon={Trophy} label="Recommended" color="bg-amber-100 text-amber-700" />
                      )}
                    </div>
                  </div>
                </td>

                {/* Grand Total */}
                <td className={cn('px-4 py-3 font-bold tabular-nums', row.is_lowest_price ? 'text-green-700' : 'text-[--color-foreground]')}>
                  {formatCurrency(row.grand_total)}
                </td>

                {/* Discount */}
                <td className="px-4 py-3 tabular-nums text-[--color-foreground-muted]">
                  {row.discount_amount > 0 ? (
                    <span className="text-green-600">− {formatCurrency(row.discount_amount)}</span>
                  ) : (
                    <span className="text-[--color-foreground-subtle]">—</span>
                  )}
                </td>

                {/* Tax */}
                <td className="px-4 py-3 tabular-nums text-[--color-foreground-muted]">
                  {row.tax_amount > 0 ? formatCurrency(row.tax_amount) : <span className="text-[--color-foreground-subtle]">—</span>}
                </td>

                {/* Delivery */}
                <td className="px-4 py-3 text-[--color-foreground-muted]">
                  {row.delivery_days != null ? `${row.delivery_days} days` : <span className="text-[--color-foreground-subtle]">—</span>}
                </td>

                {/* Warranty */}
                <td className="px-4 py-3 text-[--color-foreground-muted]">
                  {row.warranty_months != null ? `${row.warranty_months} mo` : <span className="text-[--color-foreground-subtle]">—</span>}
                </td>

                {/* Lead Time */}
                <td className="px-4 py-3 text-[--color-foreground-muted]">
                  {row.lead_time_days != null ? `${row.lead_time_days} days` : <span className="text-[--color-foreground-subtle]">—</span>}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <QuotationStatusBadge status={row.status} />
                </td>

                {/* Link */}
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                    <Link href={`/quotations/${row.quotation.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rfqTitle && (
        <p className="text-xs text-[--color-foreground-muted] text-center">
          Comparing {rows.length} quotation{rows.length !== 1 ? 's' : ''} for <strong>{rfqTitle}</strong>
        </p>
      )}
    </div>
  )
}
