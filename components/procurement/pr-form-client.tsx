'use client'

import { toast } from 'sonner'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { PRForm } from './pr-form'
import { createPRAction, updatePRAction } from '@/app/(dashboard)/procurement/actions'
import type { PurchaseRequest } from '@/types/purchase-request'
import type { PRFormValues } from '@/lib/validations/purchase-request'

interface PRFormClientProps {
  pr?: PurchaseRequest
  mode: 'create' | 'edit'
}

export function PRFormClient({ pr, mode }: PRFormClientProps) {
  const handleSubmit = async (values: PRFormValues) => {
    try {
      if (mode === 'create') {
        await createPRAction(values)
      } else if (pr) {
        await updatePRAction(pr.id, values)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error(mode === 'create' ? 'Failed to create purchase request' : 'Failed to update purchase request')
      throw err
    }
  }

  return <PRForm pr={pr} onSubmit={handleSubmit} mode={mode} />
}
