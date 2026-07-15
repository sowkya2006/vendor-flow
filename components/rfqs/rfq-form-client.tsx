'use client'

import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { RFQForm } from './rfq-form'
import { createRFQAction, updateRFQAction } from '@/app/(dashboard)/rfqs/actions'
import type { RFQ } from '@/types/rfq'
import type { VendorSummary } from '@/types/vendor'
import type { RFQFormValues } from '@/lib/validations/rfq'

interface RFQFormClientProps {
  rfq?: RFQ
  vendors: VendorSummary[]
  mode: 'create' | 'edit'
}

export function RFQFormClient({ rfq, vendors, mode }: RFQFormClientProps) {
  const handleSubmit = async (values: RFQFormValues) => {
    try {
      if (mode === 'create') {
        await createRFQAction(values)
      } else if (rfq) {
        await updateRFQAction(rfq.id, values)
      }
      // redirect() in the action will navigate before this line is reached
    } catch (err) {
      if (isRedirectError(err)) throw err
      // Show the actual error message so we can debug
      const message = err instanceof Error ? err.message : String(err)
      console.error('[RFQFormClient] submit error:', err)
      toast.error(message || (mode === 'create' ? 'Failed to create RFQ' : 'Failed to update RFQ'))
      throw err
    }
  }

  return (
    <RFQForm
      rfq={rfq}
      vendors={vendors}
      onSubmit={handleSubmit}
      mode={mode}
    />
  )
}
