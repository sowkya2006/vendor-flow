import Link from 'next/link'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { getApprovalStats } from '@/lib/supabase/approvals'

// ---------------------------------------------------------------------------
// Stat item
// ---------------------------------------------------------------------------

function StatItem({
  icon: Icon,
  label,
  value,
  iconColor,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  iconColor: string
  href?: string
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3.5 ${
        href
          ? 'hover:border-[--color-primary]/30 hover:bg-[--color-primary]/5 transition-colors'
          : ''
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconColor}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[--color-foreground-muted]">{label}</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums text-[--color-foreground]">{value}</p>
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export async function ApprovalStatsWidget() {
  let stats
  try {
    // Both calls are deduplicated by React cache() — getUser() is invoked
    // at most once per render pass no matter how many components call it.
    const [user, companyId] = await Promise.all([getUser(), getCompanyId()])
    stats = await getApprovalStats(companyId, user.id)
  } catch {
    stats = {
      total: 0,
      pending: 0,
      approved_today: 0,
      rejected_today: 0,
      awaiting_my_approval: 0,
      completion_rate: 0,
      avg_approval_hours: null,
    }
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[--color-foreground]">Approvals</h3>
            <p className="text-xs text-[--color-foreground-muted]">Live workflow status</p>
          </div>
        </div>
        <Link
          href="/approvals"
          className="flex items-center gap-1 text-xs text-[--color-primary] hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatItem
          icon={ClipboardList}
          label="Total"
          value={stats.total}
          iconColor="bg-[--color-primary]/10 text-[--color-primary]"
          href="/approvals"
        />
        <StatItem
          icon={Clock}
          label="Pending"
          value={stats.pending}
          iconColor="bg-amber-100 text-amber-600"
          href="/approvals?status=pending_manager"
        />
        <StatItem
          icon={CheckCircle2}
          label="Approved Today"
          value={stats.approved_today}
          iconColor="bg-green-100 text-green-600"
        />
        <StatItem
          icon={XCircle}
          label="Rejected Today"
          value={stats.rejected_today}
          iconColor="bg-red-100 text-red-600"
        />
        <StatItem
          icon={UserCheck}
          label="Awaiting Me"
          value={stats.awaiting_my_approval}
          iconColor="bg-purple-100 text-purple-600"
          href="/approvals/pending"
        />
        <StatItem
          icon={TrendingUp}
          label="Completion Rate"
          value={`${stats.completion_rate}%`}
          iconColor="bg-cyan-100 text-cyan-600"
        />
      </div>

      {/* Avg approval time footer */}
      {stats.avg_approval_hours != null && (
        <div className="border-t border-[--color-border] px-5 py-2.5">
          <p className="text-xs text-[--color-foreground-muted]">
            Average approval time:{' '}
            <span className="font-semibold text-[--color-foreground]">
              {stats.avg_approval_hours < 24
                ? `${stats.avg_approval_hours}h`
                : `${Math.round(stats.avg_approval_hours / 24)}d`}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
