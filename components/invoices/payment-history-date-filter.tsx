'use client'

import Link from 'next/link'

interface PaymentHistoryDateFilterProps {
  paymentMethod: string
  fromDate: string
  toDate: string
  clearHref: string
}

/**
 * Client component that owns the two date <input> elements whose onChange
 * handler submits the enclosing form. Everything else on the history page
 * stays a Server Component.
 */
export function PaymentHistoryDateFilter({
  paymentMethod,
  fromDate,
  toDate,
  clearHref,
}: PaymentHistoryDateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-5 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-3">
      <span className="text-xs font-medium text-[--color-foreground-muted]">Filter by date:</span>

      {/* From date */}
      <div className="flex items-center gap-2">
        <label
          className="text-xs text-[--color-foreground-muted]"
          htmlFor="from_date_input"
        >
          From
        </label>
        <form method="get" action="/payments/history">
          {paymentMethod && (
            <input type="hidden" name="payment_method" value={paymentMethod} />
          )}
          {toDate && <input type="hidden" name="to_date" value={toDate} />}
          <input
            id="from_date_input"
            type="date"
            name="from_date"
            defaultValue={fromDate}
            className="h-8 rounded-md border border-[--color-input] bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
            onChange={(e) => (e.target.form as HTMLFormElement).submit()}
          />
        </form>
      </div>

      {/* To date */}
      <div className="flex items-center gap-2">
        <label
          className="text-xs text-[--color-foreground-muted]"
          htmlFor="to_date_input"
        >
          To
        </label>
        <form method="get" action="/payments/history">
          {paymentMethod && (
            <input type="hidden" name="payment_method" value={paymentMethod} />
          )}
          {fromDate && <input type="hidden" name="from_date" value={fromDate} />}
          <input
            id="to_date_input"
            type="date"
            name="to_date"
            defaultValue={toDate}
            className="h-8 rounded-md border border-[--color-input] bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]"
            onChange={(e) => (e.target.form as HTMLFormElement).submit()}
          />
        </form>
      </div>

      {(fromDate || toDate) && (
        <Link href={clearHref} className="text-xs text-[--color-primary] hover:underline">
          Clear dates
        </Link>
      )}
    </div>
  )
}
