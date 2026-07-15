'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  adjustInventory,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createGrn,
  updateGrnStatus,
  deleteGrn,
} from '@/lib/supabase/inventory'
import {
  adjustInventorySchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  createGrnSchema,
  updateGrnSchema,
} from '@/lib/validations/inventory'
import type {
  AdjustInventoryInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateGrnInput,
  UpdateGrnInput,
} from '@/lib/validations/inventory'

// ── Stock adjustment ──────────────────────────────────────────
export async function adjustInventoryAction(values: AdjustInventoryInput) {
  const parsed = adjustInventorySchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid adjustment data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()
  await adjustInventory(companyId, user.id, parsed.data)
  revalidatePath('/inventory')
}

// ── Warehouses ────────────────────────────────────────────────
export async function createWarehouseAction(values: CreateWarehouseInput) {
  const parsed = createWarehouseSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid warehouse data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  const warehouse = await createWarehouse(companyId, parsed.data)
  redirect(`/inventory/warehouses`)
}

export async function updateWarehouseAction(id: string, values: UpdateWarehouseInput) {
  const parsed = updateWarehouseSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid warehouse data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  await updateWarehouse(id, companyId, parsed.data)
  redirect(`/inventory/warehouses`)
}

export async function deleteWarehouseAction(id: string) {
  const companyId = await getCompanyId()
  await deleteWarehouse(id, companyId)
  redirect('/inventory/warehouses')
}

// ── GRN ───────────────────────────────────────────────────────
export async function createGrnAction(values: CreateGrnInput) {
  const parsed = createGrnSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid GRN data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()
  const grn = await createGrn(companyId, user.id, parsed.data)

  // Notify WM, PO, FM, Admin
  const { notify } = await import('@/lib/notifications/engine')
  await notify({
    event: 'GRN_CREATED',
    companyId,
    triggeredBy: user.id,
    entityId: grn.id,
    entityRef: (grn as { grn_number?: string }).grn_number ?? grn.id,
    entityType: 'grn',
  })

  redirect(`/inventory/grn/${grn.id}`)
}

export async function completeGrnAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateGrnStatus(id, companyId, user.id, { status: 'completed' })

  // Notify all relevant roles that GRN is completed
  try {
    const { notify } = await import('@/lib/notifications/engine')
    await notify({
      event: 'GRN_CREATED',
      companyId,
      triggeredBy: user.id,
      entityId: id,
      entityRef: id,
      entityType: 'grn',
    })
  } catch { /* non-critical */ }

  // Notify the vendor — their goods have been received, they can now invoice
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: grn } = await db
      .from('grn')
      .select('grn_number, purchase_order_id, purchase_order:purchase_orders(vendor_id, po_number)')
      .eq('id', id)
      .maybeSingle()

    const vendorId = (grn?.purchase_order as { vendor_id?: string } | null)?.vendor_id
    const poNumber = (grn?.purchase_order as { po_number?: string } | null)?.po_number

    if (vendorId) {
      const { notifyVendor } = await import('@/lib/notifications/engine')
      await notifyVendor(vendorId, {
        type: 'general',
        title: `Goods Received: ${grn.grn_number}`,
        body: `Your goods delivery for ${poNumber ? `PO ${poNumber}` : 'your Purchase Order'} has been received and accepted. You can now create an invoice.`,
        link: `/vendor/invoices/new`,
        entityType: 'grn',
        entityId: id,
        companyId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath(`/inventory/grn/${id}`)
  revalidatePath('/inventory')
  revalidatePath('/inventory/grn')
  revalidatePath('/analytics/inventory')
  revalidatePath('/products')
}

/**
 * Re-sync inventory for an already-completed GRN.
 * Use this when a GRN was completed before the sync logic existed.
 */
export async function resyncGrnInventoryAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()

  // Import the sync function directly
  const { syncInventoryFromGRNPublic } = await import('@/lib/supabase/inventory')
  await syncInventoryFromGRNPublic(id, companyId, user.id)

  revalidatePath(`/inventory/grn/${id}`)
  revalidatePath('/inventory')
  revalidatePath('/inventory/grn')
  revalidatePath('/analytics/inventory')
  revalidatePath('/products')
}

export async function cancelGrnAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateGrnStatus(id, companyId, user.id, { status: 'cancelled' })
  revalidatePath(`/inventory/grn/${id}`)
}

export async function deleteGrnAction(id: string) {
  const companyId = await getCompanyId()
  await deleteGrn(id, companyId)
  redirect('/inventory/grn')
}
