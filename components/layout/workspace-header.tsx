import React from 'react'
import { cn } from '@/lib/utils'

interface WorkspaceHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  /** Optional meta chips shown below title on mobile / inline on desktop */
  meta?: React.ReactNode
  className?: string
  compact?: boolean
}

/**
 * WorkspaceHeader — premium page-level header used across all module pages.
 * Features a subtle left accent gradient line, icon slot, badge, and actions.
 */
export function WorkspaceHeader({
  title,
  description,
  actions,
  icon,
  badge,
  meta,
  compact = false,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        'relative border-b',
        compact ? 'px-6 py-3.5' : 'px-6 py-5',
        className,
      )}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top accent gradient line */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(79,140,255,0.5), rgba(139,92,246,0.3), transparent)' }} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — icon + title + description */}
        <div className="flex items-start gap-3.5 min-w-0">
          {icon && (
            <div className={cn(
              'shrink-0 flex items-center justify-center rounded-xl',
              compact ? 'h-8 w-8' : 'h-10 w-10',
            )}
              style={{
                background: 'rgba(79,140,255,0.12)',
                border: '1px solid rgba(79,140,255,0.25)',
                color: '#4F8CFF',
              }}>
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={cn(
                'font-bold tracking-tight truncate',
                compact ? 'text-[15px]' : 'text-xl',
              )}
                style={{ color: '#F5F5F5', letterSpacing: '-0.02em' }}>
                {title}
              </h1>
              {badge}
            </div>

            {description && (
              <p className={cn(
                'mt-0.5 truncate',
                compact ? 'text-xs' : 'text-sm',
              )}
                style={{ color: '#AEB4C2' }}>
                {description}
              </p>
            )}

            {meta && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {meta}
              </div>
            )}
          </div>
        </div>

        {/* Right — action buttons */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
