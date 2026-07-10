import Link from 'next/link'
import { FileSearch, CheckCircle2, XCircle, Clock, TrendingDown, ArrowRight } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getQuotationStats } from '@/lib/supabase/quotations'
import { formatCurrency } from '@/lib/utils'

// ── Stat item ─────────────────────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3.5">
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[--color-foreground-muted]">{label}</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-[--color-foreground]">{value}</p>
      </div>
    </div>
  )
}

// ── Widget ────────────────────────────────────────────────────────────────────

export async function QuotationStatsWidget() {
  let stats
  try {
    const companyId = await getCompanyId()
    stats = await getQuotationStats(companyId)
  } catch {
    // Not authenticated or no data — render a placeholder
    stats = { total: 0, pending_review: 0, approved: 0, rejected: 0, lowest_bid: null }
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[--color-primary]/10 text-[--color-primary]">
            <FileSearch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[--color-foreground]">Quotations</h3>
            <p className="text-xs text-[--color-foreground-muted]">Live overview</p>
          </div>
        </div>
        <Link
          href="/quotations"
          className="flex items-center gap-1 text-xs text-[--color-primary] hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatItem
          icon={FileSearch}
          label="Total"
          value={stats.total}
          iconColor="bg-[--color-primary]/10 text-[--color-primary]"
        />
        <StatItem
          icon={Clock}
          label="Pending Review"
          value={stats.pending_review}
          iconColor="bg-amber-100 text-amber-600"
        />
        <StatItem
          icon={CheckCircle2}
          label="Approved"
          value={stats.approved}
          iconColor="bg-green-100 text-green-600"
        />
        <StatItem
          icon={XCircle}
          label="Rejected"
          value={stats.rejected}
          iconColor="bg-red-100 text-red-600"
        />
        <StatItem
          icon={TrendingDown}
          label="Lowest Bid"
          value={stats.lowest_bid != null ? formatCurrency(stats.lowest_bid) : '—'}
          iconColor="bg-cyan-100 text-cyan-600"
        />
      </div>
    </div>
  )
}
