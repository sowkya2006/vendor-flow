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
      throw new Error(data.error ?? 'Failed to create invoice')
    }

    toast.success('Invoice created successfully!')
    router.push('/vendor/invoices')
    router.refresh()
  }

  return <VendorInvoiceForm po={po} onSubmit={handleSubmit} />
}
