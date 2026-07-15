import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import type { InvoiceStatus, PaymentMethod } from '@/types/invoice'
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types/invoice'

const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, BadgeProps['variant']> = {
  draft: 'outline',
  submitted: 'warning',
  under_review: 'warning',
  approved: 'info',
  rejected: 'error',
  partially_paid: 'warning',
  paid: 'success',
  cancelled: 'error',
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <Badge variant={INVOICE_STATUS_VARIANT[status]} className={className}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}

const PAYMENT_METHOD_VARIANT: Record<PaymentMethod, BadgeProps['variant']> = {
  bank_transfer: 'info',
  upi: 'success',
  cheque: 'outline',
  cash: 'secondary',
  card: 'info',
}

interface PaymentMethodBadgeProps {
  method: PaymentMethod
  className?: string
}

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  return (
    <Badge variant={PAYMENT_METHOD_VARIANT[method]} className={className}>
      {PAYMENT_METHOD_LABELS[method]}
    </Badge>
  )
}
