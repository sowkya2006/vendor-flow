import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AnalyticsKpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  accent?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
  className?: string
}

const accentMap = {
  default: 'bg-[--color-primary]/10 text-[--color-primary]',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export function AnalyticsKpiCard({
  label, value, sublabel, icon: Icon, accent = 'default', className,
}: AnalyticsKpiCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]',
      className,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground] truncate">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-[--color-foreground-subtle]">{sublabel}</p>}
        </div>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accentMap[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
