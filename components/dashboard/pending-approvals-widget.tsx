import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPendingApprovals, getApprovalStats } from '@/lib/supabase/approvals'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low:    'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

const ENTITY_LABELS: Record<string, string> = {
  rfq: 'RFQ',
  purchase_order: 'PO',
  quotation: 'Quotation',
  invoice: 'Invoice',
  vendor: 'Vendor',
  contract: 'Contract',
}

export async function PendingApprovalsWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let companyId: string
  try {
    companyId = await getCompanyId()
  } catch {
    return null
  }

  const [pending, stats] = await Promise.all([
    getPendingApprovals(companyId, user.id, { pageSize: 5 }).catch(() => ({ data: [], total: 0, page: 1, pageSize: 5, hasNextPage: false })),
    getApprovalStats(companyId, user.id).catch(() => null),
  ])

  const isEmpty = pending.data.length === 0

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[--color-foreground-muted]" />
          <h3 className="text-sm font-semibold text-[--color-foreground]">
            Pending Your Approval
          </h3>
          {pending.total > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {pending.total}
            </span>
          )}
        </div>
        <Link
          href="/approvals/pending"
          className="text-xs font-medium text-[--color-primary] hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-px bg-[--color-border]">
          {[
            { label: 'Pending',  value: stats.pending ?? 0,        icon: Clock,        color: 'text-amber-600' },
            { label: 'Approved', value: stats.approved_today ?? 0, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'Rejected', value: stats.rejected_today ?? 0, icon: XCircle,      color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center py-3 bg-[--color-background-subtle]">
              <Icon className={cn('h-4 w-4 mb-1', color)} />
              <p className="text-lg font-bold text-[--color-foreground]">{value}</p>
              <p className="text-[11px] text-[--color-foreground-muted]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Approval items */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-[--color-foreground]">All caught up!</p>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">
            No pending approvals assigned to you.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[--color-border]">
          {pending.data.map((item) => (
            <li key={item.id}>
              <Link
                href={`/approvals/${item.id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors"
              >
                {/* Entity badge */}
                <span className="mt-0.5 shrink-0 rounded-md bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-bold text-[--color-primary] uppercase">
                  {ENTITY_LABELS[item.entity_type] ?? item.entity_type}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--color-foreground] truncate">
                    {item.title ?? item.entity_ref}
                  </p>
                  <p className="text-xs text-[--color-foreground-muted] mt-0.5">
                    {item.entity_ref}
                    {item.amount != null && (
                      <span className="ml-1.5 font-medium text-[--color-foreground]">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </p>
                </div>

                {/* Priority + date */}
                <div className="shrink-0 text-right space-y-1">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.normal)}>
                    {item.priority}
                  </span>
                  <p className="text-[11px] text-[--color-foreground-subtle]">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pending.hasNextPage && (
        <div className="border-t border-[--color-border] px-5 py-3">
          <Link
            href="/approvals/pending"
            className="text-xs font-medium text-[--color-primary] hover:underline"
          >
            + {pending.total - 5} more pending approval{pending.total - 5 !== 1 ? 's' : ''}
          </Link>
        </div>
      )}
    </div>
  )
}
