import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type { ApprovalRequestStatus, ApprovalStepStatus, ApprovalPriority } from '@/types/approval'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_PRIORITY_LABELS,
} from '@/types/approval'

// ---------------------------------------------------------------------------
// Request status badge
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<ApprovalRequestStatus, BadgeProps['variant']> = {
  draft: 'outline',
  pending_manager: 'warning',
  pending_procurement: 'warning',
  pending_finance: 'warning',
  pending_final: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'outline',
  completed: 'success',
  returned: 'info',
}

interface ApprovalStatusBadgeProps {
  status: ApprovalRequestStatus
  className?: string
}

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {APPROVAL_STATUS_LABELS[status]}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Step status badge
// ---------------------------------------------------------------------------

const STEP_STATUS_VARIANT: Record<ApprovalStepStatus, BadgeProps['variant']> = {
  pending: 'outline',
  approved: 'success',
  rejected: 'error',
  returned: 'info',
  skipped: 'outline',
}

const STEP_STATUS_LABELS: Record<ApprovalStepStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned',
  skipped: 'Skipped',
}

interface ApprovalStepStatusBadgeProps {
  status: ApprovalStepStatus
  className?: string
}

export function ApprovalStepStatusBadge({ status, className }: ApprovalStepStatusBadgeProps) {
  return (
    <Badge variant={STEP_STATUS_VARIANT[status]} className={className}>
      {STEP_STATUS_LABELS[status]}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------

const PRIORITY_VARIANT: Record<ApprovalPriority, BadgeProps['variant']> = {
  low: 'outline',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
}

interface ApprovalPriorityBadgeProps {
  priority: ApprovalPriority
  className?: string
}

export function ApprovalPriorityBadge({ priority, className }: ApprovalPriorityBadgeProps) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className={className}>
      {APPROVAL_PRIORITY_LABELS[priority]}
    </Badge>
  )
}
