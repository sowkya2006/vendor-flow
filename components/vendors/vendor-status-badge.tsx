import { Badge } from '@/components/ui/badge'
import type { VendorStatus } from '@/types/vendor'

const STATUS_CONFIG: Record<
  VendorStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' }
> = {
  active: { label: 'Active', variant: 'default' },
  pending: { label: 'Pending', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'outline' },
  suspended: { label: 'Suspended', variant: 'destructive' },
}

interface VendorStatusBadgeProps {
  status: VendorStatus
  className?: string
}

export function VendorStatusBadge({ status, className }: VendorStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
