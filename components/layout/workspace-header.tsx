import React from 'react'
import { cn } from '@/lib/utils'

interface WorkspaceHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

/**
 * WorkspaceHeader — reusable page-level header.
 * Used at the top of every main content page to show the page
 * title, optional description, and action buttons.
 */
export function WorkspaceHeader({
  title,
  description,
  actions,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b border-[--color-border] bg-[--color-background] px-6 py-4',
        'sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-xl font-semibold text-[--color-foreground]">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-[--color-foreground-muted]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
