import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageContainer — wraps page content with consistent padding.
 * Use inside every page after WorkspaceHeader.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}
