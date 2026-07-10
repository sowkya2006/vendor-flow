import { CheckCircle2, Banknote } from 'lucide-react'
import { PaymentMethodBadge } from '@/components/invoices/invoice-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment } from '@/types/invoice'

interface PaymentTimelineProps {
  payments: Payment[]
  currency?: string
}

export function PaymentTimeline({ payments, currency = 'INR' }: PaymentTimelineProps) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-[--color-foreground-muted] italic">No payments recorded yet.</p>
    )
  }

  return (
    <ol className="relative border-l border-[--color-border] space-y-5 ml-2">
      {payments.map((payment) => (
        <li key={payment.id} className="ml-5">
          <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-2 ring-[--color-card] dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
          </span>

          <div className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-4 py-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[--color-foreground]">
                    {formatCurrency(payment.amount)}
                  </span>
                  <PaymentMethodBadge method={payment.payment_method} />
                </div>
                <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                  Ref: {payment.payment_reference}
                  {payment.created_by_user?.full_name
                    ? ` · By ${payment.created_by_user.full_name}`
                    : ''}
                </p>
                {payment.notes && (
                  <p className="mt-1 text-xs text-[--color-foreground-subtle] italic">
                    {payment.notes}
                  </p>
                )}
              </div>
              <time className="shrink-0 text-xs text-[--color-foreground-muted]">
                {formatDate(payment.payment_date)}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
