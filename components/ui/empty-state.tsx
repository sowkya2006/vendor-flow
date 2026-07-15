import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Icon component — typically a Lucide icon */
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  /** Compact mode — less padding, smaller text */
  compact?: boolean
}

/**
 * EmptyState — consistent empty state pattern across all modules.
 * Shows an icon, title, optional description, and optional CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-10 px-4' : 'gap-3 py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className={cn(
          'flex items-center justify-center rounded-2xl bg-[--color-background-muted]',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}>
          <Icon className={cn(
            'text-[--color-foreground-subtle]',
            compact ? 'h-5 w-5' : 'h-7 w-7',
          )} />
        </div>
      )}

      <div className="space-y-1">
        <p className={cn(
          'font-semibold text-[--color-foreground]',
          compact ? 'text-sm' : 'text-base',
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            'text-[--color-foreground-muted] max-w-xs mx-auto leading-relaxed',
            compact ? 'text-xs' : 'text-sm',
          )}>
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
