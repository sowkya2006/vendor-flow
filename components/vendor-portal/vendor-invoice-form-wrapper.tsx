'use client'

/**
 * VendorInvoiceFormWrapper — client component that imports the server action
 * dynamically to avoid the server-only module being bundled into the client.
 */
import { useState, useTransition } from 'react'
import { VendorInvoiceForm } from './vendor-invoice-form'
import type { POForInvoice } from '@/types/vendor-portal-types'
import type { CreateVendorInvoiceInput } from '@/lib/validations/vendor-portal'

interface Props {
  po: POForInvoice
}

export function VendorInvoiceFormWrapper({ po }: Props) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: CreateVendorInvoiceInput) {
    setError(null)
    startTransition(async () => {
      try {
        // Dynamically import the server action to keep it out of client bundle
        const { createVendorInvoiceAction } = await import('@/app/vendor/actions')
        await createVendorInvoiceAction(values)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create invoice')
        throw e
      }
    })
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <VendorInvoiceForm po={po} onSubmit={handleSubmit} />
    </>
  )
}
