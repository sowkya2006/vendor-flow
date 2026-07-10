import {
  FileText,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Banknote,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { InvoiceStats } from '@/types/invoice'

interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: React.ReactNode
  accent?: 'default' | 'warning' | 'error' | 'success' | 'info'
}

function KpiCard({ label, value, sublabel, icon, accent = 'default' }: KpiCardProps) {
  const accentMap = {
    default: 'bg-[--color-primary]/10 text-[--color-primary]',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[--color-foreground] truncate">{value}</p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-[--color-foreground-subtle]">{sublabel}</p>
          )}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface FinanceKpiCardsProps {
  stats: InvoiceStats
}

export function FinanceKpiCards({ stats }: FinanceKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Total Invoices"
        value={stats.total_invoices}
        sublabel="All time"
        icon={<FileText className="h-4 w-4" />}
      />
      <KpiCard
        label="Pending Approval"
        value={stats.pending_approval}
        sublabel="Awaiting review"
        icon={<Clock className="h-4 w-4" />}
        accent={stats.pending_approval > 0 ? 'warning' : 'default'}
      />
      <KpiCard
        label="Outstanding"
        value={formatCurrency(stats.outstanding_amount)}
        sublabel="Approved, unpaid"
        icon={<TrendingDown className="h-4 w-4" />}
        accent={stats.outstanding_amount > 0 ? 'info' : 'default'}
      />
      <KpiCard
        label="Paid This Month"
        value={formatCurrency(stats.paid_this_month)}
        sublabel="Calendar month"
        icon={<CheckCircle2 className="h-4 w-4" />}
        accent="success"
      />
      <KpiCard
        label="Overdue"
        value={stats.overdue_count}
        sublabel="Past due date"
        icon={<AlertTriangle className="h-4 w-4" />}
        accent={stats.overdue_count > 0 ? 'error' : 'default'}
      />
      <KpiCard
        label="Today's Payments"
        value={formatCurrency(stats.todays_payments)}
        sublabel="Recorded today"
        icon={<Banknote className="h-4 w-4" />}
        accent={stats.todays_payments > 0 ? 'success' : 'default'}
      />
    </div>
  )
}
