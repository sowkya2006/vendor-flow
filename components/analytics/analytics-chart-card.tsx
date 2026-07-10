import { cn } from '@/lib/utils'

interface AnalyticsChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function AnalyticsChartCard({
  title, subtitle, children, className, action,
}: AnalyticsChartCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]',
      className,
    )}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[--color-foreground]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}
