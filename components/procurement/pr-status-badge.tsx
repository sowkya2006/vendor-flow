import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type { PRStatus, PRPriority } from '@/types/purchase-request'
import { PR_STATUS_LABELS, PR_PRIORITY_LABELS } from '@/types/purchase-request'

const PR_STATUS_VARIANT: Record<PRStatus, BadgeProps['variant']> = {
  draft: 'outline',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'outline',
  converted: 'success',
}

const PR_PRIORITY_VARIANT: Record<PRPriority, BadgeProps['variant']> = {
  low: 'outline',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
}

export function PRStatusBadge({ status, className }: { status: PRStatus; className?: string }) {
  return (
    <Badge variant={PR_STATUS_VARIANT[status]} className={className}>
      {PR_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PRPriorityBadge({ priority, className }: { priority: PRPriority; className?: string }) {
  return (
    <Badge variant={PR_PRIORITY_VARIANT[priority]} className={className}>
      {PR_PRIORITY_LABELS[priority]}
    </Badge>
  )
}
