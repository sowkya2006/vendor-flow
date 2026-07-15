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
import { triggerApproval } from '@/lib/supabase/auto-approve'
import { guardPermission } from '@/lib/supabase/permission-guard'
import { notify } from '@/lib/notifications/engine'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// createPurchaseOrderFromQuotationAction
// THE only valid way to create a PO — must originate from an approved quotation
// ─────────────────────────────────────────────────────────────────────────────
const fromQuotationSchema = z.object({
  quotation_id: z.string().uuid('Invalid quotation'),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function createPurchaseOrderFromQuotationAction(input: unknown) {
  await guardPermission('manage_purchase_orders')
  const parsed = fromQuotationSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input: ' + JSON.stringify(parsed.error.flatten()))

  const user = await getUser()
  const companyId = await getCompanyId()

  const { createClient } = await import('@/lib/supabase/server')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: quotation } = await supabase
    .from('quotations')
    .select(`id, quotation_number, vendor_id, rfq_id, status,
      grand_total, payment_terms, delivery_days,
      items:quotation_items(item_name, description, quantity, unit, unit_price, tax_pct)`)
    .eq('id', parsed.data.quotation_id)
    .eq('company_id', companyId)
    .single()

  if (!quotation) throw new Error('Quotation not found')
  if (quotation.status !== 'approved') {
    throw new Error('Only approved quotations can be used to create a Purchase Order')
  }

  const poData: PurchaseOrderFormData = {
    vendor_id: quotation.vendor_id,
    rfq_id: quotation.rfq_id ?? null,
    quotation_id: parsed.data.quotation_id,
    due_date: parsed.data.due_date ?? null,
    payment_terms: quotation.payment_terms ?? null,
    notes: parsed.data.notes ?? null,
    items: (quotation.items ?? []).map((item: {
      item_name: string; description: string | null
      quantity: number; unit: string | null; unit_price: number
    }) => ({
      description: item.item_name ?? item.description ?? 'Item',
      quantity: item.quantity,
      unit: item.unit ?? 'unit',
      unit_price: item.unit_price,
    })),
  }

  const po = await createPurchaseOrder(companyId, user.id, poData)
  const poRef = (po as { po_number?: string }).po_number ?? po.id

  await notify({
    event: 'PO_CREATED',
    companyId,
    triggeredBy: user.id,
    triggeredByName: user.user_metadata?.full_name ?? user.email ?? 'Procurement Officer',
    entityId: po.id,
    entityRef: poRef,
    entityType: 'purchase_order',
    meta: { quotationRef: quotation.quotation_number ?? '' },
  })

  await triggerApproval({
    companyId,
    userId: user.id,
    entityType: 'purchase_order',
    entityId: po.id,
    entityRef: poRef,
    title: `Purchase Order: ${poRef} (from ${quotation.quotation_number})`,
    amount: quotation.grand_total ?? undefined,
    priority: 'normal',
  })

  redirect(`/purchase-orders/${po.id}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// createPurchaseOrderAction — legacy stub, redirects to quotation-based flow
// ─────────────────────────────────────────────────────────────────────────────
export async function createPurchaseOrderAction(_values: PurchaseOrderFormValues) {
  await guardPermission('manage_purchase_orders')
  redirect('/purchase-orders/new')
}

// ─────────────────────────────────────────────────────────────────────────────
// Update / Delete
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePurchaseOrderAction(id: string, values: PurchaseOrderFormValues) {
  await guardPermission('manage_purchase_orders')
  const parsed = purchaseOrderSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')
  const companyId = await getCompanyId()
  await updatePurchaseOrder(id, companyId, toFormData(parsed.data))
  redirect(`/purchase-orders/${id}`)
}

export async function deletePurchaseOrderAction(id: string) {
  await guardPermission('manage_purchase_orders')
  const companyId = await getCompanyId()
  await deletePurchaseOrder(id, companyId)
  redirect('/purchase-orders')
}

// ─────────────────────────────────────────────────────────────────────────────
// Status transitions (approve, send, acknowledge, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePOStatusAction(id: string, status: string) {
  const parsed = poStatusSchema.safeParse({ status })
  if (!parsed.success) throw new Error('Invalid status')

  const user = await getUser()
  const companyId = await getCompanyId()
  await updatePurchaseOrder(id, companyId, { status: parsed.data.status } as Partial<PurchaseOrderFormData>)

  const s = parsed.data.status
  if (s === 'approved') {
    await notify({ event: 'PO_APPROVED', companyId, triggeredBy: user.id, entityId: id, entityRef: id, entityType: 'purchase_order' })
  } else if (s === 'sent') {
    await notify({ event: 'PO_SENT_TO_VENDOR', companyId, triggeredBy: user.id, entityId: id, entityRef: id, entityType: 'purchase_order' })

    // Notify the vendor that a PO has been sent to them
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = createAdminClient() as any
      const { data: po } = await admin
        .from('purchase_orders')
        .select('vendor_id, po_number, total_amount')
        .eq('id', id)
        .maybeSingle()
      if (po?.vendor_id) {
        const { notifyVendor } = await import('@/lib/notifications/engine')
        await notifyVendor(po.vendor_id, {
          type: 'po_issued',
          title: `Purchase Order Received: ${po.po_number}`,
          body: `You have received a new Purchase Order (${po.po_number}) for ₹${Number(po.total_amount ?? 0).toLocaleString('en-IN')}. Please review and respond.`,
          link: `/vendor/purchase-orders/${id}`,
          entityType: 'purchase_order',
          entityId: id,
          companyId,
        })
      }
    } catch { /* non-critical */ }

  } else if (s === 'acknowledged') {
    await notify({ event: 'PO_ACKNOWLEDGED', companyId, triggeredBy: user.id, entityId: id, entityRef: id, entityType: 'purchase_order' })
  }
}
