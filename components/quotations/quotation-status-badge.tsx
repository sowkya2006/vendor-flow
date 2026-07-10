import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type { QuotationStatus } from '@/types/quotation'
import { QUOTATION_STATUS_LABELS } from '@/types/quotation'

const STATUS_VARIANT: Record<QuotationStatus, BadgeProps['variant']> = {
  draft: 'outline',
  submitted: 'info',
  under_review: 'warning',
  shortlisted: 'info',
  approved: 'success',
  rejected: 'error',
  expired: 'outline',
}

interface QuotationStatusBadgeProps {
  status: QuotationStatus
  className?: string
}

export function QuotationStatusBadge({ status, className }: QuotationStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  )
}
