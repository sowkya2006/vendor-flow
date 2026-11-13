'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InvoiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[VendorInvoice] Error:', error.message)
  }, [error])

  return (
    <div className="p-6 max-w-4xl">
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <div>
          <p className="text-base font-semibold text-red-800 dark:text-red-400">
            Something went wrong loading the invoice form
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1 max-w-md mx-auto">
            There was an error loading your purchase order data. Please try again.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} size="sm" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendor/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
