'use client'

import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { POForm } from './po-form'
import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from '@/app/(dashboard)/purchase-orders/actions'
import type { PurchaseOrder } from '@/types/purchase-order'
import type { VendorSummary } from '@/types/vendor'
import type { PurchaseOrderFormValues } from '@/lib/validations/purchase-order'

interface POFormClientProps {
  po?: PurchaseOrder
  vendors: VendorSummary[]
  mode: 'create' | 'edit'
}

export function POFormClient({ po, vendors, mode }: POFormClientProps) {
  const handleSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      if (mode === 'create') {
        await createPurchaseOrderAction(values)
      } else if (po) {
        await updatePurchaseOrderAction(po.id, values)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error(mode === 'create' ? 'Failed to create purchase order' : 'Failed to update purchase order')
      throw err
    }
  }

  return <POForm po={po} vendors={vendors} onSubmit={handleSubmit} mode={mode} />
}
