'use client'

import { VendorInvoiceForm } from './vendor-invoice-form'
import type { POForInvoice } from '@/types/vendor-portal-types'
import type { CreateVendorInvoiceInput } from '@/lib/validations/vendor-portal'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  po: POForInvoice
}

export function VendorInvoiceFormWrapper({ po }: Props) {
  const router = useRouter()

  async function handleSubmit(values: CreateVendorInvoiceInput) {
    const res = await fetch('/api/vendor/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const data = await res.json()

    if (!res.ok) {
      // Make duplicate invoice number error user-friendly
      const msg = data.error ?? 'Failed to create invoice'
      if (msg.includes('duplicate key') && msg.includes('invoice_number')) {
        throw new Error('Invoice number already exists. Please use a different invoice number (e.g. INV-2026-003).')
      }
      throw new Error(msg)
    }

    toast.success('Invoice created successfully!')
    router.push('/vendor/invoices')
    router.refresh()
  }

  return <VendorInvoiceForm po={po} onSubmit={handleSubmit} />
}
