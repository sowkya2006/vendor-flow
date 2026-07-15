import React from 'react'
import { UserPlus, FileText, CheckCircle, DollarSign, Package, AlertTriangle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecentActivity } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDistanceToNow } from 'date-fns'

const iconMap: Record<string, LucideIcon> = {
  UserPlus, FileText, CheckCircle, DollarSign, Package, AlertTriangle,
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-950/50',     icon: 'text-blue-600 dark:text-blue-400'   },
  purple: { bg: 'bg-violet-100 dark:bg-violet-950/50', icon: 'text-violet-600 dark:text-violet-400' },
  green:  { bg: 'bg-emerald-100 dark:bg-emerald-950/50', icon: 'text-emerald-600 dark:text-emerald-400' },
  cyan:   { bg: 'bg-cyan-100 dark:bg-cyan-950/50',     icon: 'text-cyan-600 dark:text-cyan-400'   },
  orange: { bg: 'bg-orange-100 dark:bg-orange-950/50', icon: 'text-orange-600 dark:text-orange-400' },
  red:    { bg: 'bg-red-100 dark:bg-red-950/50',       icon: 'text-red-600 dark:text-red-400'     },
}

export async function RecentActivity() {
  let items: Awaited<ReturnType<typeof getRecentActivity>> = []
  try {
    const companyId = await getCompanyId()
    items = await getRecentActivity(companyId)
  } catch { /* not authenticated */ }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[--color-foreground]">Recent Activity</h3>
          <p className="mt-0.5 text-xs text-[--color-foreground-muted]">Latest events across your workspace</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-2 h-8 w-8 text-[--color-foreground-subtle]" />
          <p className="text-sm text-[--color-foreground-muted]">No activity yet.</p>
          <p className="mt-1 text-xs text-[--color-foreground-subtle]">Activity will appear as you use the platform.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[--color-border]" role="list">
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? FileText
            const colors = colorMap[item.color] ?? colorMap.blue
            const timeAgo = (() => {
              try { return formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) }
              catch { return '—' }
            })()
            return (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[--color-background-subtle]">
                <div className={cn('mt-0.5 shrink-0 rounded-lg p-1.5', colors.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', colors.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-[--color-foreground]">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[--color-foreground-muted]">{item.description}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-[--color-foreground-subtle]">{timeAgo}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
