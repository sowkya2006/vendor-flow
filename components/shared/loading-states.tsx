'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Skeleton Base ─────────────────────────────────────────────────────────────
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-[length:200%_100%]',
        'bg-gradient-to-r from-[--color-muted] via-[--color-accent] to-[--color-muted]',
        'rounded',
        className
      )}
      style={style}
    />
  )
}

// ── KPI Card Skeleton ─────────────────────────────────────────────────────────
export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-2.5 w-32" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// ── Chart Skeleton ────────────────────────────────────────────────────────────
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
      <div className="mb-4">
        <Skeleton className="h-3.5 w-32 mb-1" />
        <Skeleton className="h-2.5 w-48" />
      </div>
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
    </div>
  )
}

// ── Table Skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-28" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard Loading State ───────────────────────────────────────────────────
export function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Tables */}
      <TableSkeleton />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-12 px-6 text-center',
        className
      )}
    >
      {icon && <div className="mb-3 text-[--color-foreground-subtle]">{icon}</div>}
      <p className="text-sm font-medium text-[--color-foreground]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[--color-foreground-muted] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────
export interface ErrorStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content. Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-[--color-error]/20 bg-[--color-error-bg] py-12 px-6 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[--color-error]/10 text-[--color-error]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[--color-foreground]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[--color-foreground-muted] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
