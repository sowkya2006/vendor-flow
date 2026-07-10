import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type { RFQStatus, RFQPriority } from '@/types/rfq'
import { RFQ_STATUS_LABELS, RFQ_PRIORITY_LABELS } from '@/types/rfq'
import type { POStatus } from '@/types/purchase-order'
import { PO_STATUS_LABELS } from '@/types/purchase-order'

// ── RFQ Status ────────────────────────────────────────────────────────────────

const RFQ_STATUS_VARIANT: Record<RFQStatus, BadgeProps['variant']> = {
  draft: 'outline',
  sent: 'info',
  under_review: 'warning',
  awarded: 'success',
  cancelled: 'error',
}

interface RFQStatusBadgeProps {
  status: RFQStatus
  className?: string
}

export function RFQStatusBadge({ status, className }: RFQStatusBadgeProps) {
  return (
    <Badge variant={RFQ_STATUS_VARIANT[status]} className={className}>
      {RFQ_STATUS_LABELS[status]}
    </Badge>
  )
}

// ── RFQ Priority ──────────────────────────────────────────────────────────────

const RFQ_PRIORITY_VARIANT: Record<RFQPriority, BadgeProps['variant']> = {
  low: 'outline',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
}

interface RFQPriorityBadgeProps {
  priority: RFQPriority
  className?: string
}

export function RFQPriorityBadge({ priority, className }: RFQPriorityBadgeProps) {
  return (
    <Badge variant={RFQ_PRIORITY_VARIANT[priority]} className={className}>
      {RFQ_PRIORITY_LABELS[priority]}
    </Badge>
  )
}

// ── PO Status ─────────────────────────────────────────────────────────────────

const PO_STATUS_VARIANT: Record<POStatus, BadgeProps['variant']> = {
  draft: 'outline',
  pending_approval: 'warning',
  approved: 'info',
  sent: 'info',
  acknowledged: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

interface POStatusBadgeProps {
  status: POStatus
  className?: string
}

export function POStatusBadge({ status, className }: POStatusBadgeProps) {
  return (
    <Badge variant={PO_STATUS_VARIANT[status]} className={className}>
      {PO_STATUS_LABELS[status]}
    </Badge>
  )
}
