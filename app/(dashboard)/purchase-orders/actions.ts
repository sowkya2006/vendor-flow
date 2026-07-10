'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '@/lib/supabase/purchase-orders'
import { purchaseOrderSchema, poStatusSchema } from '@/lib/validations/purchase-order'
import type { PurchaseOrderFormValues } from '@/lib/validations/purchase-order'
import type { PurchaseOrderFormData } from '@/types/purchase-order'

/**
 * Normalise Zod output (which allows '' for optional strings) into the
 * PurchaseOrderFormData shape the library layer expects (null, not '').
 */
function toFormData(values: PurchaseOrderFormValues): PurchaseOrderFormData {
  const emptyToNull = (v: string | null | undefined) =>
    v === '' || v == null ? null : v

  return {
    vendor_id: values.vendor_id,
    rfq_id: emptyToNull(values.rfq_id as string | null | undefined),
    due_date: emptyToNull(values.due_date as string | null | undefined),
    shipping_address: emptyToNull(values.shipping_address as string | null | undefined),
    billing_address: emptyToNull(values.billing_address as string | null | undefined),
    payment_terms: emptyToNull(values.payment_terms as string | null | undefined),
    notes: emptyToNull(values.notes as string | null | undefined),
    items: values.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
    })),
  }
}

export async function createPurchaseOrderAction(values: PurchaseOrderFormValues) {
  const parsed = purchaseOrderSchema.safeParse(values)
  if (!parsed.success) {
    console.error('[PO] Validation failed:', parsed.error.flatten())
    throw new Error('Invalid form data')
  }

  const user = await getUser()
  const companyId = await getCompanyId()
  const po = await createPurchaseOrder(companyId, user.id, toFormData(parsed.data))
  redirect(`/purchase-orders/${po.id}`)
}

export async function updatePurchaseOrderAction(id: string, values: PurchaseOrderFormValues) {
  const parsed = purchaseOrderSchema.safeParse(values)
  if (!parsed.success) {
    console.error('[PO] Validation failed:', parsed.error.flatten())
    throw new Error('Invalid form data')
  }

  const companyId = await getCompanyId()
  await updatePurchaseOrder(id, companyId, toFormData(parsed.data))
  redirect(`/purchase-orders/${id}`)
}

export async function deletePurchaseOrderAction(id: string) {
  const companyId = await getCompanyId()
  await deletePurchaseOrder(id, companyId)
  redirect('/purchase-orders')
}

export async function updatePOStatusAction(id: string, status: string) {
  const parsed = poStatusSchema.safeParse({ status })
  if (!parsed.success) throw new Error('Invalid status')

  const companyId = await getCompanyId()
  await updatePurchaseOrder(id, companyId, {
    status: parsed.data.status,
  } as Partial<PurchaseOrderFormData>)
}
