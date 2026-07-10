'use client'

import { cn } from '@/lib/utils'
import { getStockStatus, STOCK_STATUS_LABELS, type StockStatus } from '@/types/inventory'

interface StockStatusBadgeProps {
  available: number
  reorderLevel: number
  maxStock?: number | null
  className?: string
}

const STOCK_STATUS_STYLES: Record<StockStatus, string> = {
  in_stock: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  low_stock: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  overstocked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export function StockStatusBadge({
  available,
  reorderLevel,
  maxStock,
  className,
}: StockStatusBadgeProps) {
  const status = getStockStatus(available, reorderLevel, maxStock)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STOCK_STATUS_STYLES[status],
        className,
      )}
    >
      {STOCK_STATUS_LABELS[status]}
    </span>
  )
}

interface ProductStatusBadgeProps {
  status: 'active' | 'inactive' | 'discontinued'
  className?: string
}

const PRODUCT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-[--color-muted] text-[--color-foreground-muted]',
  discontinued: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
}

export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        PRODUCT_STATUS_STYLES[status] ?? PRODUCT_STATUS_STYLES.inactive,
        className,
      )}
    >
      {PRODUCT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface GrnStatusBadgeProps {
  status: 'draft' | 'completed' | 'cancelled'
  className?: string
}

const GRN_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[--color-muted] text-[--color-foreground-muted]',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const GRN_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function GrnStatusBadge({ status, className }: GrnStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        GRN_STATUS_STYLES[status] ?? GRN_STATUS_STYLES.draft,
        className,
      )}
    >
      {GRN_STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface TransactionTypeBadgeProps {
  type: string
  className?: string
}

const TX_TYPE_STYLES: Record<string, string> = {
  stock_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  stock_out: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  adjustment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  grn: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  reservation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  reservation_release: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

const TX_TYPE_LABELS: Record<string, string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  adjustment: 'Adjustment',
  grn: 'GRN Receipt',
  reservation: 'Reservation',
  reservation_release: 'Release',
}

export function TransactionTypeBadge({ type, className }: TransactionTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TX_TYPE_STYLES[type] ?? 'bg-[--color-muted] text-[--color-foreground-muted]',
        className,
      )}
    >
      {TX_TYPE_LABELS[type] ?? type}
    </span>
  )
}
