import { Package, Warehouse, AlertTriangle, XCircle, TrendingUp, ClipboardCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { InventoryStats } from '@/types/inventory'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: React.ReactNode
  accent?: 'default' | 'warning' | 'error' | 'success'
}

function StatCard({ label, value, sublabel, icon, accent = 'default' }: StatCardProps) {
  const accentClass = {
    default: 'bg-[--color-primary]/10 text-[--color-primary]',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  }[accent]

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-xs font-medium text-[--color-foreground-muted] truncate">{label}</p>
          <p className="mt-1 text-xl font-bold text-[--color-foreground] break-all leading-tight">
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-[--color-foreground-subtle] truncate">{sublabel}</p>
          )}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClass}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface InventoryStatsCardsProps {
  stats: InventoryStats
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total Products"
        value={stats.total_products}
        sublabel="Active products"
        icon={<Package className="h-4 w-4" />}
      />
      <StatCard
        label="Stock Value"
        value={formatCurrency(stats.total_stock_value)}
        sublabel="On-hand valuation"
        icon={<TrendingUp className="h-4 w-4" />}
        accent="success"
      />
      <StatCard
        label="Low Stock"
        value={stats.low_stock_count}
        sublabel="At or below reorder level"
        icon={<AlertTriangle className="h-4 w-4" />}
        accent={stats.low_stock_count > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label="Out of Stock"
        value={stats.out_of_stock_count}
        sublabel="Zero available"
        icon={<XCircle className="h-4 w-4" />}
        accent={stats.out_of_stock_count > 0 ? 'error' : 'default'}
      />
      <StatCard
        label="Warehouses"
        value={stats.total_warehouses}
        sublabel="Active locations"
        icon={<Warehouse className="h-4 w-4" />}
      />
      <StatCard
        label="GRNs (30d)"
        value={stats.recent_grn_count}
        sublabel="Completed receipts"
        icon={<ClipboardCheck className="h-4 w-4" />}
        accent="success"
      />
    </div>
  )
}
